"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type Event, type EventStatus, getValidTransitions, ACTION_LABELS } from "@/lib/workflows/events";

interface EventsDashboardClientProps {
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

const TRANSITION_PERMISSIONS = {
  submit: "events.submit",
  approve: "events.approve",
  reject: "events.reject",
  schedule: "events.schedule",
  conduct: "events.conduct",
  submit_report: "events.submit",
  complete: "events.complete",
  cancel: "events.cancel",
} as const;

// Mirrors the server-side REGISTRATION_OPEN_STATUSES policy
const REGISTRATION_OPEN_STATUSES = new Set(["APPROVED", "SCHEDULED"]);

export default function EventsDashboardClient({ user }: EventsDashboardClientProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  // eventId → registrationId for the signed-in user's active registrations
  const [myRegistrations, setMyRegistrations] = useState<Record<string, string>>({});
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const canCreate = hasPermission(user.role, "events.create");
  const canRegister = hasPermission(user.role, "participants.register");

  const applyPage = (
    data: { success?: boolean; data?: Event[]; nextCursor?: string | null; error?: { message?: string } },
    append: boolean
  ) => {
    if (data.success) {
      setEvents((prev) => (append ? [...prev, ...(data.data ?? [])] : (data.data ?? [])));
      setNextCursor(data.nextCursor ?? null);
    } else {
      setError(data.error?.message || "Failed to load events");
    }
  };

  const fetchMyRegistrations = useCallback(async () => {
    if (!canRegister) return;
    try {
      const res = await fetch("/api/registrations/me");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const map: Record<string, string> = {};
        for (const reg of data.data) {
          if (reg?.event_id && reg?.id && reg?.status === "REGISTERED") map[reg.event_id] = reg.id;
        }
        setMyRegistrations(map);
      }
    } catch {
      // non-fatal: registration buttons just won't reflect current state
    }
  }, [canRegister]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      applyPage(await res.json(), false);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/events?cursor=${encodeURIComponent(nextCursor)}`);
      applyPage(await res.json(), true);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    const run = () => {
      void fetchEvents();
      void fetchMyRegistrations();
    };
    run();
  }, [fetchEvents, fetchMyRegistrations]);

  const handleRegister = async (eventId: string) => {
    setError("");
    setRegisteringId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMyRegistrations((prev) => ({ ...prev, [eventId]: data.data.id }));
      } else {
        setError(data.error?.message || "Registration failed");
      }
    } catch {
      setError("Registration failed");
    } finally {
      setRegisteringId(null);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    const registrationId = myRegistrations[eventId];
    if (!registrationId) return;
    if (!confirm("Cancel your registration for this event?")) return;
    setError("");
    setRegisteringId(eventId);
    try {
      const res = await fetch(`/api/registrations/${registrationId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMyRegistrations((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
      } else {
        setError(data.error?.message || "Could not cancel registration");
      }
    } catch {
      setError("Could not cancel registration");
    } finally {
      setRegisteringId(null);
    }
  };

  const handleTransition = async (eventId: string, action: keyof typeof ACTION_LABELS) => {
    setError("");
    if (["cancel", "reject"].includes(action) && !confirm(`Are you sure you want to ${action} this event?`)) {
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
      else setError(data.error?.message || "Transition failed");
    } catch {
      setError("Transition failed");
    }
  };

  const renderEventActions = (event: Event) => {
    const userTransitions = getValidTransitions(event.status).filter((action) =>
      hasPermission(user.role, TRANSITION_PERMISSIONS[action])
    );

    const registrationId = myRegistrations[event.id];
    const registrationOpen = REGISTRATION_OPEN_STATUSES.has(event.status);
    const showRegister = canRegister && registrationOpen && !registrationId;
    const showCancelRegistration = canRegister && registrationOpen && Boolean(registrationId);

    if (userTransitions.length === 0 && !showRegister && !showCancelRegistration) {
      return canRegister && registrationId && !registrationOpen ? (
        <div className="mt-4 pt-4 border-t border-navy-950/10">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-green-700">
            Registered
          </span>
        </div>
      ) : null;
    }

    return (
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-navy-950/10">
        {userTransitions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => handleTransition(event.id, action)}
            className="rounded-md bg-navy-950 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-navy-800 transition-colors"
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
        {showRegister && (
          <button
            type="button"
            onClick={() => handleRegister(event.id)}
            disabled={registeringId === event.id}
            className="rounded-md bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-navy-950 hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {registeringId === event.id ? "Registering…" : "Register"}
          </button>
        )}
        {showCancelRegistration && (
          <button
            type="button"
            onClick={() => handleCancelRegistration(event.id)}
            disabled={registeringId === event.id}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {registeringId === event.id ? "Cancelling…" : "Cancel Registration"}
          </button>
        )}
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-navy-950">Events</h2>
          <p className="text-sm text-navy-950/60">Manage and view events</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/events/create"
            className="rounded-md bg-navy-950 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white hover:bg-navy-800 transition-colors"
          >
            Create Event
          </Link>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {events.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">No events found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="font-display text-lg font-semibold text-navy-950 underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-dark transition-colors"
                    >
                      {event.title}
                    </Link>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${STATUS_BADGE_COLORS[event.status]}`}
                    >
                      {event.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-navy-950/60 mb-2">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-navy-950/60">
                    <span>Category: {event.category.replace("_", " ")}</span>
                    <span>Dept: {event.department_id}</span>
                    {event.venue && <span>Venue: {event.venue}</span>}
                    {event.scheduled_at && <span>Date: {new Date(event.scheduled_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                {renderEventActions(event)}
              </div>
            </div>
          ))}
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
