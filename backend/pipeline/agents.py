"""Multi-agent verification pipeline built on the OpenAI Agents SDK.

Flow per job:
  1. Extract PDF + ID (vision, structured outputs)  -> done in extract.py
  2. Agent A (deep research, web search)  ┐ run in parallel
     Agent B (document cross-check)       ┘
  3. Agent C (synthesis) -> VerificationReport

Every meaningful step (reasoning, tool call, tool result, final output) is emitted to the
job's EventBus so the frontend can render the ReAct loop live.
"""

from __future__ import annotations

import asyncio
import re
from typing import Any

from agents import Agent, ModelSettings, Runner, WebSearchTool

from pipeline.config import (
    CROSSCHECK_MODEL,
    DEEP_RESEARCH_MODEL,
    SYNTHESIS_MODEL,
    VALYU_API_KEY,
)
from pipeline.extract import extract_application, extract_id
from pipeline.logging_setup import get_logger
from pipeline.schemas import (
    CrossCheckFindings,
    ResearchFindings,
    VerificationReport,
)
from pipeline.streaming import EventBus
from pipeline.valyu_research import run_deep_research

log = get_logger("pipeline")
from prompts import (
    AGENT_A_INSTRUCTIONS,
    AGENT_B_INSTRUCTIONS,
    AGENT_C_INSTRUCTIONS,
    build_agent_a_input,
    build_agent_b_input,
    build_agent_c_input,
)


# --------------------------------------------------------------------------- #
# Agent definitions
# --------------------------------------------------------------------------- #
def _build_research_agent() -> Agent:
    # Deep-research models output a cited narrative report (not a strict schema),
    # so Agent A returns free text; Agent C structures the final result.
    return Agent(
        name="Agent A — Internet Research",
        instructions=AGENT_A_INSTRUCTIONS,
        model=DEEP_RESEARCH_MODEL,
        tools=[WebSearchTool()],
    )


def _reasoning_settings(model: str, effort: str) -> ModelSettings:
    """Only o-series reasoning models accept `reasoning.effort`; gpt-4o/4.1 do not."""
    if model.startswith(("o1", "o3", "o4")):
        return ModelSettings(reasoning={"effort": effort})
    return ModelSettings()


def _build_crosscheck_agent() -> Agent:
    return Agent(
        name="Agent B — Document Cross-Check",
        instructions=AGENT_B_INSTRUCTIONS,
        model=CROSSCHECK_MODEL,
        model_settings=_reasoning_settings(CROSSCHECK_MODEL, "medium"),
        output_type=CrossCheckFindings,
    )


def _build_synthesis_agent() -> Agent:
    return Agent(
        name="Agent C — Synthesis",
        instructions=AGENT_C_INSTRUCTIONS,
        model=SYNTHESIS_MODEL,
        model_settings=_reasoning_settings(SYNTHESIS_MODEL, "medium"),
        # No web-search tool: C synthesizes A+B in a single pass. Giving it a search
        # loop made it re-send growing context each turn and blow the o3 TPM limit.
        output_type=VerificationReport,
    )


# --------------------------------------------------------------------------- #
# Streamed runner that mirrors agent activity onto the event bus
# --------------------------------------------------------------------------- #
_RATE_LIMIT_MARKERS = ("rate limit", "429", "tokens per min", "tpm")


def _retry_after_seconds(err: Exception, default: float = 12.0) -> float:
    """Pull the 'try again in N s' hint from an OpenAI rate-limit error, else default."""
    m = re.search(r"try again in ([\d.]+)\s*s", str(err))
    return float(m.group(1)) + 1.0 if m else default


async def _run_streamed(
    agent: Agent, agent_tag: str, input_text: str, bus: EventBus, max_attempts: int = 4
) -> Any:
    """Run an agent with streaming and emit steps to the bus. Retries on rate limits.

    On a 429/TPM error we wait the suggested cooldown and restart the agent. A retry
    re-emits the stream from the top (the model is stateless across attempts), which is
    fine for the demo — the user just sees the agent begin again.
    """
    log.info("[Agent %s] %s starting (model=%s)", agent_tag, agent.name, agent.model)
    await bus.emit("agent_start", agent=agent_tag, message=f"{agent.name} started")

    for attempt in range(1, max_attempts + 1):
        try:
            result = Runner.run_streamed(agent, input=input_text)
            async for event in result.stream_events():
                log.debug("[Agent %s] raw stream event: %s", agent_tag, event.type)
                if event.type == "run_item_stream_event":
                    item = event.item
                    kind = getattr(item, "type", "")
                    log.info("[Agent %s] item: %s", agent_tag, kind)

                    if kind == "tool_call_item":
                        raw = getattr(item, "raw_item", None)
                        query = _extract_search_query(raw)
                        log.info("[Agent %s] >> web search: %s", agent_tag, query)
                        await bus.emit(
                            "tool_call",
                            agent=agent_tag,
                            message=f"Searching: {query}" if query else "Tool call",
                            data={"query": query},
                        )
                    elif kind == "tool_call_output_item":
                        log.info("[Agent %s] << search results received", agent_tag)
                        await bus.emit("tool_result", agent=agent_tag, message="Received search results")
                    elif kind == "reasoning_item":
                        summary = _extract_reasoning(item)
                        if summary:
                            log.info("[Agent %s] reasoning: %s", agent_tag, summary[:200])
                            await bus.emit("reasoning", agent=agent_tag, message=summary)
                    elif kind == "message_output_item":
                        await bus.emit("reasoning", agent=agent_tag, message="Drafting findings…")
                elif event.type == "agent_updated_stream_event":
                    log.info("[Agent %s] agent updated", agent_tag)
            break  # streamed to completion
        except Exception as exc:
            is_rate_limit = any(mark in str(exc).lower() for mark in _RATE_LIMIT_MARKERS)
            if is_rate_limit and attempt < max_attempts:
                wait = _retry_after_seconds(exc)
                log.warning("[Agent %s] rate limited (attempt %d/%d); waiting %.1fs",
                            agent_tag, attempt, max_attempts, wait)
                await bus.emit("tool_result", agent=agent_tag,
                               message=f"Rate limited — retrying in {wait:.0f}s…")
                await asyncio.sleep(wait)
                continue
            raise

    log.info("[Agent %s] %s finished", agent_tag, agent.name)
    await bus.emit("agent_done", agent=agent_tag, message=f"{agent.name} finished")
    return result.final_output


