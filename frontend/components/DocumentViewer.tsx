"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";

/**
 * Shows the original uploaded files (credit-application PDF + supporting ID image)
 * served from the backend, with a toggle between the two.
 */
export default function DocumentViewer({
  evalId,
  hasPdf,
  hasId,
}: {
  evalId: string;
  hasPdf?: boolean;
  hasId?: boolean;
}) {
  const [tab, setTab] = useState<"pdf" | "id">(hasPdf ? "pdf" : "id");
  if (!hasPdf && !hasId) return null;

  const pdfUrl = `${API_URL}/api/evaluations/${evalId}/file/pdf`;
  const idUrl = `${API_URL}/api/evaluations/${evalId}/file/id`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Uploaded Documents</h3>
        <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
          {hasPdf && (
            <button
              onClick={() => setTab("pdf")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                tab === "pdf" ? "bg-brand-navy text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Application PDF
            </button>
          )}
          {hasId && (
            <button
              onClick={() => setTab("id")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                tab === "id" ? "bg-brand-navy text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Supporting ID
            </button>
          )}
        </div>
      </div>

      {tab === "pdf" && hasPdf && (
        <div>
          <iframe src={pdfUrl} title="Credit application PDF" className="h-[600px] w-full rounded-lg border border-slate-200" />
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand-crimson hover:underline">
            Open PDF in new tab ↗
          </a>
        </div>
      )}

      {tab === "id" && hasId && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={idUrl} alt="Supporting ID document" className="max-h-[600px] w-full rounded-lg border border-slate-200 object-contain" />
          <a href={idUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand-crimson hover:underline">
            Open image in new tab ↗
          </a>
        </div>
      )}
    </div>
  );
}
