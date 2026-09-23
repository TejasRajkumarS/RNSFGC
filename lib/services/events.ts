import "server-only";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp, getAdminDb } from "@/lib/firebase/admin";
import { getFirebaseStorageBucket } from "@/lib/firebase/config";
import {
  type Event,
  type EventInput,
  type EventStatus,
  type EventWorkflowTransition,
  EVENT_TRANSITIONS,
} from "@/lib/workflows/events";
import { type CollegeEvent } from "@/data/events";
import { type SessionUser } from "@/lib/auth/types";
import { AuthError } from "@/lib/auth/guards";
import { auditEventCreate, auditEventUpdate, auditEventTransition, writeAuditLog } from "@/lib/audit";
import { canTransitionEvent } from "@/lib/auth/guards";
import { serializeTimestamps, toJsDate } from "@/lib/serialize";
import {
  type ListParams,
  type Paginated,
  paginateInMemory,
  MAX_QUERY_FETCH,
  DEFAULT_PAGE_SIZE,
} from "@/lib/pagination";

export type { Event, EventInput, EventStatus, EventWorkflowTransition } from "@/lib/workflows/events";

export function toMillis(value: unknown): number {
  const date = toJsDate(value);
  return date ? date.getTime() : 0;
}

const EVENT_DATE_FIELDS = ["scheduled_at", "created_at", "updated_at"] as const;

export function serializeEvent<T extends Event>(event: T): T {
  return serializeTimestamps(event, EVENT_DATE_FIELDS);
}

const EDITABLE_STATUSES: EventStatus[] = ["DRAFT", "REJECTED"];

export async function createEvent(user: SessionUser, input: EventInput): Promise<Event> {
  const db = getAdminDb();

  // Non-admins may only create events for their own department — never spoof another
  let departmentId = input.department_id;
  if (user.role !== "ADMIN") {
    if (!user.department_id) {
      throw new AuthError(400, "VALIDATION_ERROR", "Your account is not assigned to a department");
    }
    departmentId = user.department_id;
  }
  const deptDoc = await db.collection("departments").doc(departmentId).get();
  if (!deptDoc.exists) throw new AuthError(400, "VALIDATION_ERROR", "Department not found");

  const now = new Date();
  const eventData = {
    title: input.title,
    description: input.description,
    category: input.category,
    department_id: departmentId,
    coordinator_id: user.uid,
    co_coordinator_id: null,
    venue: input.venue ?? null,
    scheduled_at: input.scheduled_at ?? null,
    chief_guest: input.chief_guest ?? null,
    expected_participants: input.expected_participants ?? null,
    participant_limit: input.participant_limit ?? null,
    registered_count: 0,
    status: "DRAFT" as EventStatus,
    created_at: now,
    updated_at: now,
  };
  const docRef = await db.collection("events").add(eventData);
  await auditEventCreate({ uid: user.uid, role: user.role }, docRef.id);
  return serializeEvent({ id: docRef.id, ...eventData });
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const doc = await getAdminDb().collection("events").doc(eventId).get();
  if (!doc.exists) return null;
  return serializeEvent({ id: doc.id, ...doc.data() } as Event);
}

export async function requireEvent(eventId: string): Promise<Event> {
  const event = await getEvent(eventId);
  if (!event) throw new AuthError(404, "NOT_FOUND", "Event not found");
  return event;
}

export async function listEventsForUser(
  user: SessionUser,
  params: ListParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
  status?: EventStatus | null
): Promise<Paginated<Event>> {
  let query: FirebaseFirestore.Query = getAdminDb().collection("events");

  if (user.role === "EVENT_COORDINATOR") {
    query = query.where("coordinator_id", "==", user.uid);
  } else if (user.role === "HOD") {
    query = query.where("department_id", "==", user.department_id);
  } else if (["STUDENT", "FACULTY"].includes(user.role)) {
    query = query.where("status", "in", ["APPROVED", "SCHEDULED", "CONDUCTED"]);
  }
  // ADMIN and PRINCIPAL see all

  // Sort in JS: avoids composite-index requirements for status-in + orderBy
  const snapshot = await query.limit(MAX_QUERY_FETCH).get();
  let events = snapshot.docs.map((d) => serializeEvent({ id: d.id, ...d.data() } as Event));
  if (status) events = events.filter((e) => e.status === status);
  events.sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));

  return paginateInMemory(events, params, snapshot.size >= MAX_QUERY_FETCH);
}

export async function listPublicEvents(): Promise<Event[]> {
  const snapshot = await getAdminDb()
    .collection("events")
    .where("status", "in", ["APPROVED", "SCHEDULED", "CONDUCTED"])
    .limit(MAX_QUERY_FETCH)
    .get();
  const events = snapshot.docs.map((d) => serializeEvent({ id: d.id, ...d.data() } as Event));
  return events
    .filter((e) => e.scheduled_at !== null)
    .sort((a, b) => toMillis(a.scheduled_at) - toMillis(b.scheduled_at));
}

