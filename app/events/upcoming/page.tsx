import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { type CollegeEvent } from "@/data/events";
import { listPublicEvents, toCollegeEvent } from "@/lib/services/events";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import DeleteEventButton from "@/components/events/DeleteEventButton";

export const metadata: Metadata = {
  title: "Upcoming Events — RNS First Grade College",
  description: "Upcoming events at RNS First Grade College.",
};

type EventCard = CollegeEvent & { id: string };

async function getUpcoming(): Promise<EventCard[]> {
  try {
    const events = await listPublicEvents();
    return events.map((event) => ({ ...toCollegeEvent(event), id: event.id }));
  } catch (err) {
    console.error("[EVENTS] Failed to load upcoming events", err);
    return [];
  }
}

export default async function UpcomingEventsPage() {
  const [events, user] = await Promise.all([getUpcoming(), getSessionUser()]);
  const canDelete = Boolean(user && hasPermission(user.role, "events.delete"));

  return (
    <PageShell
      eyebrow="Events — Upcoming"
      title="Upcoming Events"
      description="A chronological view of confirmed campus moments currently open to students and visitors."
    >
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24">
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy-950/20 bg-white p-10 text-center text-sm text-navy-950/60">
            No upcoming events are published right now — please check back soon.
          </p>
        ) : (
          <div className="space-y-5">
            {events.map((event) => (
              <article
                key={event.id || event.title}
                className="relative grid gap-8 rounded-xl border border-navy-950/10 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-950/25 hover:shadow-lift md:grid-cols-[120px_1fr_auto] md:items-center md:p-10"
              >
                {canDelete && event.id && (
                  <div className="absolute right-4 top-4 z-10">
                    <DeleteEventButton eventId={event.id} />
                  </div>
                )}
                <div className="flex h-24 w-[120px] flex-col items-center justify-center rounded-lg bg-navy-950 text-center">
                  <span className="font-display text-2xl font-semibold leading-none text-white">
                    {event.date.split(" ")[1]}
                  </span>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-light">
                    {event.date.split(" ")[0]} · {event.day.slice(0, 3)}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-semibold leading-snug text-navy-950">{event.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-950/60">{event.description}</p>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-950/45">
                    {event.location}
                  </p>
                </div>

                <Link
                  href="/registration"
                  className="whitespace-nowrap rounded-md bg-navy-950 px-6 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  Register
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
