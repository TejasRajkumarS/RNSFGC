"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type Event, type EventStatus } from "@/lib/workflows/events";

interface ReportsDashboardClientProps {
  user: SessionUser;
}

const STATUS_BADGE_COLORS: Record<EventStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SCHEDULED: "bg-purple-100 text-purple-700",
  CONDUCTED: "bg-indigo-100 text-indigo-700",
  REPORT_SUBMITTED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function ReportsDashboardClient({ user }: ReportsDashboardClientProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canExport = hasPermission(user.role, "reports.export" as Permission);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.success) setEvents(data.data);
        else setError(data.error?.message || "Failed to load events");
      } catch {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );

  const reportable = events.filter((e) => ["CONDUCTED", "REPORT_SUBMITTED", "COMPLETED"].includes(e.status));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-950">Reports</h2>
        <p className="text-sm text-navy-950/60">Event reports and participant exports</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {reportable.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">
            No conducted or completed events yet. Reports become available after an event is conducted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reportable.map((event) => (
            <div key={event.id} className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-lg font-semibold text-navy-950">{event.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${STATUS_BADGE_COLORS[event.status]}`}
                    >
                      {event.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-navy-950/60">
                    {event.venue ? `${event.venue} · ` : ""}
                    {event.scheduled_at ? new Date(event.scheduled_at).toLocaleDateString() : "No date set"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 transition-colors"
                  >
                    Open Report
                  </Link>
                  {canExport && (
                    <a
                      href={`/api/events/${event.id}/report/export`}
                      className="rounded-md border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-navy-950/5 transition-colors"
                    >
                      Export CSV
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
