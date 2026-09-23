import { requirePagePermission, requirePageRole } from "@/lib/auth/guards";
import UsersDashboardClient from "./UsersDashboardClient";

export default async function UsersPage() {
  await requirePageRole(["ADMIN"]);
  const user = await requirePagePermission("users.view");
  return <UsersDashboardClient user={user} />;
}
