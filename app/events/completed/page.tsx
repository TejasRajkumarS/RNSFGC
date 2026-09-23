import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { listCompletedPublicEvents, toCollegeEvent, type Event } from "@/lib/services/events";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import DeleteEventButton from "@/components/DeleteEventButton";

export const metadata: Metadata = {
  title: "Completed Events — RNS First Grade College",
  description: "Completed event recaps from RNS First Grade College.",
};

export default async function CompletedEventsPage() {
  let events = [] as Event[];
  let user = null as Awaited<ReturnType<typeof getSessionUser>>;
  try {
    [events, user] = await Promise.all([listCompletedPublicEvents(), getSessionUser()]);
  } catch {
    events = [];
  }
  const canDelete = Boolean(user && hasPermission(user.role, "events.delete"));

  return (
    <PageShell
      eyebrow="Events — Completed"
      title="Completed Events"
      description="A growing archive of campus programmes and student moments once their captions, photos, and recaps are published."
    >
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-950/20 bg-white p-10 text-center shadow-card md:p-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-dark">Archive in preparation</p>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-[1.05] tracking-tight text-navy-950 md:text-5xl">
              Completed event recaps are coming soon
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-navy-950/60">
              Event highlights, attendance summaries, and selected photographs will appear here after the current
              semester&apos;s confirmed events conclude.
            </p>
            <Link
              href="/event-calendar"
              className="mt-10 inline-block rounded-md bg-navy-950 px-7 py-4 text-[12px] font-extrabold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-800"
            >
              View Event Calendar
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {events.map((event) => {
              const publicEvent = toCollegeEvent(event);
              return (
                <article
                  key={event.id}
                  className="relative grid gap-8 rounded-xl border border-navy-950/10 bg-white p-8 shadow-card md:grid-cols-[120px_1fr_auto] md:items-center md:p-10"
                >
                  {canDelete && (
                    <div className="absolute right-4 top-4 z-10">
                      <DeleteEventButton eventId={event.id} />
                    </div>
                  )}
                  <div className="flex h-24 w-[120px] flex-col items-center justify-center rounded-lg bg-navy-950 text-center">
                    <span className="font-display text-2xl font-semibold leading-none text-white">
                      {publicEvent.date.split(" ")[1]}
                    </span>
                    <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-light">
                      {publicEvent.date.split(" ")[0]} · {publicEvent.day.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold leading-snug text-navy-950">{event.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-950/60">{event.description}</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-950/45">
                      {event.venue ?? "RNS Campus"}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Completed
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
