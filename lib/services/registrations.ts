import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { type Event } from "@/lib/workflows/events";
import { type SessionUser } from "@/lib/auth/types";
import { AuthError, assertRegistrationOwnership } from "@/lib/auth/guards";
import { auditRegistrationCreate, auditRegistrationCancel } from "@/lib/audit";
import { serializeEvent } from "@/lib/services/events";
import { serializeTimestamps } from "@/lib/serialize";
import { MAX_QUERY_FETCH } from "@/lib/pagination";

export interface RegistrationData {
  event_id: string;
  user_uid: string;
  status: string;
  registered_at: Date | { toMillis: () => number };
  updated_at: Date | { toMillis: () => number };
}

const REG_DATE_FIELDS = ["registered_at", "updated_at"] as const;

function serializeRegistration<T extends { registered_at: unknown; updated_at?: unknown }>(reg: T): T {
  return serializeTimestamps(reg, REG_DATE_FIELDS);
}

// Registration closes once an event has been conducted — no sign-ups after the fact
const REGISTRATION_OPEN_STATUSES = ["APPROVED", "SCHEDULED"];

function eventCount(event: { registered_count?: number }): number {
  return event.registered_count ?? 0;
}

export async function registerForEvent(
  user: SessionUser,
  eventId: string
): Promise<{ id: string; event_id: string; user_uid: string; status: string; registered_at: Date }> {
  const db = getAdminDb();
  const eventRef = db.collection("events").doc(eventId);

  const registration = await db.runTransaction(async (tx) => {
    const eventDoc = await tx.get(eventRef);
    if (!eventDoc.exists) throw new AuthError(404, "NOT_FOUND", "Event not found");
    const event = { id: eventDoc.id, ...eventDoc.data() } as Event & { registered_count?: number };

    if (!REGISTRATION_OPEN_STATUSES.includes(event.status)) {
      throw new AuthError(409, "WORKFLOW_CONFLICT", "Registration not open for this event");
    }

    const dupQuery = db
      .collection("registrations")
      .where("event_id", "==", eventId)
      .where("user_uid", "==", user.uid)
      .where("status", "==", "REGISTERED")
      .limit(1);
    const dupSnap = await tx.get(dupQuery);
    if (!dupSnap.empty) {
      throw new AuthError(409, "DUPLICATE_REGISTRATION", "Already registered");
    }

    if (event.participant_limit && eventCount(event) >= event.participant_limit) {
      throw new AuthError(409, "EVENT_FULL", "Event is full");
    }

    const now = new Date();
    const regRef = db.collection("registrations").doc();
    tx.set(regRef, {
      event_id: eventId,
      user_uid: user.uid,
      status: "REGISTERED",
      registered_at: now,
      updated_at: now,
    });
    tx.update(eventRef, { registered_count: eventCount(event) + 1, updated_at: now });
    return { id: regRef.id, event_id: eventId, user_uid: user.uid, status: "REGISTERED", registered_at: now };
  });

  await auditRegistrationCreate({ uid: user.uid, role: user.role }, registration.id, eventId);
  return registration;
}

export async function cancelRegistration(user: SessionUser, registrationId: string): Promise<void> {
  const db = getAdminDb();

  const cancelled = await db.runTransaction(async (tx) => {
    const regRef = db.collection("registrations").doc(registrationId);
    const regDoc = await tx.get(regRef);
    if (!regDoc.exists) throw new AuthError(404, "NOT_FOUND", "Registration not found");

    const regData = regDoc.data() as RegistrationData;
    assertRegistrationOwnership(user, regData);

    if (regData.status !== "REGISTERED") {
      throw new AuthError(409, "WORKFLOW_CONFLICT", "Registration is not active");
    }

    // All transaction reads must happen before any writes (Firestore constraint)
    const eventRef = db.collection("events").doc(regData.event_id);
    const eventDoc = await tx.get(eventRef);

    tx.update(regRef, { status: "CANCELLED", updated_at: new Date() });
    if (eventDoc.exists) {
      const count = eventCount(eventDoc.data() as { registered_count?: number });
      tx.update(eventRef, { registered_count: Math.max(0, count - 1), updated_at: new Date() });
    }
    return regData.event_id;
  });

  await auditRegistrationCancel({ uid: user.uid, role: user.role }, registrationId, cancelled);
}

