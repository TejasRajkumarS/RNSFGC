import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface AuditLogEntry {
  actor_uid: string;
  actor_role: string;
  action: string;
  resource: string;
  resource_id: string;
  result: "success" | "failure";
  meta?: Record<string, unknown>;
  created_at: Timestamp;
}

const SENSITIVE_FIELDS = ["password", "token", "secret", "apiKey", "authorization"];

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_FIELDS.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function writeAuditLog(
  actorUid: string,
  actorRole: string,
  action: string,
  resource: string,
  resourceId: string,
  result: "success" | "failure",
  meta?: Record<string, unknown>
): Promise<void> {
  const adminDb = getAdminDb();
  const entry: Omit<AuditLogEntry, "created_at"> & { created_at: FieldValue } = {
    actor_uid: actorUid,
    actor_role: actorRole,
    action,
    resource,
    resource_id: resourceId,
    result,
    meta: sanitizeMeta(meta),
    created_at: FieldValue.serverTimestamp(),
  };
  try {
    // Best-effort: audit failure must not fail an already-committed operation
    await adminDb.collection("audit_logs").add(entry);
  } catch (err) {
    console.error(`[AUDIT] Failed to write ${action} log for ${resource}/${resourceId}`, err);
  }
}

export async function auditUserCreate(
  actor: { uid: string; role: string },
  targetUid: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, "user.create", "users", targetUid, "success", meta);
}

export async function auditUserUpdate(
  actor: { uid: string; role: string },
  targetUid: string,
  fields: string[],
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, "user.update", "users", targetUid, "success", {
    ...meta,
    fields,
  });
}

export async function auditUserDelete(
  actor: { uid: string; role: string },
  targetUid: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, "user.delete", "users", targetUid, "success", meta);
}

export async function auditEventCreate(
  actor: { uid: string; role: string },
  eventId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, "event.create", "events", eventId, "success", meta);
}

export async function auditEventUpdate(
  actor: { uid: string; role: string },
  eventId: string,
  fields: string[],
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, "event.update", "events", eventId, "success", {
    ...meta,
    fields,
  });
}

export async function auditEventTransition(
  actor: { uid: string; role: string },
  eventId: string,
  action: string,
  fromStatus: string,
  toStatus: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, `event.${action}`, "events", eventId, "success", {
    ...meta,
    from_status: fromStatus,
    to_status: toStatus,
  });
}

export async function auditRegistrationCreate(
  actor: { uid: string; role: string },
  registrationId: string,
  eventId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, "registration.create", "registrations", registrationId, "success", {
    ...meta,
    event_id: eventId,
  });
}

export async function auditRegistrationCancel(
  actor: { uid: string; role: string },
  registrationId: string,
  eventId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog(actor.uid, actor.role, "registration.cancel", "registrations", registrationId, "success", {
    ...meta,
    event_id: eventId,
  });
}
