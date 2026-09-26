import type { ReactNode } from "react";

export default function Section({
  id,
  index,
  eyebrow,
  title,
  children,
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-navy-950/8">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-20 md:grid-cols-12 md:gap-8 md:px-12 md:py-32">
        <div className="md:col-span-4">
          <p className="flex items-baseline gap-3 text-xs font-bold uppercase tracking-[0.3em] text-navy-950/45">
            <span className="font-display text-base italic text-gold-dark">{index}</span>
            {eyebrow}
          </p>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-navy-950 md:text-5xl">
            {title}
          </h2>
          <span className="mt-7 block h-px w-16 bg-gold" aria-hidden="true" />
        </div>
        <div className="text-lg leading-relaxed text-navy-950/70 md:col-span-7 md:col-start-6 md:text-xl">
          {children}
        </div>
      </div>
    </section>
  );
}
