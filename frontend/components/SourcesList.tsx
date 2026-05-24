"use client";

import type { ResearchSource } from "@/lib/types";

export default function SourcesList({
  sources,
  cost,
  mapsUrl,
}: {
  sources: ResearchSource[];
  cost?: number | null;
  mapsUrl?: string | null;
}) {
  if (!sources.length && !mapsUrl) return null;
  return (
    <div className="space-y-6">
      {mapsUrl && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Business Location</h3>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-teal/50 bg-brand-teal/10 px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-brand-teal/20"
          >
            📍 View business &amp; location on Google Maps
          </a>
        </div>
      )}
      {sources.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Research Sources ({sources.length})
            {typeof cost === "number" && (
              <span className="ml-2 font-normal normal-case tracking-normal text-slate-400">· ${cost.toFixed(2)}</span>
            )}
          </h3>
          <ol className="list-decimal space-y-3 pl-5">
            {sources.map((s, i) => (
              <li key={i} className="text-sm">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-brand-crimson hover:underline">
                    {s.title || s.url}
                  </a>
                ) : (
                  <span className="font-medium text-slate-700">{s.title}</span>
                )}
                {s.snippet && <div className="mt-0.5 text-xs text-slate-400">{s.snippet}</div>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
