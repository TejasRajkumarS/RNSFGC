import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
