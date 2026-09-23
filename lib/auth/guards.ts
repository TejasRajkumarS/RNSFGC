import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { type SessionUser, type Role } from "@/lib/auth/types";
import { type Event } from "@/lib/workflows/events";
import { AuthError } from "@/lib/auth/errors";

export { AuthError };

export {
  canTransitionEvent,
  canViewEventDetails,
  canManageAttendance,
  canManageEvent,
} from "@/lib/auth/transition-policy";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401, "UNAUTHENTICATED", "Authentication required");
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new AuthError(403, "FORBIDDEN", "Insufficient permissions");
  }
  return user;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError(403, "FORBIDDEN", "Role not authorized");
  }
  return user;
}

// Page-level guards: unauthorized-but-signed-in users land on /unauthorized
// instead of a generic 500 render error. Use from RSC pages only (never routes).
export async function requirePagePermission(permission: Permission): Promise<SessionUser> {
  try {
    return await requirePermission(permission);
  } catch (err) {
    if (err instanceof AuthError) redirect(err.status === 401 ? "/login" : "/unauthorized");
    throw err;
  }
}

export async function requirePageRole(roles: Role[]): Promise<SessionUser> {
  try {
    return await requireRole(roles);
  } catch (err) {
    if (err instanceof AuthError) redirect(err.status === 401 ? "/login" : "/unauthorized");
    throw err;
  }
}

export async function assertDepartmentScope(user: SessionUser, targetDepartmentId: string): Promise<void> {
  if (user.role === "HOD" && user.department_id !== targetDepartmentId) {
    throw new AuthError(403, "FORBIDDEN", "Cross-department access denied");
  }
  if (user.role === "EVENT_COORDINATOR" && user.department_id !== targetDepartmentId) {
    throw new AuthError(403, "FORBIDDEN", "Cross-department access denied");
  }
}

export async function assertEventOwnership(user: SessionUser, event: Event): Promise<void> {
  if (user.role === "EVENT_COORDINATOR" && event.coordinator_id !== user.uid) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized for this event");
  }
}

export async function assertRegistrationOwnership(
  user: SessionUser,
  registration: { user_uid: string }
): Promise<void> {
  if (registration.user_uid !== user.uid) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized for this registration");
  }
}
