import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionCookie } from "@/lib/auth/session";
import { ok, errorResponse, handleApiError } from "@/lib/api";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from "@/lib/firebase/config";
import { sessionSchema, parseBody } from "@/lib/validation";
import { allowRateLimited, clientKey } from "@/lib/rate-limit";

// Login-CSRF guard: this endpoint sets the session cookie, so a cross-site POST
// must not be able to silently sign a victim's browser into an attacker's account.
// SameSite=Lax blocks cookie *sending* but not cookie *setting* — check the origin.
function isSameOriginRequest(req: NextRequest): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(req)) {
      return errorResponse(403, "FORBIDDEN", "Cross-site session creation is not allowed");
    }
    if (!allowRateLimited(clientKey(req, "session"), 100, 60 * 60 * 1000)) {
      return errorResponse(429, "RATE_LIMITED", "Too many attempts — try again later");
    }

    const body = await req.json();
    const { idToken } = parseBody(sessionSchema, body);

    const sessionCookie = await createSessionCookie(idToken);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: "/",
    });
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
