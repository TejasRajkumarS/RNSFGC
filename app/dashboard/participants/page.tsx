import { requirePagePermission } from "@/lib/auth/guards";
import ParticipantsClient from "./ParticipantsClient";

export default async function ParticipantsPage() {
  await requirePagePermission("participants.view");
  return <ParticipantsClient />;
}
