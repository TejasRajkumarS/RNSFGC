"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "All Events", href: "/events" },
  { label: "Upcoming", href: "/events/upcoming" },
  { label: "Completed", href: "/events/completed" },
  { label: "Calendar", href: "/event-calendar" },
  { label: "Register", href: "/registration" },
];

export default function EventNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Event navigation"
      className="sticky top-16 z-40 border-b border-navy-950/10 bg-white/85 backdrop-blur-md md:top-20"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-6 md:gap-2 md:px-12">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative whitespace-nowrap px-4 py-4 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors after:absolute after:inset-x-4 after:bottom-0 after:h-[2px] after:transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                isActive ? "text-navy-950 after:bg-gold" : "text-navy-950/45 after:bg-transparent hover:text-navy-950"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
