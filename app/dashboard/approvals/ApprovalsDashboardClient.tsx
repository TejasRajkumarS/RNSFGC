"use client";

import { useState, useEffect, useCallback } from "react";
import { type Event, type EventStatus } from "@/lib/workflows/events";

function getStatusBadge(status: EventStatus) {
  const colors: Record<EventStatus, string> = {
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
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${colors[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function ApprovalsDashboardClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events?status=SUBMITTED");
      const data = await res.json();
      if (data.success) setEvents(data.data);
      else setError(data.error?.message || "Failed to load events");
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = () => void fetchEvents();
    run();
  }, [fetchEvents]);

  const handleAction = async (eventId: string, action: "approve" | "reject") => {
    if (action === "reject" && !confirm("Reject this event? The coordinator will need to edit and resubmit it.")) {
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) fetchEvents();
      else setError(data.error?.message || "Action failed");
    } catch {
      setError("Action failed");
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
        <h2 className="font-display text-2xl font-semibold text-navy-950">Approval Queue</h2>
        <p className="text-sm text-navy-950/60">Events submitted for your department&apos;s approval</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {events.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">No events pending approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-lg font-semibold text-navy-950">{event.title}</h3>
                    {getStatusBadge(event.status)}
                  </div>
                  <p className="text-sm text-navy-950/60 mb-2">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-navy-950/60">
                    <span>Category: {event.category.replace("_", " ")}</span>
                    <span>Coordinator: {event.coordinator_id}</span>
                    {event.venue && <span>Venue: {event.venue}</span>}
                    {event.scheduled_at && <span>Date: {new Date(event.scheduled_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(event.id, "approve")}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(event.id, "reject")}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
