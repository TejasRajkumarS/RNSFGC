import Image from "next/image";
import Link from "next/link";

const exploreLinks = [{ label: "About", href: "/#about" }];

const eventLinks = [
  { label: "All Events", href: "/events" },
  { label: "Upcoming Events", href: "/events/upcoming" },
  { label: "Completed Events", href: "/events/completed" },
  { label: "Event Calendar", href: "/event-calendar" },
  { label: "Registration", href: "/registration" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3.5">
              <Image
                src="/rnslogo.png"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-md bg-white object-contain p-0.5"
              />
              <span className="font-display text-xl leading-tight">RNS First Grade College</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              An undergraduate institution of the RNS Group of Institutions — experience excellence in education, scope
              and opportunities for growth.
            </p>
            <a
              href="mailto:admissions@rnsfc.example.com"
              className="mt-6 inline-block border-b border-gold/50 pb-1 text-sm font-semibold text-gold-light transition-colors hover:border-gold-light"
            >
              admissions@rnsfc.example.com
            </a>
          </div>

          {/* Explore */}
          <nav aria-label="Footer — explore">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-light">Explore</p>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Events */}
          <nav aria-label="Footer — events">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-light">Events</p>
            <ul className="mt-5 space-y-3">
              {eventLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-white/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} RNS First Grade College</p>
          <p>Bengaluru, Karnataka, India</p>
        </div>
      </div>
    </footer>
  );
}
