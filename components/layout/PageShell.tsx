import type { ReactNode } from "react";
import EventNavigation from "../events/EventNavigation";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>
        <section className="border-b border-navy-950/10 bg-paper px-6 pt-32 md:px-12 md:pt-44">
          <div className="mx-auto max-w-[1440px] pb-14 md:pb-20">
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-navy-950/45">
              <span className="h-px w-10 bg-gold" aria-hidden="true" />
              {eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.98] tracking-tight text-navy-950 md:text-7xl">
              {title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-navy-950/65">{description}</p>
          </div>
        </section>

        <EventNavigation />
        {children}
      </main>
      <Footer />
    </>
  );
}
