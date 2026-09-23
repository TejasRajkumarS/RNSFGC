import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { type Department, type SessionUser } from "@/lib/auth/types";
import { writeAuditLog } from "@/lib/audit";

export async function listDepartments(): Promise<Department[]> {
  const snapshot = await getAdminDb().collection("departments").orderBy("name").get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Department);
}

export async function createDepartment(actor: SessionUser, name: string): Promise<Department> {
  const now = new Date();
  const docRef = await getAdminDb().collection("departments").add({ name, created_at: now, updated_at: now });
  await writeAuditLog(actor.uid, actor.role, "department.create", "departments", docRef.id, "success", { name });
  return { id: docRef.id, name, created_at: now, updated_at: now };
}
