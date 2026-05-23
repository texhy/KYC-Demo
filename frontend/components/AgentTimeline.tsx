"use client";

import type { AgentEvent } from "@/lib/types";

const LANES: { key: string; name: string; sub: string }[] = [
  { key: "extractor", name: "Extraction", sub: "Reading PDF + ID" },
  { key: "A", name: "Agent A — Internet Research", sub: "Deep web search (ReAct loop)" },
  { key: "B", name: "Agent B — Document Cross-Check", sub: "PDF vs ID consistency" },
  { key: "C", name: "Agent C — Synthesis", sub: "Reasoning over all evidence" },
];

function laneStatus(events: AgentEvent[]): "idle" | "active" | "done" {
  if (events.some((e) => e.type === "agent_done" || e.type === "extraction" || e.type === "report"))
    return "done";
  if (events.length > 0) return "active";
  return "idle";
}

export default function AgentTimeline({ events }: { events: AgentEvent[] }) {
  return (
    <div>
      {LANES.map((lane) => {
        const laneEvents = events.filter((e) => e.agent === lane.key);
        const status = laneStatus(laneEvents);
        return (
          <div className="lane" key={lane.key}>
            <div className="lane-head">
              <span className={`dot ${status === "active" ? "active" : status === "done" ? "done" : ""}`} />
              <span className="lane-name">{lane.name}</span>
              <span className="lane-sub">— {lane.sub}</span>
            </div>
            {laneEvents
              .filter((e) => ["reasoning", "tool_call", "tool_result", "agent_start"].includes(e.type))
              .map((e, i) => (
                <div
                  className={`event ${e.type === "tool_call" ? "search" : e.type === "reasoning" ? "reasoning" : ""}`}
                  key={i}
                >
                  <span className="tag">{e.type === "tool_call" ? "search" : e.type}</span>
                  {e.message}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
