import { requirePageRole } from "@/lib/auth/guards";
import RegistrationsDashboardClient from "./RegistrationsDashboardClient";

export default async function RegistrationsPage() {
  await requirePageRole(["STUDENT", "FACULTY"]);
  return <RegistrationsDashboardClient />;
}
