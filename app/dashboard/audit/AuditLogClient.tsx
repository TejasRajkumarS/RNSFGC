"use client";

import { useState, useEffect } from "react";
import { type AuditLog } from "@/lib/services/audit";

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "—";
  return Object.entries(meta)
    .map(([key, value]) => `${key}=${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(", ");
}

export default function AuditLogClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const applyPage = (
    data: { success?: boolean; data?: AuditLog[]; nextCursor?: string | null; error?: { message?: string } },
    append: boolean
  ) => {
    if (data.success) {
      setLogs((prev) => (append ? [...prev, ...(data.data ?? [])] : (data.data ?? [])));
      setNextCursor(data.nextCursor ?? null);
    } else {
      setError(data.error?.message || "Failed to load audit logs");
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/audit-logs?limit=200");
        applyPage(await res.json(), false);
      } catch {
        setError("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/audit-logs?limit=200&cursor=${encodeURIComponent(nextCursor)}`);
      applyPage(await res.json(), true);
    } catch {
      setError("Failed to load audit logs");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-950">Audit Logs</h2>
        <p className="text-sm text-navy-950/60">System-wide activity trail</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {logs.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">No audit activity recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-navy-950/10 bg-white overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-navy-950/5">
              <tr>
                {["Time", "Actor", "Role", "Action", "Resource", "Result", "Details"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-navy-950/5">
                  <td className="px-4 py-3 text-sm text-navy-950/60 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-navy-950/80">{log.actor_uid.slice(0, 12)}…</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] bg-navy-950/5 text-navy-950">
                      {(log.actor_role ?? "").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-navy-950">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-navy-950/60 font-mono">
                    {log.resource}/{log.resource_id.slice(0, 10)}…
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-semibold ${log.result === "success" ? "text-green-600" : "text-red-600"}`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-navy-950/50 max-w-xs truncate" title={formatMeta(log.meta)}>
                    {formatMeta(log.meta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-md border border-navy-950/15 bg-white px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-navy-950 hover:bg-navy-950/5 transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
