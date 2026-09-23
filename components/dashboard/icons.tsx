const paths: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  events: "M8 2v4M16 2v4M3.5 9.09h17M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  building: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4h6v4M9 7h1M14 7h1M9 11h1M14 11h1",
  audit: "M12 22s8-3.58 8-10V5l-8-3-8 3v7c0 6.42 8 10 8 10Zm-3-9.5 2 2 4-4.5",
  approve: "M20 6 9 17l-5-5",
  participants:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  report: "M18 20V10M12 20V4M6 20v-6",
  create: "M12 5v14M5 12h14",
  registrations:
    "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14l2 2 4-4",
  certificate: "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 0v7M8.21 13.89 7 23l5-3 5 3-1.21-9.11",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

export function DashboardIcon({ name, className }: { name: string; className?: string }) {
  const d = paths[name] ?? paths.events;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
    >
      <path d={d} />
    </svg>
  );
}

export function IconBadge({ name }: { name: string }) {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-950/5 text-navy-950 transition-colors duration-300 group-hover:bg-gold/15 group-hover:text-navy-950">
      <DashboardIcon name={name} className="h-5 w-5" />
    </span>
  );
}

export type IconName = keyof typeof paths;
