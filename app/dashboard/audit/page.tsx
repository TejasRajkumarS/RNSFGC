import { requirePagePermission } from "@/lib/auth/guards";
import AuditLogClient from "./AuditLogClient";

export default async function AuditPage() {
  await requirePagePermission("audit.view");
  return <AuditLogClient />;
}