def _extract_search_query(raw: Any) -> str | None:
    """Best-effort pull of the search query string from a hosted web-search tool call."""
    if raw is None:
        return None
    action = getattr(raw, "action", None)
    if action is not None:
        q = getattr(action, "query", None)
        if q:
            return q
    for attr in ("query", "arguments"):
        val = getattr(raw, attr, None)
        if isinstance(val, str) and val:
            return val
    return None


def _extract_reasoning(item: Any) -> str | None:
    raw = getattr(item, "raw_item", None)
    summary = getattr(raw, "summary", None)
    if summary:
        parts = [getattr(s, "text", "") for s in summary]
        text = " ".join(p for p in parts if p).strip()
        return text or None
    return None


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #
async def _research_agent_a(app_dict: dict, bus: EventBus):
    """Agent A: Valyu DeepResearch when configured, else the OpenAI web-search agent."""
    if VALYU_API_KEY:
        try:
            return await run_deep_research(app_dict, bus)
        except Exception as exc:
            log.exception("Valyu DeepResearch failed; falling back to OpenAI web search: %s", exc)
            await bus.emit("tool_result", agent="A",
                           message="Valyu unavailable — falling back to OpenAI web search")
    return await _run_streamed(
        _build_research_agent(), "A", build_agent_a_input(app_dict), bus
    )



async def run_pipeline(
    pdf_bytes: bytes,
    id_bytes: bytes,
    id_mime: str,
    pdf_filename: str,
    bus: EventBus,
) -> VerificationReport:
    # --- Stage 1: extraction -------------------------------------------------
    log.info("=== PIPELINE START === pdf=%s (%d bytes), id=%s (%d bytes)",
             pdf_filename, len(pdf_bytes), id_mime, len(id_bytes))
    await bus.emit("stage", agent="system", message="Extracting documents…")
    application, id_data = await asyncio.gather(
        extract_application(pdf_bytes, pdf_filename),
        extract_id(id_bytes, id_mime),
    )
    app_dict = application.model_dump()
    id_dict = id_data.model_dump()
    await bus.emit("extraction", agent="extractor", message="Extracted PDF + ID",
                   data={"application": app_dict, "id": _redact_id(id_dict)})

    # --- Stage 2: Agents A + B in parallel ----------------------------------
    await bus.emit("stage", agent="system", message="Running research (A) + cross-check (B)…")
    research_task = _research_agent_a(app_dict, bus)
    crosscheck_task = _run_streamed(
        _build_crosscheck_agent(), "B", build_agent_b_input(app_dict, id_dict), bus
    )
    research_output, crosscheck_output = await asyncio.gather(research_task, crosscheck_task)

    research_payload = (
        research_output.model_dump()
        if isinstance(research_output, ResearchFindings)
        else str(research_output)
    )
    crosscheck_payload = (
        crosscheck_output.model_dump()
        if isinstance(crosscheck_output, CrossCheckFindings)
        else {"raw": str(crosscheck_output)}
    )

    # --- Stage 3: Agent C synthesis -----------------------------------------
    await bus.emit("stage", agent="system", message="Synthesizing report (C)…")
    report = await _run_streamed(
        _build_synthesis_agent(),
        "C",
        build_agent_c_input(app_dict, id_dict, research_payload, crosscheck_payload),
        bus,
    )
    if not isinstance(report, VerificationReport):
        report = VerificationReport(summary=str(report))

    log.info("=== PIPELINE DONE === findings=%d red_flags=%d checks=%d",
             len(report.findings), len(report.red_flags), len(report.consistency_checks))
    await bus.emit("report", agent="system", message="Report ready", data=report.model_dump())
    return report


def _redact_id(id_dict: dict) -> dict:
    """Mask the ID number before sending to the client UI."""
    redacted = dict(id_dict)
    num = redacted.get("id_number")
    if isinstance(num, str) and len(num) > 4:
        redacted["id_number"] = "•••• " + num[-4:]
    return redacted
