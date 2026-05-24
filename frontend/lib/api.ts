import type { AgentEvent, EvaluationList, EvaluationRecord } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function listEvaluations(params: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<EvaluationList> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  qs.set("limit", String(params.limit ?? 10));
  qs.set("offset", String(params.offset ?? 0));
  const res = await fetch(`${API_URL}/api/evaluations?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load evaluations");
  return res.json();
}

export async function getEvaluation(id: string): Promise<EvaluationRecord> {
  const res = await fetch(`${API_URL}/api/evaluations/${id}`);
  if (!res.ok) throw new Error("Evaluation not found");
  return res.json();
}

export async function submitVerification(
  pdf: File,
  supportingDoc: File
): Promise<string> {
  const form = new FormData();
  form.append("pdf", pdf);
  form.append("supporting_doc", supportingDoc);

  const res = await fetch(`${API_URL}/api/verify`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Upload failed");
  }
  const data = await res.json();
  return data.job_id as string;
}

export function openEventStream(
  jobId: string,
  onEvent: (e: AgentEvent) => void,
  onError?: () => void
): EventSource {
  const es = new EventSource(`${API_URL}/api/verify/${jobId}/stream`);
  es.onmessage = (ev) => {
    try {
      onEvent(JSON.parse(ev.data) as AgentEvent);
    } catch {
      /* ignore malformed frame */
    }
  };
  es.onerror = () => {
    onError?.();
  };
  return es;
}
