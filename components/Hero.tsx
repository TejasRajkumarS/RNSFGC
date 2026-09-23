"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import HeroTypography from "./HeroTypography";
import SupportingText from "./SupportingText";

export default function Hero() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Very subtle scroll drift on the photograph (disabled for reduced motion).
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const el = parallaxRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY * 0.12, 90);
        el.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      aria-label="RNS First Grade College"
      className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden bg-navy-950"
    >
      {/* Architectural photograph */}
      <div ref={parallaxRef} className="absolute inset-[-7%] will-change-transform">
        <div className="anim-hero-image relative h-full w-full">
          <Image
            src="/hero.jpg"
            alt="The white multi-story RNS First Grade College building beneath a pale blue sky, framed by a tall coconut palm tree"
            fill
            priority
            sizes="100vw"
            quality={90}
            className="object-cover object-bottom"
          />
        </div>
      </div>

      {/* Legibility scrims */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-navy-950/10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy-950/55 to-transparent" />

      {/* Content — anchored to the lower left */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-6 pb-24 md:px-12 md:pb-28">
        <p
          className="anim-fade-up flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-gold-light"
          style={{ animationDelay: "120ms" }}
        >
          <span className="h-px w-10 bg-gold" aria-hidden="true" />
          RNS Group of Institutions — Bengaluru
        </p>

        <HeroTypography />

        <SupportingText />

        <div className="anim-fade-up mt-9 flex flex-wrap items-center gap-3.5" style={{ animationDelay: "620ms" }}>
          <Link
            href="/events"
            className="rounded-md bg-gold px-7 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-navy-950 shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Explore Events
          </Link>
          <Link
            href="#about"
            className="rounded-md border border-white/35 px-7 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Discover the College
          </Link>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="anim-fade-in pointer-events-none absolute bottom-7 right-6 hidden flex-col items-center gap-3 text-white/70 md:right-12 lg:flex"
        style={{ animationDelay: "900ms" }}
        aria-hidden="true"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] [writing-mode:vertical-rl]">Scroll</span>
        <span className="h-12 w-px bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}
