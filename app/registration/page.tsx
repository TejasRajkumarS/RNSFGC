import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import { type CollegeEvent } from "@/data/events";
import { listPublicEvents, toCollegeEvent } from "@/lib/services/events";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import DeleteEventButton from "@/components/events/DeleteEventButton";
import RegistrationRequestButton from "@/components/events/RegistrationRequestButton";

export const metadata: Metadata = {
  title: "Event Registration — RNS First Grade College",
  description: "Register for upcoming events at RNS First Grade College.",
};

type EventCard = CollegeEvent & { id: string };

async function getEvents(): Promise<EventCard[]> {
  try {
    const events = await listPublicEvents();
    return events.map((event) => ({ ...toCollegeEvent(event), id: event.id }));
  } catch (err) {
    console.error("[REGISTRATION] Failed to load events", err);
    return [];
  }
}

export default async function RegistrationPage() {
  const [events, user] = await Promise.all([getEvents(), getSessionUser()]);
  const canDelete = Boolean(user && hasPermission(user.role, "events.delete"));

  return (
    <PageShell
      eyebrow="Events — Registration"
      title="Registration"
      description="Choose an upcoming campus event and send your registration request to the admissions team."
    >
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24">
        {/* Guidance note */}
        <div className="mb-10 flex flex-col gap-4 rounded-xl border border-gold/40 bg-gold/10 p-6 md:flex-row md:items-center md:gap-6 md:p-7">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-gold font-display text-lg italic text-navy-950">
            i
          </span>
          <p className="text-sm leading-relaxed text-navy-950/75">
            Registrations are confirmed by the admissions office over email. Pick an event below, fill in your details,
            and your request goes straight to the team — they will respond with next steps.
          </p>
        </div>

        <div className="space-y-5">
          {events.length === 0 && (
            <p className="rounded-xl border border-dashed border-navy-950/20 bg-white p-10 text-center text-sm text-navy-950/60">
              No events are open for registration right now — please check back soon.
            </p>
          )}
          {events.map((event) => (
            <article
              key={event.id || event.title}
              className="grid gap-6 rounded-xl border border-navy-950/10 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-950/25 hover:shadow-lift md:grid-cols-[1fr_auto] md:items-center md:p-10"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-dark">
                  {event.date} · {event.day}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold leading-snug text-navy-950">{event.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-950/60">{event.location}</p>
              </div>

              <div className="flex flex-col items-stretch gap-2 md:items-end">
                {canDelete && event.id && <DeleteEventButton eventId={event.id} />}
                {event.id && <RegistrationRequestButton eventId={event.id} eventTitle={event.title} />}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
