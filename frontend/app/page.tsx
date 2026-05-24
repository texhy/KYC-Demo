"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { listEvaluations } from "@/lib/api";
import type { EvaluationSummary } from "@/lib/types";

const PER_PAGE = 10;

function initials(name?: string | null) {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatAmount(v?: string | null) {
  if (!v) return "—";
  const num = Number(String(v).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num === 0) return v;
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<EvaluationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listEvaluations({ search, status, limit: PER_PAGE, offset: page * PER_PAGE });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  // Debounce search/filter changes; reload on page change.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = total === 0 ? 0 : page * PER_PAGE + 1;
  const to = Math.min(total, (page + 1) * PER_PAGE);

  function openRow(row: EvaluationSummary) {
    router.push(row.status === "running" ? `/results/${row.id}` : `/evaluations/${row.id}`);
  }

  return (
    <AppShell title="Applications">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative flex-1 min-w-[220px]">
            <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              placeholder="Search applications..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-teal focus:bg-white focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(0);
              setStatus(e.target.value);
            }}
            className="rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/40"
          >
            <option value="">All statuses</option>
            <option value="running">Running</option>
            <option value="done">Complete</option>
            <option value="error">Failed</option>
          </select>
          <Link
            href="/new"
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy-2"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Create Application
          </Link>
        </div>

        <div className="px-5 py-3 text-sm font-medium text-slate-500">
          {total} application{total === 1 ? "" : "s"} total
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Applied</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-slate-500">No applications yet.</p>
                    <Link href="/new" className="mt-2 inline-block text-sm font-semibold text-brand-crimson hover:underline">
                      Create your first application →
                    </Link>
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openRow(row)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                          {initials(row.company_name)}
                        </span>
                        <div className="leading-tight">
                          <p className="font-semibold text-slate-800">
                            {row.company_name || row.pdf_filename || "Processing…"}
                          </p>
                          {row.incorporation_state && (
                            <p className="text-xs text-slate-400">{row.incorporation_state}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-700">
                      {formatAmount(row.loan_amount)}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(row.created_at)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-brand-crimson">Open →</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
          <span>
            Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{" "}
            <span className="font-semibold text-slate-700">{total}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40 enabled:hover:bg-slate-50"
            >
              ‹
            </button>
            <span className="px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40 enabled:hover:bg-slate-50"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
