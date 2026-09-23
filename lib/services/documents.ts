import "server-only";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp, getAdminDb } from "@/lib/firebase/admin";
import { getFirebaseStorageBucket } from "@/lib/firebase/config";
import { AuthError, canManageEvent } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { requireEvent } from "@/lib/services/events";
import { writeAuditLog } from "@/lib/audit";
import { serializeTimestamps } from "@/lib/serialize";

export interface DocumentMeta {
  id: string;
  event_id: string;
  name: string;
  category: string;
  url: string;
  storage_path: string;
  size: number;
  content_type: string;
  uploaded_by: string;
  uploaded_at: Date | null;
}

const DOC_DATE_FIELDS = ["uploaded_at"] as const;

function serializeDocument<T extends { uploaded_at: unknown }>(doc: T): T {
  return serializeTimestamps(doc, DOC_DATE_FIELDS);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

// Client-supplied Content-Type is untrusted: only known document/image types are
// accepted, so the bucket can't be abused to host HTML/SVG/executables under the org domain.
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function isInlinePreviewable(contentType: string): boolean {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

export async function listEventDocuments(eventId: string): Promise<DocumentMeta[]> {
  // Equality-only query — no composite index required
  const snap = await getAdminDb().collection("documents").where("event_id", "==", eventId).get();
  return snap.docs
    .map((d) => serializeDocument({ id: d.id, ...d.data() } as DocumentMeta))
    .sort((a, b) => (b.uploaded_at?.getTime() ?? 0) - (a.uploaded_at?.getTime() ?? 0));
}

export async function uploadEventDocument(
  user: SessionUser,
  eventId: string,
  file: { buffer: Buffer; originalName: string; contentType: string },
  category: string
): Promise<DocumentMeta> {
  const event = await requireEvent(eventId);
  if (!canManageEvent(user, event)) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized to upload documents for this event");
  }

  if (!ALLOWED_CONTENT_TYPES.has(file.contentType)) {
    throw new AuthError(400, "VALIDATION_ERROR", "Unsupported file type");
  }

  const bucket = getStorage(getAdminApp()).bucket(getFirebaseStorageBucket());
  const storagePath = `events/${eventId}/${Date.now()}-${sanitizeFileName(file.originalName)}`;
  const fileRef = bucket.file(storagePath);
  await fileRef.save(file.buffer, {
    contentType: file.contentType,
    metadata: {
      // Office/text formats download instead of rendering in the browser
      contentDisposition: isInlinePreviewable(file.contentType) ? "inline" : "attachment",
    },
    resumable: false,
  });
  await fileRef.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  const now = new Date();
  const data = {
    event_id: eventId,
    name: file.originalName,
    category,
    url: publicUrl,
    storage_path: storagePath,
    size: file.buffer.length,
    content_type: file.contentType,
    uploaded_by: user.uid,
    uploaded_at: now,
  };
  const ref = await getAdminDb().collection("documents").add(data);
  await writeAuditLog(user.uid, user.role, "document.upload", "documents", ref.id, "success", {
    event_id: eventId,
    name: file.originalName,
  });
  return serializeDocument({ id: ref.id, ...data });
}

export async function deleteDocument(user: SessionUser, documentId: string): Promise<void> {
  const db = getAdminDb();
  const docRef = db.collection("documents").doc(documentId);
  const doc = await docRef.get();
  if (!doc.exists) throw new AuthError(404, "NOT_FOUND", "Document not found");
  const data = doc.data() as DocumentMeta;

  // documents.delete permission is ADMIN-only per the role matrix
  if (!hasPermission(user.role, "documents.delete")) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized to delete documents");
  }

  // Storage deletion is best-effort — the metadata record must go either way
  try {
    await bucketFileDelete(data.storage_path);
  } catch (err) {
    console.error(`[DOCUMENTS] Failed to delete storage file ${data.storage_path}`, err);
  }
  await docRef.delete();
  await writeAuditLog(user.uid, user.role, "document.delete", "documents", documentId, "success", {
    event_id: data.event_id,
  });
}

async function bucketFileDelete(storagePath: string): Promise<void> {
  const bucket = getStorage(getAdminApp()).bucket(getFirebaseStorageBucket());
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
}
