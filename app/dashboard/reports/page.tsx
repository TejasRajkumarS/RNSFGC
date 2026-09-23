import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/guards";
import ReportsDashboardClient from "./ReportsDashboardClient";

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  await requireUser();
  if (!hasAnyPermission(user.role, ["reports.view", "reports.create"])) redirect("/unauthorized");
  return <ReportsDashboardClient user={user} />;
}
