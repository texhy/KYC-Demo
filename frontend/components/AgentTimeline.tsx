"use client";

import type { AgentEvent } from "@/lib/types";

const LANES: { key: string; name: string; sub: string }[] = [
  { key: "extractor", name: "Extraction", sub: "Reading PDF + ID" },
  { key: "A", name: "Agent A — Internet Research", sub: "Deep web search (ReAct loop)" },
  { key: "B", name: "Agent B — Document Cross-Check", sub: "PDF vs ID consistency" },
  { key: "C", name: "Agent C — Synthesis", sub: "Reasoning over all evidence" },
];

type LaneState = "idle" | "active" | "done";

function laneStatus(events: AgentEvent[]): LaneState {
  if (events.some((e) => e.type === "agent_done" || e.type === "extraction" || e.type === "report"))
    return "done";
  if (events.length > 0) return "active";
  return "idle";
}

const DOT: Record<LaneState, string> = {
  idle: "bg-slate-300",
  active: "bg-amber-500 animate-pulse2",
  done: "bg-emerald-500",
};
const LABEL: Record<LaneState, string> = { idle: "Queued", active: "Working…", done: "Done" };
const LABEL_CLS: Record<LaneState, string> = {
  idle: "text-slate-400",
  active: "text-amber-600",
  done: "text-emerald-600",
};

function EventRow({ e }: { e: AgentEvent }) {
  if (e.type === "tool_call") {
    return (
      <li className="flex items-start gap-2 py-1.5">
        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-teal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" strokeLinecap="round" />
          </svg>
          Search
        </span>
        <span className="text-sm text-slate-700">{e.message}</span>
      </li>
    );
  }
  if (e.type === "tool_result") {
    return (
      <li className="flex items-start gap-2 py-1.5 text-sm text-slate-500">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
        {e.message}
      </li>
    );
  }
  if (e.type === "reasoning") {
    return (
      <li className="border-l-2 border-slate-200 py-1.5 pl-3 text-sm italic text-slate-600">
        {e.message}
      </li>
    );
  }
  // agent_start and others
  return <li className="py-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">{e.message}</li>;
}

export default function AgentTimeline({ events }: { events: AgentEvent[] }) {
  return (
    <div className="space-y-4">
      {LANES.map((lane) => {
        const laneEvents = events.filter((e) => e.agent === lane.key);
        const status = laneStatus(laneEvents);
        const shown = laneEvents.filter((e) =>
          ["reasoning", "tool_call", "tool_result", "agent_start"].includes(e.type),
        );
        return (
          <div
            key={lane.key}
            className={`rounded-xl border bg-white p-4 transition ${
              status === "active" ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[status]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{lane.name}</p>
                <p className="truncate text-xs text-slate-400">{lane.sub}</p>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${LABEL_CLS[status]}`}>{LABEL[status]}</span>
            </div>

            {shown.length > 0 && (
              <ul className="scroll-thin mt-3 max-h-72 space-y-0.5 overflow-y-auto border-t border-slate-100 pt-2">
                {shown.map((e, i) => (
                  <EventRow key={i} e={e} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
