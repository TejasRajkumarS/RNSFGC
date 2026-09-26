import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import Section from "@/components/layout/Section";
import EventNavigation from "@/components/events/EventNavigation";
import EventCarousel from "@/components/events/EventCarousel";
import Footer from "@/components/layout/Footer";
import { type CollegeEvent } from "@/data/events";
import { listPublicEvents, toCollegeEvent } from "@/lib/services/events";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

type EventCard = CollegeEvent & { id: string };

const pillars = [
  {
    title: "Academic Rigour",
    text: "A disciplined curriculum that values depth over noise — seminars, labs, and field work at its core.",
  },
  {
    title: "Mentored Growth",
    text: "Small cohorts and accessible faculty, pairing instruction with genuine, ongoing mentorship.",
  },
  {
    title: "Quiet Ambition",
    text: "An open, spacious campus in Bengaluru designed for focused study and personal growth.",
  },
];

async function getCarouselEvents(): Promise<EventCard[]> {
  try {
    const events = await listPublicEvents();
    const mapped = events.map((event) => ({ ...toCollegeEvent(event), id: event.id }));
    return mapped;
  } catch (err) {
    // Firestore unconfigured or unavailable — render an honest empty state
    console.error("[HOME] Failed to load events", err);
    return [];
  }
}

export default async function Home() {
  const [carouselEvents, user] = await Promise.all([getCarouselEvents(), getSessionUser()]);
  const canDelete = Boolean(user && hasPermission(user.role, "events.delete"));
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <EventNavigation />

        <Section id="about" index="01" eyebrow="About" title="About RNSFC">
          <p>
            RNS First Grade College is an undergraduate institution committed to academic rigour and personal growth.
            Set within the RNS Group of Institutions in Bengaluru, the college pairs a disciplined academic culture with
            an open, spacious campus designed for focused study and quiet ambition.
          </p>
          <div className="mt-12 grid gap-4 text-base sm:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <p className="font-display text-lg font-semibold text-navy-950">{pillar.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-navy-950/60">{pillar.text}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="events" index="02" eyebrow="Events" title="Upcoming Events">
          <p className="mb-12">
            Seminars, celebrations, and student milestones — the semester at RNSFC, gathered in one place.
          </p>
          {carouselEvents.length > 0 ? (
            <EventCarousel events={carouselEvents} canDelete={canDelete} />
          ) : (
            <p className="rounded-xl border border-dashed border-navy-950/20 bg-white p-10 text-center text-sm text-navy-950/60">
              No upcoming events are published right now — please check back soon.
            </p>
          )}
          <Link
            href="/events"
            className="mt-10 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-navy-950 underline decoration-gold decoration-2 underline-offset-8 transition-colors hover:text-gold-dark"
          >
            View all events
          </Link>
        </Section>

        {/* Closing call-to-action band */}
        <section className="bg-navy-950 text-white">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-end md:justify-between md:px-12 md:py-28">
            <div>
              <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-gold-light">
                <span className="h-px w-10 bg-gold" aria-hidden="true" />
                Get involved
              </p>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
                Be part of what&apos;s next at <span className="italic text-gold-light">RNSFC.</span>
              </h2>
            </div>
            <Link
              href="/registration"
              className="shrink-0 rounded-md bg-gold px-8 py-4 text-[12px] font-extrabold uppercase tracking-[0.16em] text-navy-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              Register for an Event
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
