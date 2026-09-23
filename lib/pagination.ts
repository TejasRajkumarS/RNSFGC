export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 200;
export const MAX_QUERY_FETCH = 500;

export interface ListParams {
  limit: number;
  offset: number;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

function encodeCursorPayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursorPayload<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function encodeOffsetCursor(offset: number): string {
  return encodeCursorPayload({ o: offset });
}

export function decodeOffsetCursor(raw: string | null | undefined): number {
  const offset = decodeCursorPayload<{ o?: unknown }>(raw)?.o;
  return typeof offset === "number" && Number.isInteger(offset) && offset >= 0 ? offset : 0;
}

export function encodeValueCursor(value: string): string {
  return encodeCursorPayload({ v: value });
}

export function decodeValueCursor(raw: string | null | undefined): string | null {
  const value = decodeCursorPayload<{ v?: unknown }>(raw)?.v;
  return typeof value === "string" && value ? value : null;
}

export function parseListParams(searchParams: URLSearchParams): ListParams {
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isNaN(limitRaw) ? DEFAULT_PAGE_SIZE : Math.min(Math.max(limitRaw, 1), MAX_PAGE_SIZE);
  return { limit, offset: decodeOffsetCursor(searchParams.get("cursor")) };
}

export function paginateInMemory<T>(items: T[], params: ListParams, mayHaveMore = false): Paginated<T> {
  const slice = items.slice(params.offset, params.offset + params.limit);
  const moreInWindow = params.offset + slice.length < items.length;
  const pageIsFull = slice.length === params.limit;
  const nextCursor =
    moreInWindow || (mayHaveMore && pageIsFull) ? encodeOffsetCursor(params.offset + slice.length) : null;
  return { items: slice, nextCursor, total: items.length };
}
