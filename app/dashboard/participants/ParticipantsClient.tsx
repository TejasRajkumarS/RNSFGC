"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type Event } from "@/lib/workflows/events";

interface ManagedRegistration {
  id: string;
  event_id: string;
  user_uid: string;
  status: string;
  registered_at: string;
  event: Event | null;
}

export default function ParticipantsClient() {
  const [registrations, setRegistrations] = useState<ManagedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await fetch("/api/registrations");
        const data = await res.json();
        if (data.success) setRegistrations(data.data);
        else setError(data.error?.message || "Failed to load registrations");
      } catch {
        setError("Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-950">Participants</h2>
        <p className="text-sm text-navy-950/60">Registrations across the events you manage</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {registrations.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">No registrations yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-navy-950/10 bg-white overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-navy-950/5">
              <tr>
                {["Event", "Participant", "Registration", "Registered On", "Status"].map((h) => (
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
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-navy-950/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/events/${reg.event_id}`}
                      className="font-medium text-navy-950 underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-dark"
                    >
                      {reg.event?.title ?? reg.event_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-navy-950/80">{reg.user_uid.slice(0, 12)}…</td>
                  <td className="px-4 py-3 text-sm text-navy-950/60">{reg.status}</td>
                  <td className="px-4 py-3 text-sm text-navy-950/60">
                    {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${reg.status === "REGISTERED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {reg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
