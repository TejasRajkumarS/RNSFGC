"use client";

import { useState, useEffect, useCallback } from "react";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type AttendanceRecord, type AttendanceStatus } from "@/lib/services/attendance";

interface AttendanceSectionProps {
  user: SessionUser;
  eventId: string;
}

interface RegistrationRow {
  id: string;
  user_uid: string;
  status: string;
  registered_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-yellow-100 text-yellow-700",
};

export default function AttendanceSection({ user, eventId }: AttendanceSectionProps) {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = hasPermission(user.role, "attendance.manage");

  const fetchAll = useCallback(async () => {
    try {
      const [regsRes, attRes] = await Promise.all([
        fetch(`/api/events/${eventId}/registrations`),
        fetch(`/api/events/${eventId}/attendance`),
      ]);
      const regsData = await regsRes.json();
      const attData = await attRes.json();
      if (regsData.success) setRegistrations(regsData.data);
      else setError(regsData.error?.message || "Failed to load registrations");
      if (attData.success) setAttendance(attData.data);
    } catch {
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const run = () => void fetchAll();
    run();
  }, [fetchAll]);

  const handleMark = async (registrationId: string, status: AttendanceStatus) => {
    setBusyId(registrationId);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: registrationId, status }),
      });
      const data = await res.json();
      if (data.success) fetchAll();
      else setError(data.error?.message || "Failed to mark attendance");
    } catch {
      setError("Failed to mark attendance");
    } finally {
      setBusyId(null);
    }
  };

  const attendanceByUser = new Map(attendance.map((a) => [a.user_uid, a]));

  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-navy-950">Attendance</h3>
      <p className="text-sm text-navy-950/60 mt-1">
        {registrations.length} registered participant{registrations.length === 1 ? "" : "s"}
      </p>

      {error && <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : registrations.length === 0 ? (
        <p className="mt-4 text-sm text-navy-950/50">No registrations yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {registrations.map((reg) => {
            const record = attendanceByUser.get(reg.user_uid);
            return (
              <li
                key={reg.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-950/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-mono text-navy-950/80">{reg.user_uid.slice(0, 14)}…</p>
                  <p className="text-xs text-navy-950/50">
                    {record ? `Marked by ${record.marked_by.slice(0, 10)}…` : "Not marked"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {record && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${STATUS_COLORS[record.status]}`}
                    >
                      {record.status}
                    </span>
                  )}
                  {canManage && reg.status === "REGISTERED" && (
                    <div className="flex gap-1">
                      {(["PRESENT", "ABSENT", "LATE"] as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleMark(reg.id, s)}
                          disabled={busyId === reg.id || record?.status === s}
                          className="rounded border border-navy-950/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-navy-950 hover:bg-navy-950 hover:text-white transition-colors disabled:opacity-30"
                        >
                          {s[0] + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
