import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <DashboardContent user={user} />;
}
