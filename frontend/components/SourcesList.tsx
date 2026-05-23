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
    <div className="card" style={{ marginBottom: 12 }}>
      {mapsUrl && (
        <div style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Business Location</div>
          <a className="maps-link" href={mapsUrl} target="_blank" rel="noreferrer">
            📍 View business &amp; location on Google Maps
          </a>
        </div>
      )}
      {sources.length > 0 && (
      <div className="section-title" style={{ marginTop: 0 }}>
        Research Sources ({sources.length})
        {typeof cost === "number" && (
          <span className="lane-sub" style={{ fontWeight: 400 }}> · ${cost.toFixed(2)}</span>
        )}
      </div>
      )}
      <ol style={{ paddingLeft: 18, margin: 0 }}>
        {sources.map((s, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title || s.url}
              </a>
            ) : (
              <span>{s.title}</span>
            )}
            {s.snippet && <div className="cite">{s.snippet}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}
