"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { getSectionsForRole } from "@/lib/navigation";
import { IconBadge } from "@/components/dashboard/icons";

interface DashboardContentProps {
  user: SessionUser;
}

interface Stat {
  label: string;
  value: number | null;
  loading: boolean;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function fetchCount(url: string): Promise<number | null> {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return typeof data.total === "number" ? data.total : data.data.length;
    }
  } catch {
    // ignore
  }
  return null;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const sections = getSectionsForRole(user.role);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    const role = user.role;
    const jobs: Array<{ label: string; promise: Promise<number | null> }> = [];

    jobs.push({ label: "Events", promise: fetchCount("/api/events") });

    if (hasPermission(role, "events.approve")) {
      jobs.push({ label: "Pending Approvals", promise: fetchCount("/api/events?status=SUBMITTED") });
    }
    if (role === "ADMIN") {
      jobs.push({ label: "Users", promise: fetchCount("/api/users") });
    }
    if (role === "EVENT_COORDINATOR") {
      jobs.push({ label: "Participants", promise: fetchCount("/api/registrations") });
    }
    if (["FACULTY", "STUDENT"].includes(role)) {
      jobs.push({ label: "My Registrations", promise: fetchCount("/api/registrations/me") });
      jobs.push({ label: "My Certificates", promise: fetchCount("/api/certificates/me") });
    }

    const labels = jobs.map((j) => j.label);
    const run = () => {
      setStats(labels.map((label) => ({ label, value: null, loading: true })));
      Promise.all(jobs.map((j) => j.promise)).then((values) => {
        setStats(labels.map((label, i) => ({ label, value: values[i], loading: false })));
      });
    };
    run();
  }, [user.role]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            {user.role.replace("_", " ")} Dashboard
          </p>
          {/* suppressHydrationWarning: greeting/date depend on the viewer's time zone, so
              server and client legitimately compute different text — client text wins. */}
          <h1 className="mt-2 font-display text-3xl font-semibold text-navy-950 md:text-4xl" suppressHydrationWarning>
            {typeof window === "undefined" ? "Welcome" : greeting()}, {user.full_name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-navy-950/60" suppressHydrationWarning>
            {typeof window === "undefined" ? "" : todayLabel()}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-navy-950/10 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-navy-950 shadow-card">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          {user.role.replace("_", " ")}
        </span>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-card">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-950/50">{stat.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-navy-950">
                {stat.loading ? (
                  <span className="inline-block h-8 w-10 animate-pulse rounded-md bg-navy-950/10" />
                ) : stat.value === null ? (
                  "—"
                ) : (
                  stat.value
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">No accessible sections for your role.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group flex flex-col rounded-xl border border-navy-950/10 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-950/25 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <IconBadge name={section.icon} />
              <h3 className="mt-4 font-display text-lg font-semibold text-navy-950 transition-colors group-hover:text-gold-dark">
                {section.label}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-950/60">{section.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-navy-950/40 transition-all duration-300 group-hover:gap-2.5 group-hover:text-navy-950">
                Open <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
