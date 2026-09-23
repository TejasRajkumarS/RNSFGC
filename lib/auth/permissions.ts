import { type Role } from "./types.ts";

export type Permission =
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "users.deactivate"
  | "users.assign_role"
  | "users.assign_department"
  | "departments.view"
  | "departments.create"
  | "departments.update"
  | "events.view"
  | "events.create"
  | "events.update"
  | "events.delete"
  | "events.submit"
  | "events.approve"
  | "events.reject"
  | "events.schedule"
  | "events.conduct"
  | "events.complete"
  | "events.cancel"
  | "participants.view"
  | "participants.register"
  | "participants.update"
  | "attendance.view"
  | "attendance.manage"
  | "documents.view"
  | "documents.upload"
  | "documents.delete"
  | "expenses.view"
  | "expenses.create"
  | "expenses.update"
  | "reports.view"
  | "reports.create"
  | "reports.export"
  | "certificates.view"
  | "certificates.generate"
  | "dashboard.view"
  | "audit.view";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
    "users.deactivate",
    "users.assign_role",
    "users.assign_department",
    "departments.view",
    "departments.create",
    "departments.update",
    "events.view",
    "events.create",
    "events.update",
    "events.delete",
    "events.submit",
    "events.approve",
    "events.reject",
    "events.schedule",
    "events.conduct",
    "events.complete",
    "events.cancel",
    "participants.view",
    "participants.register",
    "participants.update",
    "attendance.view",
    "attendance.manage",
    "documents.view",
    "documents.upload",
    "documents.delete",
    "expenses.view",
    "expenses.create",
    "expenses.update",
    "reports.view",
    "reports.create",
    "reports.export",
    "certificates.view",
    "certificates.generate",
    "dashboard.view",
    "audit.view",
  ],
  PRINCIPAL: [
    "dashboard.view",
    "events.view",
    "reports.view",
    "reports.export",
    "participants.view",
    "attendance.view",
    "documents.view",
    "expenses.view",
    "certificates.view",
    "departments.view",
  ],
  HOD: [
    "dashboard.view",
    "events.view",
    "events.approve",
    "events.reject",
    "participants.view",
    "attendance.view",
    "documents.view",
    "reports.view",
    "reports.export",
    "departments.view",
  ],
  EVENT_COORDINATOR: [
    "dashboard.view",
    "departments.view",
    "events.view",
    "events.create",
    "events.update",
    "events.submit",
    "events.schedule",
    "events.conduct",
    "events.cancel",
    "participants.view",
    "participants.update",
    "attendance.view",
    "attendance.manage",
    "documents.view",
    "documents.upload",
    "expenses.view",
    "expenses.create",
    "expenses.update",
    "reports.view",
    "reports.create",
    "certificates.view",
  ],
  FACULTY: [
    "dashboard.view",
    "events.view",
    "participants.register",
    "participants.update",
    "participants.view",
    "attendance.view",
    "attendance.manage",
    "certificates.view",
  ],
  STUDENT: ["dashboard.view", "events.view", "participants.register", "participants.view", "certificates.view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
