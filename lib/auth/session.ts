import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from "@/lib/firebase/config";
import { type SessionUser, type Role, DEFAULT_ROLE } from "@/lib/auth/types";

export async function createSessionCookie(idToken: string): Promise<string> {
  const adminAuth = getAdminAuth();
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE * 1000,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  let uid: string;
  try {
    const adminAuth = getAdminAuth();
    // verifySessionCookie with checkRevoked=true handles expired/revoked sessions
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decodedClaims.uid;
  } catch {
    return null; // invalid or expired session
  }

  const adminDb = getAdminDb();
  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;

  const userData = userDoc.data()!;
  // Deactivated accounts cannot use the system
  if (userData.is_active === false) return null;

  return {
    uid,
    email: userData.email ?? "",
    full_name: userData.full_name ?? "User",
    // Incomplete profile docs may lack a role — fall back to the app default
    role: (userData.role as Role | undefined) ?? DEFAULT_ROLE,
    department_id: userData.department_id ?? null,
    is_active: userData.is_active ?? true,
  };
}
