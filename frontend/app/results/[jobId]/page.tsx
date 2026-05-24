"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import EvaluationView from "@/components/EvaluationView";
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
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", () => es.close(), { once: true });
      }
    };
  }, [jobId]);

  return (
    <EvaluationView
      events={events}
      application={application}
      idData={idData}
      sources={sources}
      mapsUrl={mapsUrl}
      researchCost={researchCost}
      report={report}
      stage={stage}
      done={done}
      error={error}
      live
      evalId={jobId}
      hasPdf
      hasId
    />
  );
}
