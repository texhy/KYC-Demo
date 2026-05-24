import type { EvaluationStatus } from "@/lib/types";

const STYLES: Record<EvaluationStatus, { label: string; cls: string; dot: string }> = {
  running: {
    label: "Running",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500 animate-pulse2",
  },
  done: {
    label: "Complete",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  error: {
    label: "Failed",
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export default function StatusBadge({ status }: { status: EvaluationStatus }) {
  const s = STYLES[status] ?? STYLES.running;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
