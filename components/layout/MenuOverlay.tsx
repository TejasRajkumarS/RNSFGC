"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { type SessionUser } from "@/lib/auth/types";
import { getSectionsForRole } from "@/lib/navigation";

const PRIMARY_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Events", href: "/events" },
  { label: "Event Calendar", href: "/event-calendar" },
  { label: "Registration", href: "/registration" },
];

export default function MenuOverlay({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: SessionUser | null;
  onLogout: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const dashboardSections = user ? getSectionsForRole(user.role) : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      id="menu-overlay"
      className="anim-overlay fixed inset-0 z-[70] flex flex-col bg-navy-950 font-sans text-white"
    >
      {/* Overlay header */}
      <div className="mx-auto flex h-16 w-full max-w-[1440px] shrink-0 items-center justify-between px-6 md:h-20 md:px-12">
        <span className="flex items-center gap-3.5">
          <Image
            src="/rnslogo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-md bg-white object-contain p-0.5"
          />
          <span className="text-sm font-extrabold uppercase tracking-[0.08em]">RNS First Grade College</span>
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="group relative flex h-10 w-10 items-center justify-center text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <span className="absolute h-[2px] w-6 rotate-45 bg-current" />
          <span className="absolute h-[2px] w-6 -rotate-45 bg-current" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col justify-center px-6 py-8 md:px-12 md:py-10">
          {/* Primary nav */}
          <nav aria-label="Primary">
            <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-4 md:gap-x-10 md:gap-y-5">
              {PRIMARY_LINKS.map((link, i) => (
                <li key={link.label} className="overflow-hidden">
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="anim-overlay-link group inline-flex items-baseline gap-2.5 font-sans text-2xl font-semibold tracking-tight text-white transition-colors duration-300 hover:text-gold-light md:text-3xl"
                    style={{ animationDelay: `${80 + i * 50}ms` }}
                  >
                    <span className="text-xs font-bold text-gold/80">{String(i + 1).padStart(2, "0")}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Role-specific dashboard links */}
          {user && dashboardSections.length > 0 && (
            <nav
              aria-label={`${user.role} dashboard`}
              className="anim-overlay-link mt-10 border-t border-white/10 pt-6 md:mt-12"
              style={{ animationDelay: "350ms" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-light">
                {user.full_name} · {user.role.replace("_", " ")}
              </p>
              <ul className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-4 md:gap-x-10">
                {dashboardSections.map((section, i) => (
                  <li key={section.href} className="overflow-hidden">
                    <Link
                      href={section.href}
                      onClick={onClose}
                      className="group inline-flex items-baseline gap-2.5 font-sans text-xl font-semibold tracking-tight text-white/85 transition-colors duration-300 hover:text-gold-light md:text-2xl"
                    >
                      <span className="text-xs font-bold text-gold/60">{String(i + 1).padStart(2, "0")}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                        {section.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Contact */}
          <div
            className="anim-overlay-link mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 md:mt-16 md:flex-row md:items-end md:justify-between"
            style={{ animationDelay: "400ms" }}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-light">Get in touch</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                RNS First Grade College, RNS Group of Institutions
                <br />
                Bengaluru, Karnataka, India
              </p>
            </div>
            <a
              href="mailto:admissions@rnsfc.example.com"
              className="text-sm font-semibold text-white underline decoration-gold/60 decoration-2 underline-offset-8 transition-colors hover:text-gold-light"
            >
              admissions@rnsfc.example.com
            </a>
          </div>
        </div>
      </div>

      {/* Footer bar — auth actions */}
      <div className="mx-auto flex w-full max-w-[1440px] shrink-0 items-center justify-between gap-4 px-6 pb-8 pt-4 md:px-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
          RNS First Grade College — Bengaluru
        </p>
        {user ? (
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/85 transition-colors hover:text-gold-light"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold-light transition-colors hover:text-white"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold-light transition-colors hover:text-white"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
