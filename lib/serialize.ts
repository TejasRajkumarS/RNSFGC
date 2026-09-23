// Converts Firestore Timestamp objects into JS Dates at the service boundary,
// so JSON API responses emit ISO strings instead of {seconds, nanoseconds}.
export function toJsDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  const ts = value as { toDate?: () => Date } | null | undefined;
  if (ts && typeof ts.toDate === "function") return ts.toDate();
  return null;
}

export function serializeTimestamps<T extends object>(obj: T, fields: readonly (keyof T)[]): T {
  const out: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  for (const field of fields) {
    out[field as string] = toJsDate(out[field as string]);
  }
  return out as T;
}
