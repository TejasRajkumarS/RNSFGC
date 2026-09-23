"use client";

import { useState, useEffect, useCallback } from "react";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type EventStatus } from "@/lib/workflows/events";
import { type EventReport } from "@/lib/services/reports";

interface ReportSectionProps {
  user: SessionUser;
  eventId: string;
  eventStatus: EventStatus;
}

export default function ReportSection({ user, eventId, eventStatus }: ReportSectionProps) {
  const [report, setReport] = useState<EventReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ summary: "", outcomes: "", actual_participants: "", highlights: "" });

  const canCreate = hasPermission(user.role, "reports.create");
  const canExport = hasPermission(user.role, "reports.export");
  const canSubmitNow = canCreate && ["CONDUCTED", "REPORT_SUBMITTED"].includes(eventStatus);

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/report`);
      const data = await res.json();
      if (data.success) setReport(data.data);
    } catch {
      // report may not exist yet — that's fine
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const run = () => void fetchReport();
    run();
  }, [fetchReport]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: formData.summary,
          outcomes: formData.outcomes,
          actual_participants: formData.actual_participants ? parseInt(formData.actual_participants) : undefined,
          highlights: formData.highlights || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.data.report);
        setShowForm(false);
      } else {
        setError(data.error?.message || "Failed to submit report");
      }
    } catch {
      setError("Failed to submit report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-navy-950">Event Report</h3>
        {canExport && (
          <a
            href={`/api/events/${eventId}/report/export`}
            className="rounded-md border border-navy-950/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-navy-950 hover:bg-navy-950/5"
          >
            Export CSV
          </a>
        )}
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : report ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-950/50">Summary</p>
            <p className="mt-1 text-sm leading-relaxed text-navy-950/70">{report.summary}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-950/50">Outcomes</p>
            <p className="mt-1 text-sm leading-relaxed text-navy-950/70">{report.outcomes}</p>
          </div>
          {report.highlights && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-950/50">Highlights</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-950/70">{report.highlights}</p>
            </div>
          )}
          <p className="text-xs text-navy-950/50">
            {report.actual_participants !== null ? `Actual participants: ${report.actual_participants} · ` : ""}
            Submitted {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : "—"}
          </p>
          {canSubmitNow && (
            <button onClick={() => setShowForm(true)} className="text-sm font-semibold text-gold-dark underline">
              Update report
            </button>
          )}
        </div>
      ) : canSubmitNow ? (
        <div className="mt-4">
          <p className="text-sm text-navy-950/50">No report submitted yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 rounded-md bg-navy-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-navy-800"
          >
            Submit Report
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-navy-950/50">Report becomes available after the event is conducted.</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-navy-950/10 pt-4">
          <div>
            <label className="block text-xs font-medium text-navy-950 mb-1">Summary *</label>
            <textarea
              required
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-navy-950/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-950 mb-1">Outcomes *</label>
            <textarea
              required
              value={formData.outcomes}
              onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-navy-950/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-navy-950 mb-1">Actual Participants</label>
              <input
                type="number"
                min="0"
                value={formData.actual_participants}
                onChange={(e) => setFormData({ ...formData, actual_participants: e.target.value })}
                className="w-full rounded-md border border-navy-950/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-950 mb-1">Highlights</label>
              <input
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                className="w-full rounded-md border border-navy-950/20 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-navy-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-navy-950/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-navy-950 hover:bg-navy-950/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
