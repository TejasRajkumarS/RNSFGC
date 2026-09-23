"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

export default function RegistrationsDashboardClient() {
  const [myRegs, setMyRegs] = useState<
    Array<{ id: string; event_id: string; status: string; registered_at: string; event: Event }>
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch("/api/registrations/me");
      const data = await res.json();
      if (data.success) setMyRegs(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = () => void fetchRegistrations();
    run();
  }, [fetchRegistrations]);

  const handleCancel = async (regId: string) => {
    if (!confirm("Cancel this registration?")) return;
    try {
      const res = await fetch(`/api/registrations/${regId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchRegistrations();
      else alert(data.error?.message || "Failed to cancel");
    } catch {
      alert("Failed to cancel");
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
        <h2 className="font-display text-2xl font-semibold text-navy-950">My Registrations</h2>
        <p className="text-sm text-navy-950/60">Your event registrations</p>
      </div>

      {myRegs.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">
            No registrations yet.{" "}
            <Link href="/dashboard/events" className="text-gold-dark underline">
              Browse events
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myRegs.map((reg) => (
            <div key={reg.id} className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-lg font-semibold text-navy-950">{reg.event.title}</h3>
                    {getStatusBadge(reg.event.status)}
                  </div>
                  <p className="text-sm text-navy-950/60 mb-2">{reg.event.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-navy-950/60">
                    <span>Registered: {new Date(reg.registered_at).toLocaleDateString()}</span>
                    <span>Status: {reg.status}</span>
                  </div>
                </div>
                {reg.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleCancel(reg.id)}
                    className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
