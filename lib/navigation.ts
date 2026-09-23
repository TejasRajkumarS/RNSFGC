import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { type Role } from "@/lib/auth/types";

export interface DashboardSection {
  label: string;
  href: string;
  permission: Permission;
  description: string;
  icon: string;
}

export const ROLE_DASHBOARDS: Record<Role, DashboardSection[]> = {
  ADMIN: [
    {
      label: "User Management",
      href: "/dashboard/users",
      permission: "users.view",
      description: "Create users, assign roles and departments.",
      icon: "users",
    },
    {
      label: "Events Overview",
      href: "/dashboard/events",
      permission: "events.view",
      description: "All college events and their workflow state.",
      icon: "events",
    },
    {
      label: "Departments",
      href: "/dashboard/departments",
      permission: "departments.view",
      description: "Academic departments used for event scoping.",
      icon: "building",
    },
    {
      label: "Audit Logs",
      href: "/dashboard/audit",
      permission: "audit.view",
      description: "System-wide activity trail.",
      icon: "audit",
    },
  ],
  PRINCIPAL: [
    {
      label: "College Events",
      href: "/dashboard/events",
      permission: "events.view",
      description: "Monitor events across every department.",
      icon: "events",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      permission: "reports.view",
      description: "Event reports and participant exports.",
      icon: "report",
    },
    {
      label: "Departments",
      href: "/dashboard/departments",
      permission: "departments.view",
      description: "Academic departments at a glance.",
      icon: "building",
    },
  ],
  HOD: [
    {
      label: "Department Events",
      href: "/dashboard/events",
      permission: "events.view",
      description: "Track your department\u2019s events end to end.",
      icon: "events",
    },
    {
      label: "Approval Queue",
      href: "/dashboard/approvals",
      permission: "events.approve",
      description: "Approve or reject submitted events.",
      icon: "approve",
    },
    {
      label: "Department Reports",
      href: "/dashboard/reports",
      permission: "reports.view",
      description: "Reports for your department\u2019s events.",
      icon: "report",
    },
  ],
  EVENT_COORDINATOR: [
    {
      label: "My Events",
      href: "/dashboard/events",
      permission: "events.view",
      description: "Events you coordinate, from draft to completion.",
      icon: "events",
    },
    {
      label: "Create Event",
      href: "/dashboard/events/create",
      permission: "events.create",
      description: "Draft a new event proposal.",
      icon: "create",
    },
    {
      label: "Participants",
      href: "/dashboard/participants",
      permission: "participants.view",
      description: "Registrations across your events.",
      icon: "participants",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      permission: "reports.create",
      description: "Submit reports after conducting events.",
      icon: "report",
    },
  ],
  FACULTY: [
    {
      label: "Available Events",
      href: "/dashboard/events",
      permission: "events.view",
      description: "Browse and register for events.",
      icon: "events",
    },
    {
      label: "My Registrations",
      href: "/dashboard/registrations",
      permission: "participants.view",
      description: "Events you have registered for.",
      icon: "registrations",
    },
    {
      label: "Certificates",
      href: "/dashboard/certificates",
      permission: "certificates.view",
      description: "Certificates you have earned.",
      icon: "certificate",
    },
  ],
  STUDENT: [
    {
      label: "Available Events",
      href: "/dashboard/events",
      permission: "events.view",
      description: "Browse and register for events.",
      icon: "events",
    },
    {
      label: "My Registrations",
      href: "/dashboard/registrations",
      permission: "participants.view",
      description: "Events you have registered for.",
      icon: "registrations",
    },
    {
      label: "Certificates",
      href: "/dashboard/certificates",
      permission: "certificates.view",
      description: "Certificates you have earned.",
      icon: "certificate",
    },
  ],
};

export function getSectionsForRole(role: Role): DashboardSection[] {
  return (ROLE_DASHBOARDS[role] ?? []).filter((s) => hasPermission(role, s.permission));
}
