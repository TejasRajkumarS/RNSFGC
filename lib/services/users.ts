import "server-only";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { type Role, type AppUser, type SessionUser } from "@/lib/auth/types";
import { auditUserCreate, auditUserUpdate, auditUserDelete, writeAuditLog } from "@/lib/audit";
import { AuthError } from "@/lib/auth/errors";
import { MAX_QUERY_FETCH } from "@/lib/pagination";

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const adminDb = getAdminDb();
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  return { uid, ...doc.data() } as AppUser;
}

export async function listUsersForAdmin(): Promise<
  Array<{ uid: string; email: string; full_name: string; role: Role; department_id: string | null; is_active: boolean }>
> {
  // No orderBy: orderBy("full_name") would silently exclude docs missing that field.
  // Sorted in JS instead; capped defensively like other unbounded lookups.
  const usersSnap = await getAdminDb().collection("users").limit(MAX_QUERY_FETCH).get();
  const users: Array<{
    uid: string;
    email: string;
    full_name: string;
    role: Role;
    department_id: string | null;
    is_active: boolean;
  }> = [];
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    users.push({
      uid: doc.id,
      email: data.email,
      full_name: data.full_name ?? "",
      role: data.role as Role,
      department_id: data.department_id ?? null,
      is_active: data.is_active ?? true,
    });
  }
  users.sort((a, b) => a.full_name.localeCompare(b.full_name));
  return users;
}

export async function updateUser(
  actor: SessionUser,
  targetUid: string,
  updates: { role?: Role; department_id?: string | null; is_active?: boolean; full_name?: string }
): Promise<void> {
  if (actor.uid === targetUid) {
    const forbiddenFields = ["role", "department_id", "is_active"];
    if (Object.keys(updates).some((k) => forbiddenFields.includes(k))) {
      throw new AuthError(403, "SELF_ACTION_FORBIDDEN", "Cannot modify own role, department, or active status");
    }
  }
  const docRef = getAdminDb().collection("users").doc(targetUid);
  const doc = await docRef.get();
  if (!doc.exists) throw new AuthError(404, "NOT_FOUND", "User not found");
  const updateData: Record<string, unknown> = {};
  if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.department_id !== undefined) updateData.department_id = updates.department_id;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (Object.keys(updateData).length === 0) return;
  updateData.updated_at = new Date();
  await docRef.update(updateData);
  await auditUserUpdate({ uid: actor.uid, role: actor.role }, targetUid, Object.keys(updateData));
}

export async function createUser(
  actor: SessionUser,
  email: string,
  password: string,
  full_name: string,
  role: Role,
  department_id: string | null
): Promise<string> {
  const adminAuth = getAdminAuth();
  const userRecord = await adminAuth.createUser({ email, password, displayName: full_name });
  const now = new Date();
  try {
    await getAdminDb().collection("users").doc(userRecord.uid).set({
      email,
      full_name,
      role,
      department_id,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    // Compensating rollback: without this the Auth account would exist with no
    // profile — permanently locked out, with the email address taken.
    await adminAuth.deleteUser(userRecord.uid).catch(() => {});
    throw err;
  }
  await auditUserCreate({ uid: actor.uid, role: actor.role }, userRecord.uid, { email, role, department_id });
  return userRecord.uid;
}

export async function signupStudent(email: string, password: string, fullName: string): Promise<string> {
  const adminAuth = getAdminAuth();
  let userRecord;
  try {
    userRecord = await adminAuth.createUser({ email, password, displayName: fullName });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/email-already-exists") {
      throw new AuthError(409, "CONFLICT", "An account with this email already exists");
    }
    if (code === "auth/invalid-password") {
      throw new AuthError(400, "VALIDATION_ERROR", "Password must be at least 6 characters");
    }
    throw err;
  }
  const now = new Date();
  try {
    await getAdminDb().collection("users").doc(userRecord.uid).set({
      email,
      full_name: fullName,
      role: "STUDENT",
      department_id: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    // Compensating rollback so the Auth account is not orphaned without a profile
    await adminAuth.deleteUser(userRecord.uid).catch(() => {});
    throw err;
  }
  // Self-registration: the student is the actor of their own signup
  await writeAuditLog(userRecord.uid, "STUDENT", "user.signup", "users", userRecord.uid, "success", { email });
  return userRecord.uid;
}

export async function deleteUser(actor: SessionUser, targetUid: string): Promise<void> {
  if (actor.uid === targetUid) {
    throw new AuthError(403, "SELF_ACTION_FORBIDDEN", "You cannot delete your own account");
  }
  const db = getAdminDb();
  const docRef = db.collection("users").doc(targetUid);
  const doc = await docRef.get();
  if (!doc.exists) throw new AuthError(404, "NOT_FOUND", "User not found");

  // Refuse deletion while the user still owns live records — deleting anyway would
  // orphan registrations (corrupting event capacity counters) and leave events
  // pointing at a nonexistent coordinator.
  const [activeRegs, coordinatedEvents] = await Promise.all([
    db
      .collection("registrations")
      .where("user_uid", "==", targetUid)
      .where("status", "==", "REGISTERED")
      .limit(1)
      .get(),
    db.collection("events").where("coordinator_id", "==", targetUid).limit(MAX_QUERY_FETCH).get(),
  ]);
  if (!activeRegs.empty) {
    throw new AuthError(409, "CONFLICT", "User has active event registrations — cancel them before deleting");
  }
  const openEvents = coordinatedEvents.docs.filter((d) => !["COMPLETED", "CANCELLED"].includes(d.data().status));
  if (openEvents.length > 0) {
    throw new AuthError(
      409,
      "CONFLICT",
      `User coordinates ${openEvents.length} non-finalized event(s) — reassign or finalize them before deleting`
    );
  }

  const targetEmail = (doc.data() as { email?: string }).email ?? "";
  const targetRole = (doc.data() as { role?: string }).role ?? "";
  try {
    await getAdminAuth().deleteUser(targetUid);
  } catch (err) {
    // Auth record may already be gone (e.g. deleted in Firebase Console) —
    // still remove the Firestore profile.
    const code = (err as { code?: string })?.code;
    if (code !== "auth/user-not-found") throw err;
  }
  await docRef.delete();
  await auditUserDelete({ uid: actor.uid, role: actor.role }, targetUid, { email: targetEmail, role: targetRole });
}
