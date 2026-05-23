"""Agent A — company internet research via the Valyu DeepResearch API.

Valyu runs an autonomous multi-step (Plan-Refine-Reflect) research task across web,
academic, and proprietary sources and returns a markdown report plus a `sources[]` array
(URL + snippet per source). We surface progress live and map sources into our Citation
schema so every claim carries a link.

The Valyu SDK is synchronous, so the blocking task runs in a worker thread; its
`on_progress` callback (also on that thread) bridges back to the async EventBus via
`run_coroutine_threadsafe`.
"""

from __future__ import annotations

import asyncio
from urllib.parse import quote_plus

from valyu import Valyu

from pipeline.config import VALYU_API_KEY, VALYU_DR_MODE
from pipeline.logging_setup import get_logger
from pipeline.schemas import Citation, ResearchFindings
from pipeline.streaming import EventBus

log = get_logger("valyu")

# Recommended max wait by tier (seconds).
_MAX_WAIT = {"fast": 600, "standard": 1800, "heavy": 7200, "max": 7200}


def _build_query(app: dict) -> str:
    owner = (app.get("owners") or [{}])[0].get("name") or "the listed owner"
    parts = [
        f"Verify whether the U.S. business '{app.get('company_name') or app.get('dba')}' is a real, "
        f"registered, operating business.",
        f"D/B/A: {app.get('dba')}." if app.get("dba") else "",
        f"Owner: {owner}.",
        f"Business address: {app.get('business_address')}, {app.get('city_state_zip')}."
        if app.get("business_address") else "",
        f"State of incorporation: {app.get('state_of_incorporation')}." if app.get("state_of_incorporation") else "",
        f"Phone: {app.get('telephone_fax') or app.get('cell_phone')}." if (app.get('telephone_fax') or app.get('cell_phone')) else "",
        f"Website: {app.get('website')}." if app.get("website") else "",
        f"Claimed date incorporated: {app.get('date_incorporated')}; time in business: {app.get('time_in_business')}."
        if app.get("date_incorporated") else "",
        "Confirm: does it exist? what is its niche / what does it do? who is the owner? when was it "
        "established? website, address, phone? what does the state business registry show? any red flags? "
        "These are the standard questions asked before approving a business loan.",
    ]
    return " ".join(p for p in parts if p)


def _build_maps_url(app: dict) -> str:
    """Canonical Google Maps search link for the business name + given location."""
    bits = [
        app.get("company_name") or app.get("dba") or "",
        app.get("business_address") or "",
        app.get("city_state_zip") or "",
    ]
    query = ", ".join(b.strip() for b in bits if b and b.strip())
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(query)}"


_RESEARCH_STRATEGY = (
    "Prioritize the applicant's state Secretary of State business-entity registry (for Florida "
    "use Sunbiz / dos.fl.gov) and fictitious-name (DBA) filings, then LinkedIn, the Better "
    "Business Bureau, industry directories, and local news. ALWAYS check Google Maps for the "
    "business name at the given address: confirm whether a business listing exists at that "
    "location, what business (if any) is actually there, and include the Google Maps link. "
    "If a search returns nothing useful, reformulate using the D/B/A, the owner name + state, "
    "the phone number, and the street address before concluding. CRITICAL: clearly distinguish "
    "'no evidence found' (inconclusive) from 'evidence of fabrication/misrepresentation' (a real "
    "red flag) — never assert existence or non-existence without a cited source. A sole "
    "proprietorship may legitimately not appear in a corporate registry; look for DBA "
    "registration, local licensing, a website, and reviews instead. Cite every claim."
)

_REPORT_FORMAT = (
    "Structure the report with these sections: Existence & confidence; Niche / what they do; "
    "Owner(s); Year established; Website; Registry record (Secretary of State); Online presence "
    "(LinkedIn, maps, reviews, news); Discrepancies / red flags. Use inline citations."
)


async def run_deep_research(app: dict, bus: EventBus) -> ResearchFindings:
    """Run a Valyu DeepResearch task for the applicant and return ResearchFindings."""
    loop = asyncio.get_running_loop()
    mode = VALYU_DR_MODE
    log.info("Valyu DeepResearch starting (mode=%s)", mode)
    await bus.emit("agent_start", agent="A", message=f"Agent A — Valyu DeepResearch ({mode}) started")

    client = Valyu(api_key=VALYU_API_KEY)
    query = _build_query(app)
    maps_url = _build_maps_url(app)
    website = (app.get("website") or "").strip()
    # Only attach a real URL (must have a domain after the scheme), not a blank "http://".
    has_domain = website.startswith("http") and "." in website.split("//", 1)[-1]
    urls = [website] if has_domain else None

    # Bridge Valyu's sync progress callback (worker thread) -> async bus (main loop).
    last = {"step": None, "sources": 0}

    def on_progress(s) -> None:
        step = getattr(s.progress, "current_step", None) if s.progress else None
        total = getattr(s.progress, "total_steps", None) if s.progress else None
        nsrc = len(s.sources or [])
        if step != last["step"]:
            last["step"] = step
            if step is not None:
                asyncio.run_coroutine_threadsafe(
                    bus.emit("reasoning", agent="A", message=f"Researching… step {step}/{total}"),
                    loop,
                )
        if nsrc != last["sources"]:
            last["sources"] = nsrc
            asyncio.run_coroutine_threadsafe(
                bus.emit("tool_result", agent="A", message=f"{nsrc} sources gathered"),
                loop,
            )

    def _run_sync():
        created = client.deepresearch.create(
            query=query,
            mode=mode,
            output_formats=["markdown"],
            research_strategy=_RESEARCH_STRATEGY,
            report_format=_REPORT_FORMAT,
            search={"search_type": "all", "country_code": "US"},
            urls=urls,
            hitl={"planning_questions": False, "plan_review": False,
                  "source_review": False, "outline_review": False},
        )
        if not created.deepresearch_id:
            raise RuntimeError(f"Valyu create returned no task id (success={created.success}, error={created.error})")
        log.info("Valyu task created: %s", created.deepresearch_id)
        return client.deepresearch.wait(
            created.deepresearch_id,
            poll_interval=5,
            max_wait_time=_MAX_WAIT.get(mode, 1800),
            on_progress=on_progress,
        )

    result = await asyncio.to_thread(_run_sync)

    status = str(getattr(result, "status", "")).upper()
    if "COMPLETED" not in status:
        raise RuntimeError(f"Valyu DeepResearch did not complete (status={status}, error={result.error})")

    report_md = result.output if isinstance(result.output, str) else str(result.output)
    sources = result.sources or []
    citations = [
        Citation(claim=s.title, url=s.url, snippet=(s.snippet or s.description or "")[:300])
        for s in sources
    ]
    log.info("Valyu DeepResearch done: sources=%d cost=$%.2f", len(sources), result.cost or 0.0)

    # Stream the full source list to the UI (rendered as a clickable "Research Sources" panel).
    await bus.emit(
        "research",
        agent="A",
        message=f"Research complete — {len(sources)} sources",
        data={"sources": [{"title": c.claim, "url": c.url, "snippet": c.snippet} for c in citations],
              "cost": result.cost,
              "maps_url": maps_url},
    )
    await bus.emit("agent_done", agent="A", message="Agent A — Valyu DeepResearch finished")

    return ResearchFindings(
        existence_assessment=report_md,
        online_presence=f"Valyu DeepResearch ({mode}) reviewed {len(sources)} sources.",
        maps_url=maps_url,
        search_trail=[f"Valyu DeepResearch task, mode={mode}, {len(sources)} sources"],
        citations=citations,
    )
