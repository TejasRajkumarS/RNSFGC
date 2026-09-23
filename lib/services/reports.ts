import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { AuthError, canManageEvent, canViewEventDetails, canTransitionEvent } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { requireEvent, type Event } from "@/lib/services/events";
import { listEventRegistrations } from "@/lib/services/registrations";
import { listEventAttendance, type AttendanceRecord } from "@/lib/services/attendance";
import { writeAuditLog } from "@/lib/audit";
import { serializeTimestamps } from "@/lib/serialize";

export interface EventReport {
  id: string;
  event_id: string;
  summary: string;
  outcomes: string;
  actual_participants: number | null;
  highlights: string | null;
  submitted_by: string;
  submitted_at: Date | null;
  updated_at: Date | null;
}

const REPORT_DATE_FIELDS = ["submitted_at", "updated_at"] as const;

function serializeReport<T extends { submitted_at: unknown; updated_at: unknown }>(report: T): T {
  return serializeTimestamps(report, REPORT_DATE_FIELDS);
}

export async function getEventReport(eventId: string): Promise<EventReport | null> {
  // One report per event — doc id == event id
  const doc = await getAdminDb().collection("reports").doc(eventId).get();
  if (!doc.exists) return null;
  return serializeReport({ id: doc.id, ...doc.data() } as EventReport);
}

export async function submitReport(
  user: SessionUser,
  eventId: string,
  input: { summary: string; outcomes: string; actual_participants?: number; highlights?: string }
): Promise<{ report: EventReport; event: Event }> {
  const event = await requireEvent(eventId);
  if (!canManageEvent(user, event)) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized to submit a report for this event");
  }

  if (!["CONDUCTED", "REPORT_SUBMITTED"].includes(event.status)) {
    throw new AuthError(409, "WORKFLOW_CONFLICT", "Report can only be submitted after the event is conducted");
  }

  // The workflow transition table is the single source of truth for CONDUCTED → REPORT_SUBMITTED
  if (event.status === "CONDUCTED" && !canTransitionEvent(user, event, "submit_report")) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized to submit a report for this event");
  }

  const db = getAdminDb();
  const now = new Date();
  const existing = await getEventReport(eventId);
  const data = {
    event_id: eventId,
    summary: input.summary,
    outcomes: input.outcomes,
    actual_participants: input.actual_participants ?? null,
    highlights: input.highlights ?? null,
    submitted_by: existing?.submitted_by ?? user.uid,
    submitted_at: existing?.submitted_at ?? now,
    updated_at: now,
  };

  // Write the report and advance the workflow atomically — a partial failure must
  // not leave a report attached to an event still stuck in CONDUCTED.
  const batch = db.batch();
  batch.set(db.collection("reports").doc(eventId), data);
  if (event.status === "CONDUCTED") {
    batch.update(db.collection("events").doc(eventId), { status: "REPORT_SUBMITTED", updated_at: now });
  }
  await batch.commit();

  const updatedEvent = event.status === "CONDUCTED" ? { ...event, status: "REPORT_SUBMITTED" as const } : event;
  if (event.status === "CONDUCTED") {
    await writeAuditLog(user.uid, user.role, "event.submit_report", "events", eventId, "success", {
      from_status: "CONDUCTED",
      to_status: "REPORT_SUBMITTED",
    });
  }
  await writeAuditLog(user.uid, user.role, "report.submit", "reports", eventId, "success", {
    event_id: eventId,
  });

  return { report: serializeReport({ id: eventId, ...data }), event: updatedEvent };
}

function csvEscape(value: unknown): string {
  let str = value === null || value === undefined ? "" : String(value);
  // Neutralize spreadsheet formula injection from user-supplied text
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function exportEventParticipantsCsv(user: SessionUser, eventId: string): Promise<string> {
  if (!hasPermission(user.role, "reports.export")) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized to export reports");
  }
  const event = await requireEvent(eventId);
  // Same per-event scope gate as the report view — global permission alone must not
  // let an HOD export another department's participant data.
  if (!canViewEventDetails(user, event)) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized for this event");
  }
  await writeAuditLog(user.uid, user.role, "report.export", "reports", eventId, "success", {
    event_id: eventId,
  });
  const [registrations, attendance] = await Promise.all([
    listEventRegistrations(eventId),
    listEventAttendance(eventId),
  ]);
  const attendanceByUser = new Map<string, AttendanceRecord>(attendance.map((a) => [a.user_uid, a]));

  const header = ["registration_id", "user_uid", "registration_status", "registered_at", "attendance_status"];
  const rows = registrations.map((r) => [
    r.id,
    r.user_uid,
    r.status,
    r.registered_at instanceof Date ? r.registered_at.toISOString() : String(r.registered_at ?? ""),
    attendanceByUser.get(r.user_uid)?.status ?? "",
  ]);

  const lines = [header, ...rows].map((row) => row.map(csvEscape).join(","));
  const meta = [
    `# Event: ${csvEscape(event.title)}`,
    `# Status: ${event.status}`,
    `# Exported: ${new Date().toISOString()}`,
    "",
  ];
  return [...meta, ...lines].join("\n");
}
