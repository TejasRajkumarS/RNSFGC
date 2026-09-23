import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { AuthError } from "@/lib/auth/guards";
import { type SessionUser } from "@/lib/auth/types";
import { requireEvent, serializeEvent, type Event } from "@/lib/services/events";
import { listEventRegistrations } from "@/lib/services/registrations";
import { listEventAttendance } from "@/lib/services/attendance";
import { writeAuditLog } from "@/lib/audit";
import { serializeTimestamps } from "@/lib/serialize";

export interface Certificate {
  id: string;
  event_id: string;
  user_uid: string;
  registration_id: string;
  serial: string;
  issued_by: string;
  issued_at: Date | null;
}

const CERT_DATE_FIELDS = ["issued_at"] as const;

function serializeCertificate<T extends { issued_at: unknown }>(cert: T): T {
  return serializeTimestamps(cert, CERT_DATE_FIELDS);
}

export async function listEventCertificates(eventId: string): Promise<Certificate[]> {
  // Equality-only query — no composite index required
  const snap = await getAdminDb().collection("certificates").where("event_id", "==", eventId).get();
  return snap.docs.map((d) => serializeCertificate({ id: d.id, ...d.data() } as Certificate));
}

export async function listMyCertificates(
  uid: string
): Promise<Array<{ certificate: Certificate; event: Event | null }>> {
  const db = getAdminDb();
  const snap = await db.collection("certificates").where("user_uid", "==", uid).get();
  const certificates = snap.docs.map((d) => serializeCertificate({ id: d.id, ...d.data() } as Certificate));

  const eventIds = [...new Set(certificates.map((c) => c.event_id))];
  const eventsMap = new Map<string, Event>();
  await Promise.all(
    eventIds.map(async (eventId) => {
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (eventDoc.exists) eventsMap.set(eventId, serializeEvent({ id: eventDoc.id, ...eventDoc.data() } as Event));
    })
  );

  return certificates.map((certificate) => ({
    certificate,
    event: eventsMap.get(certificate.event_id) ?? null,
  }));
}

export async function generateCertificates(
  user: SessionUser,
  eventId: string
): Promise<{ generated: number; skipped: number }> {
  const event = await requireEvent(eventId);

  if (event.status !== "COMPLETED") {
    throw new AuthError(409, "WORKFLOW_CONFLICT", "Certificates can only be issued for completed events");
  }

  const db = getAdminDb();
  const [registrations, existing, attendance] = await Promise.all([
    listEventRegistrations(eventId),
    listEventCertificates(eventId),
    listEventAttendance(eventId),
  ]);
  const alreadyIssued = new Set(existing.map((c) => c.user_uid));
  // Certificates certify participation: only attendees marked PRESENT or LATE are eligible
  const attended = new Set(
    attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").map((a) => a.user_uid)
  );
  const pending = registrations.filter(
    (r) => r.status === "REGISTERED" && attended.has(r.user_uid) && !alreadyIssued.has(r.user_uid)
  );

  if (pending.length === 0) return { generated: 0, skipped: existing.length };

  const year = new Date().getFullYear();
  const eventCode = eventId.slice(0, 6).toUpperCase();
  const now = new Date();
  // Deterministic doc ids + create() make re-runs and concurrent batches fail-safe
  // (no duplicate certificates or duplicate serials); chunks stay under the 500-write batch limit.
  const CHUNK_SIZE = 450;
  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const batch = db.batch();
    pending.slice(i, i + CHUNK_SIZE).forEach((reg, index) => {
      const serial = `RNSFC-${year}-${eventCode}-${String(existing.length + i + index + 1).padStart(4, "0")}`;
      const certRef = db.collection("certificates").doc(`${eventId}_${reg.user_uid}`);
      batch.create(certRef, {
        event_id: eventId,
        user_uid: reg.user_uid,
        registration_id: reg.id,
        serial,
        issued_by: user.uid,
        issued_at: now,
      });
    });
    await batch.commit();
  }
  await writeAuditLog(user.uid, user.role, "certificates.generate", "certificates", eventId, "success", {
    event_id: eventId,
    generated: pending.length,
  });

  return { generated: pending.length, skipped: existing.length };
}
