import { requirePagePermission } from "@/lib/auth/guards";
import CreateEventClient from "./CreateEventClient";

export default async function CreateEventPage() {
  await requirePagePermission("events.create");
  return <CreateEventClient />;
}
