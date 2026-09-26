"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CollegeEvent } from "@/data/events";

export default function EventCarousel({
  events,
  canDelete = false,
}: {
  events: Array<CollegeEvent & { id?: string }>;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<number | null>(null);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0); // px per slide (card width + gap)
  const [visible, setVisible] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (eventId: string) => {
    if (
      !confirm(
        "Remove this event permanently? Its registrations, attendance, documents, expenses, reports, and certificates will also be removed."
      )
    ) {
      return;
    }
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error?.message || "Failed to remove event");
      }
    } catch {
      alert("Failed to remove event");
    } finally {
      setDeletingId(null);
    }
  };

  // Measure slide width and slides-in-view; recompute on resize.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const first = track.querySelector<HTMLElement>("[data-slide]");
      if (!first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      const w = first.getBoundingClientRect().width;
      setStep(w + gap);
      setVisible(Math.max(1, Math.round((track.clientWidth + gap) / (w + gap))));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  const maxIndex = Math.max(0, events.length - visible);
  const current = Math.min(index, maxIndex);

  const goTo = (i: number) => setIndex(Math.min(Math.max(i, 0), maxIndex));

  // Touch / pointer swipe (threshold-based, CSS transition animates the slide)
  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerStart.current === null) return;
    const delta = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) > 40) goTo(current + (delta < 0 ? 1 : -1));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  };

  return (
    <div className="text-base">
      {/* Controls */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-navy-950/40">
          {String(current + 1).padStart(2, "0")} / {String(maxIndex + 1).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label="Previous events"
            className="grid h-11 w-11 place-items-center rounded-md border border-navy-950/15 bg-white text-navy-950 shadow-card transition-all duration-300 hover:border-navy-950/40 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:shadow-card"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === maxIndex}
            aria-label="Next events"
            className="grid h-11 w-11 place-items-center rounded-md border border-navy-950/15 bg-white text-navy-950 shadow-card transition-all duration-300 hover:border-navy-950/40 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:shadow-card"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="m6 3 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewport — peeks at neighbouring cards via partial-width slides */}
      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Upcoming events"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="cursor-grab touch-pan-y overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:cursor-grabbing [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]"
      >
        <div
          ref={trackRef}
          className="flex gap-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{ transform: `translateX(${-current * step}px)` }}
        >
          {events.map((event, i) => (
            <div
              key={event.id || event.title}
              data-slide
              aria-hidden={i < current || i > current + visible - 1}
              className="relative min-w-0 shrink-0 basis-[82%] sm:basis-[60%] lg:basis-[44%] xl:basis-[41%]"
            >
              {canDelete && event.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(event.id!)}
                  disabled={deletingId === event.id}
                  aria-label="Remove event"
                  title="Remove this event"
                  // Keep aria-hidden slides out of the tab order, same as the card link below
                  tabIndex={i >= current && i <= current + visible - 1 ? 0 : -1}
                  className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md border border-red-200 bg-white/90 text-sm font-bold text-red-600 shadow-card backdrop-blur transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === event.id ? "…" : "×"}
                </button>
              )}
              <Link
                href="/registration"
                tabIndex={i >= current && i <= current + visible - 1 ? 0 : -1}
                className="group flex h-full flex-col rounded-xl border border-navy-950/10 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-950/30 hover:shadow-lift md:p-7"
              >
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-navy-950 text-center">
                  <span className="font-display text-xl font-semibold leading-none text-white">
                    {event.date.split(" ")[1]}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-light">
                    {event.date.split(" ")[0]}
                  </span>
                </div>
                <p className="mt-5 font-display text-lg font-semibold leading-snug text-navy-950 md:text-xl">
                  {event.title}
                </p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-950/45">
                  {event.day} · {event.location}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-navy-950/60">{event.description}</p>
                <span className="mt-auto pt-5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold-dark transition-transform duration-300 group-hover:translate-x-1">
                  Register →
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2.5">
        {Array.from({ length: maxIndex + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-7 bg-gold" : "w-1.5 bg-navy-950/20 hover:bg-navy-950/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
