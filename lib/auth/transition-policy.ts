import { hasPermission, type Permission } from "./permissions.ts";
import { type SessionUser } from "./types.ts";
import { type Event, type EventWorkflowTransition, EVENT_TRANSITIONS } from "../workflows/events.ts";

export function canTransitionEvent(user: SessionUser, event: Event, action: EventWorkflowTransition): boolean {
  const transition = EVENT_TRANSITIONS[action];
  if (!transition) return false;
  if (!transition.from.includes(event.status)) return false;
  if (!hasPermission(user.role, transition.permission as Permission)) return false;

  switch (action) {
    case "submit":
    case "submit_report":
    case "cancel":
      return event.coordinator_id === user.uid || user.role === "ADMIN";
    case "approve":
    case "reject":
      return user.role === "ADMIN" || (user.role === "HOD" && event.department_id === user.department_id);
    case "complete":
      return user.role === "ADMIN";
    case "schedule":
    case "conduct":
      return user.role === "ADMIN" || event.coordinator_id === user.uid;
    default:
      return false;
  }
}

export function canViewEventDetails(user: SessionUser, event: Event): boolean {
  if (user.role === "ADMIN" || user.role === "PRINCIPAL") return true;
  if (user.role === "HOD") return event.department_id === user.department_id;
  if (user.role === "EVENT_COORDINATOR") return event.coordinator_id === user.uid;
  return false;
}

export function canManageAttendance(user: SessionUser, event: Event): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "EVENT_COORDINATOR") return event.coordinator_id === user.uid;
  if (user.role === "HOD" || user.role === "FACULTY") return event.department_id === user.department_id;
  return false;
}

export function canManageEvent(user: SessionUser, event: Event): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "EVENT_COORDINATOR") return event.coordinator_id === user.uid;
  if (user.role === "HOD") return event.department_id === user.department_id;
  return false;
}
