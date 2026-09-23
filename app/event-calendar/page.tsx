import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { type CollegeEvent } from "@/data/events";
import { listPublicEvents, toCollegeEvent } from "@/lib/services/events";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import DeleteEventButton from "@/components/DeleteEventButton";

export const metadata: Metadata = {
  title: "Event Calendar — RNS First Grade College",
  description: "The semester event calendar for RNS First Grade College.",
};

type EventCard = CollegeEvent & { id: string };

async function getEvents(): Promise<EventCard[]> {
  try {
    const events = await listPublicEvents();
    return events.map((event) => ({ ...toCollegeEvent(event), id: event.id }));
  } catch (err) {
    console.error("[EVENTS] Failed to load calendar events", err);
    return [];
  }
}

export default async function EventCalendarPage() {
  const [events, user] = await Promise.all([getEvents(), getSessionUser()]);
  const canDelete = Boolean(user && hasPermission(user.role, "events.delete"));

  return (
    <PageShell
      eyebrow="Events — Calendar"
      title="Event Calendar"
      description="A semester rhythm at a glance — orientation, cultural programming, and industry conversations arranged by date."
    >
      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy-950/20 bg-white p-10 text-center text-sm text-navy-950/60">
            No events are scheduled right now — please check back soon.
          </p>
        ) : (
          <ol className="space-y-5">
            {events.map((event) => (
              <li
                key={event.id || event.title}
                className="grid overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:grid-cols-[220px_1fr]"
              >
                <div className="flex items-center gap-5 bg-navy-950 p-8 text-white md:flex-col md:items-start md:justify-center">
                  <span className="font-display text-3xl font-semibold leading-none">
                    {event.date.split(" ")[1]}{" "}
                    <span className="italic text-gold-light">{event.date.split(" ")[0]}</span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50 md:mt-3">
                    {event.day}
                  </span>
                </div>
                <div className="p-8 md:p-10">
                  <h2 className="font-display text-2xl font-semibold leading-snug text-navy-950">{event.title}</h2>
                  <p className="mt-4 max-w-3xl text-sm leading-relaxed text-navy-950/60">{event.description}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-950/45">
                      {event.location}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {canDelete && event.id && <DeleteEventButton eventId={event.id} />}
                      <Link
                        href="/registration"
                        className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold-dark underline decoration-gold/60 decoration-2 underline-offset-8 transition-colors hover:text-navy-950"
                      >
                        Register →
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </PageShell>
  );
}
