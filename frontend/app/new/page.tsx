"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import UploadCard from "@/components/UploadCard";
import { submitVerification } from "@/lib/api";

const WORKFLOWS = ["Invoice Analysis", "Address Verification"];

export default function NewApplicationPage() {
  const router = useRouter();
  const [pdf, setPdf] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = pdf && doc && !submitting;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  async function handleSubmit() {
    if (!pdf || !doc) return;
    setSubmitting(true);
    setError(null);
    try {
      const jobId = await submitVerification(pdf, doc);
      router.push(`/results/${jobId}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="New Application">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700">
        <span aria-hidden>←</span> Back to Applications
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-400">{today}</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800">New Application</h2>

        <div className="mt-4 flex flex-wrap gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loan Amount</p>
            <p className="mt-1 border-b-2 border-slate-200 pb-1 text-slate-300">—</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Incorporation State</p>
            <p className="mt-1 border-b-2 border-slate-200 pb-1 text-slate-300">—</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Workflows</span>
          {WORKFLOWS.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 rounded-full bg-brand-teal/15 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-brand-teal/40">
              {w} <span aria-hidden>↗</span>
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            disabled
            className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-300"
          >
            Download package
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Starting…" : "Run Verification"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
      </div>

      {/* Upload panels */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-slate-800">Credit Application</h3>
          <p className="mb-4 text-sm text-slate-400">Upload the credit application PDF to auto-detect fields.</p>
          <UploadCard
            title="Click to upload or drag & drop"
            hint="Credit application PDF (max 20MB)"
            accept="application/pdf"
            file={pdf}
            onSelect={setPdf}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-slate-800">Supporting ID</h3>
          <p className="mb-4 text-sm text-slate-400">Upload the owner's ID document image for cross-checking.</p>
          <UploadCard
            title="Click to upload or drag & drop"
            hint="ID card / supporting image"
            accept="image/*"
            file={doc}
            onSelect={setDoc}
          />
        </div>
      </div>
    </AppShell>
  );
}
