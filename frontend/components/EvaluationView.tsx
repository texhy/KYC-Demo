"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import AgentTimeline from "@/components/AgentTimeline";
import ReportView from "@/components/ReportView";
import ExtractedDocument from "@/components/ExtractedDocument";
import DocumentViewer from "@/components/DocumentViewer";
import SourcesList from "@/components/SourcesList";
import type {
  AgentEvent,
  ApplicationData,
  IdData,
  ResearchSource,
  VerificationReport,
} from "@/lib/types";

export type EvaluationViewProps = {
  events: AgentEvent[];
  application: ApplicationData | null;
  idData: IdData | null;
  sources: ResearchSource[];
  mapsUrl: string | null;
  researchCost: number | null;
  report: VerificationReport | null;
  stage: string;
  done: boolean;
  error: string | null;
  live: boolean;
  companyName?: string | null;
  evalId: string;
  hasPdf?: boolean;
  hasId?: boolean;
};

type Tab = "report" | "documents" | "sources";

export default function EvaluationView(props: EvaluationViewProps) {
  const { events, application, idData, sources, mapsUrl, researchCost, report, stage, done, error, live, evalId, hasPdf, hasId } = props;
  const [tab, setTab] = useState<Tab>("report");

  const hasFiles = !!(hasPdf || hasId);
  const hasDocs = !!(application || idData || hasFiles);
  const hasSources = sources.length > 0 || !!mapsUrl;
  const title = props.companyName || application?.company_name || "Evaluation";

  const tabs: { key: Tab; label: string; enabled: boolean }[] = [
    { key: "report", label: "Report", enabled: !!report },
    { key: "documents", label: "Documents", enabled: hasDocs },
    { key: "sources", label: "Sources", enabled: hasSources },
  ];

  return (
    <AppShell title="Evaluation">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700">
        <span aria-hidden>←</span> Back to Applications
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
              error
                ? "bg-rose-50 text-rose-700"
                : done
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {!done && !error && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse2" />}
            {error ? "Failed" : done ? "Complete" : stage}
          </span>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Left: live agent activity */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {live ? "Live Agent Activity" : "Agent Activity"}
              </h3>
              {live && !done && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse2" />}
            </div>
            <AgentTimeline events={events} />
          </div>
        </div>

        {/* Right: tabbed results */}
        <div>
          <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  tab === t.key
                    ? "bg-brand-navy text-white"
                    : t.enabled
                      ? "text-slate-600 hover:bg-slate-100"
                      : "text-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "report" &&
            (report ? (
              <ReportView report={report} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                {error ? "No report — the run did not finish." : "The evidence report will appear here once Agent C finishes."}
              </div>
            ))}

          {tab === "documents" &&
            (hasDocs ? (
              <div className="space-y-6">
                {hasFiles && <DocumentViewer evalId={evalId} hasPdf={hasPdf} hasId={hasId} />}
                <ExtractedDocument application={application} id={idData} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                Extracted document fields will appear here.
              </div>
            ))}

          {tab === "sources" &&
            (hasSources ? (
              <SourcesList sources={sources} cost={researchCost} mapsUrl={mapsUrl} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                Research sources will appear here.
              </div>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
