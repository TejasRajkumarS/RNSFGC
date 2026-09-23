import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { AuthError, canManageAttendance } from "@/lib/auth/guards";
import { type SessionUser } from "@/lib/auth/types";
import { requireEvent } from "@/lib/services/events";
import { writeAuditLog } from "@/lib/audit";
import { serializeTimestamps, toJsDate } from "@/lib/serialize";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface AttendanceRecord {
  id: string;
  event_id: string;
  registration_id: string;
  user_uid: string;
  status: AttendanceStatus;
  marked_by: string;
  marked_at: Date | null;
  updated_at: Date | null;
}

const ATT_DATE_FIELDS = ["marked_at", "updated_at"] as const;

function serializeAttendance<T extends { marked_at: unknown; updated_at: unknown }>(record: T): T {
  return serializeTimestamps(record, ATT_DATE_FIELDS);
}

export async function listEventAttendance(eventId: string): Promise<AttendanceRecord[]> {
  // Equality-only query — no composite index required
  const snap = await getAdminDb().collection("attendance").where("event_id", "==", eventId).get();
  return snap.docs.map((d) => serializeAttendance({ id: d.id, ...d.data() } as AttendanceRecord));
}

export async function getAttendanceForRegistration(registrationId: string): Promise<AttendanceRecord | null> {
  const doc = await getAdminDb().collection("attendance").doc(registrationId).get();
  if (!doc.exists) return null;
  return serializeAttendance({ id: doc.id, ...doc.data() } as AttendanceRecord);
}

export async function markAttendance(
  user: SessionUser,
  eventId: string,
  registrationId: string,
  status: AttendanceStatus
): Promise<AttendanceRecord> {
  const event = await requireEvent(eventId);
  if (!canManageAttendance(user, event)) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized to manage attendance for this event");
  }

  const db = getAdminDb();
  const regDoc = await db.collection("registrations").doc(registrationId).get();
  if (!regDoc.exists) throw new AuthError(404, "NOT_FOUND", "Registration not found");
  const reg = regDoc.data() as { event_id: string; user_uid: string; status: string };
  if (reg.event_id !== eventId) {
    throw new AuthError(400, "VALIDATION_ERROR", "Registration does not belong to this event");
  }
  if (reg.status !== "REGISTERED") {
    throw new AuthError(409, "WORKFLOW_CONFLICT", "Registration is not active");
  }

  // Attendance doc keyed by registration id — upsert keeps it idempotent
  const attendanceRef = db.collection("attendance").doc(registrationId);
  const existing = await attendanceRef.get();
  const now = new Date();
  const data = {
    event_id: eventId,
    registration_id: registrationId,
    user_uid: reg.user_uid,
    status,
    marked_by: user.uid,
    marked_at: existing.exists ? (toJsDate(existing.data()?.marked_at) ?? now) : now,
    updated_at: now,
  };
  await attendanceRef.set(data);
  await writeAuditLog(user.uid, user.role, "attendance.mark", "attendance", registrationId, "success", {
    event_id: eventId,
    status,
  });
  return serializeAttendance({ id: attendanceRef.id, ...data });
}
