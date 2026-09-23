import { getSessionUser } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { getEvent } from "@/lib/services/events";
import { canViewEventDetails } from "@/lib/auth/guards";
import EventDetailClient from "./EventDetailClient";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  if (!canViewEventDetails(user, event)) redirect("/unauthorized");
  return <EventDetailClient user={user} event={event} />;
}
