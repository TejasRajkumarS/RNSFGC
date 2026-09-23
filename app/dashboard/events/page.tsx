import { requirePagePermission } from "@/lib/auth/guards";
import EventsDashboardClient from "./EventsDashboardClient";

export default async function EventsDashboardPage() {
  const user = await requirePagePermission("events.view");
  return <EventsDashboardClient user={user} />;
}
