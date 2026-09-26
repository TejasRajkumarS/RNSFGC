import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { type CollegeEvent } from "@/data/events";
import { listPublicEvents, toCollegeEvent } from "@/lib/services/events";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import DeleteEventButton from "@/components/events/DeleteEventButton";

export const metadata: Metadata = {
  title: "Events — RNS First Grade College",
  description: "Explore upcoming and completed events at RNS First Grade College.",
};

type EventCard = CollegeEvent & { id: string };

async function getEvents(): Promise<EventCard[]> {
  try {
    const events = await listPublicEvents();
    return events.map((event) => ({ ...toCollegeEvent(event), id: event.id }));
  } catch (err) {
    console.error("[EVENTS] Failed to load events", err);
    return [];
  }
}

export default async function EventsPage() {
  const [events, user] = await Promise.all([getEvents(), getSessionUser()]);
  const canDelete = Boolean(user && hasPermission(user.role, "events.delete"));

  return (
    <PageShell
      eyebrow="Events"
      title="Events"
      description="Campus programmes, lectures, celebrations, and student milestones — brought together in one clear destination."
    >
      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy-950/20 bg-white p-10 text-center text-sm text-navy-950/60">
            No upcoming events are published right now — please check back soon.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.id || event.title}
                className="group relative flex flex-col rounded-xl border border-navy-950/10 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-950/25 hover:shadow-lift"
              >
                {canDelete && event.id && (
                  <div className="absolute right-4 top-4 z-10">
                    <DeleteEventButton eventId={event.id} />
                  </div>
                )}
                <span className="inline-flex w-fit items-center rounded-md bg-navy-950 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light">
                  {event.date} · {event.day}
                </span>
                <h2 className="mt-6 font-display text-2xl font-semibold leading-snug text-navy-950">{event.title}</h2>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-navy-950/60">{event.description}</p>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-950/45">
                  {event.location}
                </p>
                <Link
                  href="/registration"
                  className="mt-6 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold-dark transition-transform duration-300 group-hover:translate-x-1"
                >
                  Register <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            href="/events/upcoming"
            className="rounded-md bg-navy-950 px-7 py-4 text-[12px] font-extrabold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-800"
          >
            View Upcoming Events
          </Link>
          <Link
            href="/events/completed"
            className="rounded-md border border-navy-950/25 px-7 py-4 text-[12px] font-extrabold uppercase tracking-[0.16em] text-navy-950 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-950 hover:bg-navy-950 hover:text-white"
          >
            View Completed Events
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