export async function listMyRegistrations(
  user: SessionUser
): Promise<
  Array<{ id: string; event_id: string; user_uid: string; status: string; registered_at: unknown; event: Event }>
> {
  const db = getAdminDb();

  // Equality-only query (no composite index required); filter/sort in JS
  const regsSnap = await db.collection("registrations").where("user_uid", "==", user.uid).get();

  const regs = regsSnap.docs
    .map((d) =>
      serializeRegistration({ id: d.id, ...d.data() } as {
        id: string;
        event_id: string;
        user_uid: string;
        status: string;
        registered_at: unknown;
      })
    )
    .filter((r) => r.status !== "CANCELLED");

  const eventIds = [...new Set(regs.map((r) => r.event_id))];
  const eventsMap = new Map<string, Event>();
  await Promise.all(
    eventIds.map(async (eventId) => {
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (eventDoc.exists) eventsMap.set(eventId, serializeEvent({ id: eventDoc.id, ...eventDoc.data() } as Event));
    })
  );

  return regs
    .map((r) => ({ ...r, event: eventsMap.get(r.event_id) }))
    .filter((r): r is typeof r & { event: Event } => Boolean(r.event));
}

export async function listEventRegistrations(
  eventId: string
): Promise<Array<{ id: string; event_id: string; user_uid: string; status: string; registered_at: unknown }>> {
  const db = getAdminDb();

  // Equality-only query; filter cancelled in JS (avoids composite index requirement)
  const regsSnap = await db.collection("registrations").where("event_id", "==", eventId).get();
  return regsSnap.docs
    .map((d) =>
      serializeRegistration({ id: d.id, ...d.data() } as {
        id: string;
        event_id: string;
        user_uid: string;
        status: string;
        registered_at: unknown;
      })
    )
    .filter((r) => r.status !== "CANCELLED");
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export async function listRegistrationsForManager(
  user: SessionUser
): Promise<
  Array<{ id: string; event_id: string; user_uid: string; status: string; registered_at: unknown; event: Event | null }>
> {
  const db = getAdminDb();

  let events: Event[] = [];
  if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
    const snap = await db.collection("events").limit(MAX_QUERY_FETCH).get();
    events = snap.docs.map((d) => serializeEvent({ id: d.id, ...d.data() } as Event));
  } else {
    const field = user.role === "HOD" ? "department_id" : "coordinator_id";
    const value = user.role === "HOD" ? user.department_id : user.uid;
    if (!value) return [];
    const snap = await db.collection("events").where(field, "==", value).limit(MAX_QUERY_FETCH).get();
    events = snap.docs.map((d) => serializeEvent({ id: d.id, ...d.data() } as Event));
  }

  if (events.length === 0) return [];
  const eventMap = new Map(events.map((e) => [e.id, e]));

  const regBatches = await Promise.all(
    chunk(
      events.map((e) => e.id),
      30
    ).map((ids) => db.collection("registrations").where("event_id", "in", ids).get())
  );

  const registrations: Array<{
    id: string;
    event_id: string;
    user_uid: string;
    status: string;
    registered_at: unknown;
    event: Event | null;
  }> = [];
  for (const snap of regBatches) {
    for (const doc of snap.docs) {
      const data = doc.data();
      registrations.push(
        serializeRegistration({
          id: doc.id,
          event_id: data.event_id,
          user_uid: data.user_uid,
          status: data.status,
          registered_at: data.registered_at,
          event: eventMap.get(data.event_id) ?? null,
        })
      );
    }
  }
  return registrations;
}