export async function listCompletedPublicEvents(): Promise<Event[]> {
  // Completed-only: CONDUCTED events still appear under upcoming until finalized
  const snapshot = await getAdminDb()
    .collection("events")
    .where("status", "==", "COMPLETED")
    .limit(MAX_QUERY_FETCH)
    .get();
  const events = snapshot.docs.map((d) => serializeEvent({ id: d.id, ...d.data() } as Event));
  return events
    .filter((e) => e.scheduled_at !== null)
    .sort((a, b) => toMillis(b.scheduled_at) - toMillis(a.scheduled_at));
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function toCollegeEvent(event: Event): CollegeEvent {
  const d = event.scheduled_at ? new Date(event.scheduled_at as unknown as string) : null;
  if (!d || Number.isNaN(d.getTime())) {
    return {
      date: "TBA",
      day: "",
      title: event.title,
      description: event.description,
      location: event.venue ?? "RNS Campus",
    };
  }
  return {
    date: `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`,
    day: d.toLocaleDateString("en-US", { weekday: "long" }),
    title: event.title,
    description: event.description,
    location: event.venue ?? "RNS Campus",
  };
}

export async function updateEvent(user: SessionUser, eventId: string, updates: Partial<EventInput>): Promise<Event> {
  const event = await requireEvent(eventId);

  if (!EDITABLE_STATUSES.includes(event.status)) {
    throw new AuthError(409, "WORKFLOW_CONFLICT", "Event cannot be modified in current state");
  }

  const allowedFields: (keyof EventInput)[] = [
    "title",
    "description",
    "category",
    "venue",
    "scheduled_at",
    "chief_guest",
    "expected_participants",
    "participant_limit",
  ];

  const filteredUpdates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates && updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  filteredUpdates.updated_at = new Date();
  await getAdminDb().collection("events").doc(eventId).update(filteredUpdates);
  await auditEventUpdate({ uid: user.uid, role: user.role }, eventId, Object.keys(filteredUpdates));
  return { ...event, ...filteredUpdates } as Event;
}

export async function transitionEvent(
  user: SessionUser,
  eventId: string,
  action: EventWorkflowTransition
): Promise<Event> {
  const transition = EVENT_TRANSITIONS[action];
  if (!transition) throw new AuthError(400, "VALIDATION_ERROR", "Invalid action");

  const db = getAdminDb();
  const eventRef = db.collection("events").doc(eventId);

  // Read → validate → write inside one transaction so two concurrent transitions
  // from the same state can't both succeed with "last write wins".
  const { event, newStatus } = await db.runTransaction(async (tx) => {
    const doc = await tx.get(eventRef);
    if (!doc.exists) throw new AuthError(404, "NOT_FOUND", "Event not found");
    const event = serializeEvent({ id: doc.id, ...doc.data() } as Event);

    if (!transition.from.includes(event.status)) {
      throw new AuthError(409, "WORKFLOW_CONFLICT", `Cannot ${action} from ${event.status}`);
    }
    if (!canTransitionEvent(user, event, action)) {
      throw new AuthError(403, "FORBIDDEN", "Not authorized for this transition");
    }

    const newStatus = transition.to;
    tx.update(eventRef, { status: newStatus, updated_at: new Date() });
    return { event, newStatus };
  });

  await auditEventTransition({ uid: user.uid, role: user.role }, eventId, action, event.status, newStatus);
  return { ...event, status: newStatus };
}

const DELETABLE_STATUSES: EventStatus[] = ["DRAFT", "REJECTED", "CANCELLED"];

export async function deleteEvent(user: SessionUser, eventId: string): Promise<void> {
  const db = getAdminDb();
  const event = await requireEvent(eventId);

  // Only non-live events are deletable — completed events carry issued certificates,
  // reports, and financial records that must not silently disappear.
  if (!DELETABLE_STATUSES.includes(event.status)) {
    throw new AuthError(409, "WORKFLOW_CONFLICT", "Only draft, rejected, or cancelled events can be deleted");
  }

  // Collect document storage paths before deleting metadata
  const docSnap = await db.collection("documents").where("event_id", "==", eventId).get();
  const storagePaths = docSnap.docs
    .map((d) => (d.data() as { storage_path?: string }).storage_path)
    .filter((p): p is string => Boolean(p));

  // Cascade: remove all records attached to the event
  const attachedCollections = ["registrations", "attendance", "documents", "expenses", "reports", "certificates"];
  for (const collectionName of attachedCollections) {
    const snap = await db.collection(collectionName).where("event_id", "==", eventId).get();
    const refs = snap.docs.map((d) => d.ref);
    for (let i = 0; i < refs.length; i += 450) {
      const batch = db.batch();
      for (const ref of refs.slice(i, i + 450)) batch.delete(ref);
      await batch.commit();
    }
  }

  // Storage deletion is best-effort
  const bucket = getStorage(getAdminApp()).bucket(getFirebaseStorageBucket());
  for (const path of storagePaths) {
    try {
      await bucket.file(path).delete({ ignoreNotFound: true });
    } catch (err) {
      console.error(`[EVENTS] Failed to delete storage file ${path}`, err);
    }
  }

  await db.collection("events").doc(eventId).delete();
  await writeAuditLog(user.uid, user.role, "event.delete", "events", eventId, "success");
}
