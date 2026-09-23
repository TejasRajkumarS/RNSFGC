import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("rns_session");

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Note: no redirect for public pages (e.g. /login) based on cookie presence
  // alone — expired/invalid cookies would cause an infinite redirect loop
  // between /login and /dashboard. The login page checks session validity
  // client-side via /api/auth/me and redirects only when the session is real.

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/unauthorized"],
};
