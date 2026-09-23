import { requirePagePermission } from "@/lib/auth/guards";
import DepartmentsClient from "./DepartmentsClient";

export default async function DepartmentsPage() {
  const user = await requirePagePermission("departments.view");
  return <DepartmentsClient user={user} />;
}
