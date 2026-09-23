"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { type SessionUser } from "@/lib/auth/types";
import { getSectionsForRole, type DashboardSection } from "@/lib/navigation";
import { DashboardIcon } from "@/components/dashboard/icons";

interface DashboardShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/events") {
    return pathname === href || (pathname.startsWith("/dashboard/events/") && pathname !== "/dashboard/events/create");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarNav({ user, pathname, onNavigate }: { user: SessionUser; pathname: string; onNavigate?: () => void }) {
  const sections = getSectionsForRole(user.role);
  const homeActive = pathname === "/dashboard";

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
        {user.role.replace("_", " ")}
      </p>
      <ul className="space-y-1">
        <li>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors ${homeActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <DashboardIcon name="home" className="h-[18px] w-[18px] shrink-0" />
            <span>Overview</span>
            {homeActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
          </Link>
        </li>
        {sections.map((section: DashboardSection) => {
          const active = isActivePath(pathname, section.href);
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                <DashboardIcon name={section.icon} className="h-[18px] w-[18px] shrink-0" />
                <span>{section.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(getFirebaseAuth());
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch {
      // ignore
    }
  };

  const initials = user.full_name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const brand = (
    <Link href="/" className="flex items-center gap-3 px-2" aria-label="RNS First Grade College — home">
      <Image
        src="/rnslogo.png"
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-md bg-white object-contain p-0.5"
      />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-extrabold uppercase tracking-[0.08em] text-white">
          RNS First Grade College
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">Event Management</span>
      </span>
    </Link>
  );

  const userCard = (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-navy-950">
          {initials || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-gold-light">
            {user.role.replace("_", " ")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <DashboardIcon name="logout" className="h-[18px] w-[18px]" />
        </button>
      </div>
      <Link
        href="/"
        className="mt-3 block px-1 text-[11px] font-semibold text-white/40 transition-colors hover:text-gold-light"
      >
        ← Back to public site
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-950 md:flex">
        <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-4">{brand}</div>
        <SidebarNav user={user} pathname={pathname} />
        {userCard}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-navy-950 px-4 md:hidden">
        <div className="min-w-0 flex-1">{brand}</div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-white transition-colors hover:bg-white/10"
        >
          <span className="sr-only">Open menu</span>
          <span className="block h-[2px] w-6 bg-current" />
          <span className="absolute mt-3 block h-[2px] w-6 bg-current" />
          <span className="absolute -mt-3 block h-[2px] w-6 bg-current" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="anim-overlay relative flex h-full w-72 max-w-[85%] flex-col bg-navy-950 shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
              {brand}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <span className="relative block h-4 w-4">
                  <span className="absolute top-1/2 h-[2px] w-4 -translate-y-1/2 rotate-45 bg-current" />
                  <span className="absolute top-1/2 h-[2px] w-4 -translate-y-1/2 -rotate-45 bg-current" />
                </span>
              </button>
            </div>
            <SidebarNav user={user} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            {userCard}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-[1360px] px-5 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}
