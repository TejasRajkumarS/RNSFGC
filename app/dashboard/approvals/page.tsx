import { requirePageRole } from "@/lib/auth/guards";
import ApprovalsDashboardClient from "./ApprovalsDashboardClient";

export default async function ApprovalsPage() {
  await requirePageRole(["HOD", "ADMIN"]);
  return <ApprovalsDashboardClient />;
}
