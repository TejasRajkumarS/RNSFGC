import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { toJsDate } from "@/lib/serialize";
import {
  type Paginated,
  decodeValueCursor,
  encodeValueCursor,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/lib/pagination";

export interface AuditLog {
  id: string;
  actor_uid: string;
  actor_role: string;
  action: string;
  resource: string;
  resource_id: string;
  result: "success" | "failure";
  meta?: Record<string, unknown>;
  created_at: Date | null;
}

export async function listAuditLogs(limit = DEFAULT_PAGE_SIZE, cursor?: string | null): Promise<Paginated<AuditLog>> {
  const clamped = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
  // Fetch one extra row to detect whether a next page exists
  let query: FirebaseFirestore.Query = getAdminDb()
    .collection("audit_logs")
    .orderBy("created_at", "desc")
    .limit(clamped + 1);
  // The cursor encodes an ISO string (see nextCursor below) — parse it explicitly;
  // toJsDate only handles Date/Timestamp instances and would silently drop the cursor.
  const rawCursor = decodeValueCursor(cursor);
  const cursorDate = rawCursor ? new Date(rawCursor) : null;
  if (cursorDate && !Number.isNaN(cursorDate.getTime())) query = query.startAfter(cursorDate);

  const snap = await query.get();
  const hasMore = snap.docs.length > clamped;
  const docs = hasMore ? snap.docs.slice(0, clamped) : snap.docs;
  const items = docs.map((d) => {
    const data = d.data() as AuditLog;
    return { ...data, id: d.id, created_at: toJsDate(data.created_at) };
  });

  const last = docs[docs.length - 1];
  const lastDate = last ? toJsDate((last.data() as AuditLog).created_at) : null;
  const nextCursor = hasMore && lastDate ? encodeValueCursor(lastDate.toISOString()) : null;
  return { items, nextCursor };
}
