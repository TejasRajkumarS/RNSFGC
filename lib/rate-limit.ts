import "server-only";
import { type NextRequest } from "next/server";

// Lightweight in-memory sliding-window rate limiter. Suitable for a single-instance
// deployment; for multi-instance/serverless fleets, back this with Redis/Upstash.
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

/**
 * Returns true if the call is allowed; false when the key has exceeded `limit`
 * calls within `windowMs`.
 */
export function allowRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // Prevent unbounded growth from spoofed keys
  if (buckets.size > MAX_KEYS) buckets.clear();
  return true;
}

export function clientKey(req: NextRequest, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}
