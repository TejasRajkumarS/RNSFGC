"use client";

import { useState } from "react";
import Link from "next/link";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type Event, getValidTransitions, ACTION_LABELS } from "@/lib/workflows/events";
import AttendanceSection from "./AttendanceSection";
import DocumentsSection from "./DocumentsSection";
import ExpensesSection from "./ExpensesSection";
import ReportSection from "./ReportSection";
import CertificatesSection from "./CertificatesSection";

interface EventDetailClientProps {
  user: SessionUser;
  event: Event;
}

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

export default function EventDetailClient({ user, event }: EventDetailClientProps) {
  const [status, setStatus] = useState<Event["status"]>(event.status);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canManage = hasPermission(user.role, "events.update") && ["ADMIN", "EVENT_COORDINATOR"].includes(user.role);

  const userTransitions = getValidTransitions(status).filter((action) =>
    hasPermission(user.role, TRANSITION_PERMISSIONS[action])
  );

  const handleTransition = async (action: keyof typeof ACTION_LABELS) => {
    if (["cancel", "reject"].includes(action) && !confirm(`Are you sure you want to ${action} this event?`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) setStatus(data.data.status);
      else setError(data.error?.message || "Transition failed");
    } catch {
      setError("Transition failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            {event.category.replace("_", " ")} · {event.department_id}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-navy-950">{event.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-navy-950/60">
            <span className="rounded-full bg-navy-950/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-navy-950">
              {status.replace("_", " ")}
            </span>
            {event.venue && <span>Venue: {event.venue}</span>}
            {event.scheduled_at && <span>{new Date(event.scheduled_at).toLocaleString()}</span>}
            {event.chief_guest && <span>Chief guest: {event.chief_guest}</span>}
          </div>
        </div>
        <Link href="/dashboard/events" className="shrink-0 text-sm font-semibold text-gold-dark underline">
          ← All events
        </Link>
      </div>

      <p className="text-sm leading-relaxed text-navy-950/70">{event.description}</p>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {userTransitions.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-navy-950/10 bg-white p-5 shadow-card">
          <span className="w-full text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/50">
            Workflow actions
          </span>
          {userTransitions.map((action) => (
            <button
              key={action}
              onClick={() => handleTransition(action)}
              disabled={busy}
              className="rounded-md bg-navy-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceSection user={user} eventId={event.id} />
        <ExpensesSection user={user} eventId={event.id} />
        <DocumentsSection user={user} eventId={event.id} />
        <ReportSection user={user} eventId={event.id} eventStatus={status} />
        <CertificatesSection user={user} eventId={event.id} eventStatus={status} />
      </div>

      {canManage && (
        <p className="text-xs text-navy-950/40">Events can be edited via the API while in Draft or Rejected state.</p>
      )}
    </div>
  );
}
