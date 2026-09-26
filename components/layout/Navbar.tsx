"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import MenuOverlay from "./MenuOverlay";
import { type SessionUser } from "@/lib/auth/types";

interface AuthUser {
  user: SessionUser | null;
  loading: boolean;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [auth, setAuth] = useState<AuthUser>({ user: null, loading: true });
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (mounted) {
          setAuth({ user: data.success ? data.data : null, loading: false });
        }
      } catch {
        if (mounted) setAuth({ user: null, loading: false });
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch {
      // ignore
    }
  };

  const onDark = isHome && !scrolled;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-all duration-300 ${
          onDark ? "bg-transparent" : "bg-white/90 shadow-[0_1px_0_0_rgb(11_28_44/0.08)] backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:h-20 md:px-12">
          <Link
            href="/"
            aria-label="RNS First Grade College — home"
            className="group flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            <Image
              src="/rnslogo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-md bg-white object-contain p-0.5 transition-transform duration-300 group-hover:-translate-y-0.5"
            />
            <span className={`leading-tight transition-colors duration-300 ${onDark ? "text-white" : "text-navy-950"}`}>
              <span className="block whitespace-nowrap text-[13px] font-extrabold uppercase tracking-[0.08em] md:text-sm">
                RNS First Grade College
              </span>
              <span
                className={`block whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.22em] transition-colors duration-300 ${onDark ? "text-white/65" : "text-navy-950/50"}`}
              >
                RNS Group of Institutions
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3 md:gap-5">
            {!auth.loading && !auth.user && (
              <>
                <Link
                  href="/registration"
                  className={`hidden rounded-md px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:inline-flex ${
                    onDark ? "bg-gold text-navy-950 hover:bg-gold-light" : "bg-navy-900 text-white hover:bg-navy-800"
                  }`}
                >
                  Register
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  className={`hidden rounded-md px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:inline-flex ${
                    onDark
                      ? "border border-white/30 text-white hover:bg-white/10"
                      : "bg-navy-900 text-white hover:bg-navy-800"
                  }`}
                >
                  Login
                </Link>
              </>
            )}

            {!auth.loading && auth.user && (
              <>
                <Link
                  href="/dashboard"
                  className={`hidden rounded-md px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:inline-flex ${
                    onDark ? "bg-gold text-navy-950 hover:bg-gold-light" : "bg-navy-900 text-white hover:bg-navy-800"
                  }`}
                >
                  Dashboard
                </Link>
                <div
                  className={`hidden items-center gap-3 rounded-md px-3 py-2 transition-colors duration-300 sm:flex ${
                    onDark ? "bg-white/10" : "bg-navy-950/5"
                  }`}
                >
                  <span
                    className={`hidden max-w-[140px] truncate text-[11px] font-medium lg:block ${
                      onDark ? "text-white/85" : "text-navy-950/70"
                    }`}
                  >
                    {auth.user.full_name}
                  </span>
                  <span
                    className={`hidden items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] lg:inline-flex ${
                      onDark ? "bg-white/15 text-white" : "bg-navy-950/10 text-navy-950"
                    }`}
                  >
                    {(auth.user.role ?? "Member").replace("_", " ")}
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors ${
                      onDark ? "text-white/75 hover:text-white" : "text-navy-950/70 hover:text-navy-950"
                    }`}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="menu-overlay"
              onClick={() => setOpen((v) => !v)}
              className={`group flex h-10 w-10 flex-col items-end justify-center transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${onDark ? "text-white" : "text-navy-950"}`}
            >
              <span className="block h-[2px] w-7 bg-current transition-all duration-300 group-hover:w-5" />
              <span className="mt-[7px] block h-[2px] w-7 bg-current transition-all duration-300 group-hover:w-4" />
            </button>
          </div>
        </div>
      </header>

      <MenuOverlay open={open} onClose={() => setOpen(false)} user={auth.user} onLogout={handleLogout} />
    </>
  );
}
