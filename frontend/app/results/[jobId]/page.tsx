"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AgentTimeline from "@/components/AgentTimeline";
import ReportView from "@/components/ReportView";
import ExtractedDocument from "@/components/ExtractedDocument";
import SourcesList from "@/components/SourcesList";
import { openEventStream } from "@/lib/api";
import type {
  AgentEvent,
  ApplicationData,
  IdData,
  ResearchSource,
  VerificationReport,
} from "@/lib/types";

export default function Results() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [idData, setIdData] = useState<IdData | null>(null);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [researchCost, setResearchCost] = useState<number | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string | null>(null);
  const [stage, setStage] = useState("Starting…");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;
    // Reuse a single EventSource across StrictMode's double-invoke in dev.
    if (esRef.current) return;

    const es = openEventStream(jobId, (e) => {
      if (e.type === "stage" && e.message) setStage(e.message);
      if (e.type === "error" && e.message) setError(e.message);
      if (e.type === "extraction" && e.data) {
        if (e.data.application) setApplication(e.data.application as ApplicationData);
        if (e.data.id) setIdData(e.data.id as IdData);
      }
      if (e.type === "research" && e.data) {
        if (e.data.sources) setSources(e.data.sources as ResearchSource[]);
        if (typeof e.data.cost === "number") setResearchCost(e.data.cost);
        if (e.data.maps_url) setMapsUrl(e.data.maps_url as string);
      }
      if (e.type === "report" && e.data) setReport(e.data as VerificationReport);
      if (e.type === "done") {
        setDone(true);
        es.close();
        esRef.current = null;
      }
      setEvents((prev) => [...prev, e]);
    });
    esRef.current = es;

    return () => {
      // Only tear down on real navigation away (not StrictMode remount).
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", () => es.close(), { once: true });
      }
    };
  }, [jobId]);

  return (
    <div className="container">
      <Link href="/" className="lane-sub">← New verification</Link>
      <h1 className="title" style={{ marginTop: 12 }}>Verification Pipeline</h1>
      <p className="subtitle">{done ? "Complete" : stage}</p>

      {error && <div className="card error">Error: {error}</div>}

      <div className="grid2">
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Live Agent Activity</div>
          <AgentTimeline events={events} />
        </div>
        <div>
          {(application || idData) && (
            <ExtractedDocument application={application} id={idData} />
          )}
          <SourcesList sources={sources} cost={researchCost} mapsUrl={mapsUrl} />
          {report ? (
            <ReportView report={report} />
          ) : (
            <div className="card lane-sub">
              The detailed evidence report will appear here once Agent C finishes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
