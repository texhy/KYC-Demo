"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EvaluationView from "@/components/EvaluationView";
import { getEvaluation } from "@/lib/api";
import type { EvaluationRecord } from "@/lib/types";

export default function SavedEvaluation() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [record, setRecord] = useState<EvaluationRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getEvaluation(id)
      .then(setRecord)
      .catch((e) => setLoadError(e.message || "Failed to load evaluation"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <EvaluationView
        events={[]}
        application={null}
        idData={null}
        sources={[]}
        mapsUrl={null}
        researchCost={null}
        report={null}
        stage="Loading…"
        done={false}
        error={null}
        live={false}
        evalId={id}
      />
    );
  }

  const research = record?.research ?? null;

  return (
    <EvaluationView
      events={record?.events ?? []}
      application={record?.application ?? null}
      idData={record?.id ?? null}
      sources={research?.sources ?? []}
      mapsUrl={research?.maps_url ?? null}
      researchCost={typeof research?.cost === "number" ? research.cost : null}
      report={record?.report ?? null}
      stage="Complete"
      done={record?.status === "done"}
      error={loadError ?? record?.error ?? null}
      live={false}
      companyName={record?.company_name}
      evalId={id}
      hasPdf={record?.has_pdf}
      hasId={record?.has_id}
    />
  );
}
