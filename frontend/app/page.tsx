"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadCard from "@/components/UploadCard";
import { submitVerification } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [pdf, setPdf] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = pdf && doc && !submitting;

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
    <div className="container">
      <h1 className="title">Business Loan Verification</h1>
      <p className="subtitle">
        Upload the credit application and a supporting ID. Our AI pipeline verifies
        the business, the owner, and document consistency — then hands you a detailed
        evidence report.
      </p>

      <div className="grid2">
        <UploadCard
          title="Upload PDF"
          hint="Credit application (PDF)"
          accept="application/pdf"
          file={pdf}
          onSelect={setPdf}
        />
        <UploadCard
          title="Upload Supporting Docs"
          hint="ID card / supporting image"
          accept="image/*"
          file={doc}
          onSelect={setDoc}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "Starting…" : "Run Verification"}
        </button>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
