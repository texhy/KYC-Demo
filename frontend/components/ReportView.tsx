"use client";

import { useState } from "react";
import type { VerificationReport } from "@/lib/types";

const SEV: Record<string, string> = {
  high: "bg-rose-50 text-rose-700 ring-rose-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-sky-50 text-sky-700 ring-sky-200",
  info: "bg-slate-100 text-slate-600 ring-slate-200",
};

function Badge({ value }: { value: string }) {
  const cls = SEV[value?.toLowerCase()] ?? SEV.info;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {value}
    </span>
  );
}

function ConsistencyMark({ v }: { v?: boolean | null }) {
  if (v === true) return <span className="font-medium text-emerald-600">✓ consistent</span>;
  if (v === false) return <span className="font-medium text-rose-600">✕ mismatch</span>;
  return <span className="text-slate-400">— unknown</span>;
}

/** Collapsible card section. Open by default. */
function Collapsible({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count?: number;
  accent?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          {title}
          {typeof count === "number" && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${accent ?? "bg-slate-100 text-slate-500"}`}>
              {count}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </section>
  );
}

/** Turn a "lead text: • item • item" summary into a readable lead + bullet list. */
function formatSummary(summary: string) {
  const parts = summary
    .split("•")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) return { lead: summary.trim(), bullets: [] as string[] };
  return { lead: parts[0].replace(/:\s*$/, ""), bullets: parts.slice(1) };
}

export default function ReportView({ report }: { report: VerificationReport }) {
  const { lead, bullets } = formatSummary(report.summary);

  return (
    <div className="space-y-6">
      {/* Summary — always visible, formatted for readability */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Summary</h3>
        <p className="leading-relaxed text-slate-700">{lead}</p>
        {bullets.length > 0 && (
          <ul className="mt-4 space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-crimson" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {report.red_flags.length > 0 && (
        <Collapsible title="Red Flags" count={report.red_flags.length} accent="bg-rose-100 text-rose-700">
          <div className="space-y-3">
            {report.red_flags.map((f, i) => (
              <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Badge value={f.severity} />
                  <strong className="text-slate-800">{f.title}</strong>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{f.detail}</p>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {report.consistency_checks.length > 0 && (
        <Collapsible title="Consistency Checks" count={report.consistency_checks.length}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Check</th>
                  <th className="py-2 pr-4">Result</th>
                  <th className="py-2 pr-4">Detail</th>
                  <th className="py-2">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.consistency_checks.map((c, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-3 pr-4 font-medium text-slate-700">{c.check}</td>
                    <td className="py-3 pr-4 whitespace-nowrap"><ConsistencyMark v={c.consistent} /></td>
                    <td className="py-3 pr-4 text-slate-600">{c.detail}</td>
                    <td className="py-3"><Badge value={c.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>
      )}

      {report.findings.length > 0 && (
        <Collapsible title="Findings" count={report.findings.length}>
          <div className="space-y-3">
            {report.findings.map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-slate-800">{f.title}</strong>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    {f.category} · {f.confidence}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{f.detail}</p>
                {f.citations.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                    {f.citations.map((c, j) => (
                      <div key={j} className="text-xs text-slate-400">
                        {c.url ? (
                          <a href={c.url} target="_blank" rel="noreferrer" className="text-brand-crimson hover:underline">
                            {c.url}
                          </a>
                        ) : (
                          "(no url)"
                        )}{" "}
                        — {c.claim}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
