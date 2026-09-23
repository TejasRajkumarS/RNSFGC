export type EventStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "SCHEDULED"
  | "CONDUCTED"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "CANCELLED";

export type EventCategory =
  | "WORKSHOP"
  | "SEMINAR"
  | "FDP"
  | "GUEST_LECTURE"
  | "CONFERENCE"
  | "INDUSTRIAL_VISIT"
  | "COMPETITION"
  | "CULTURAL_EVENT"
  | "SPORT_EVENT"
  | "CLUB_ACTIVITY"
  | "HACKATHON"
  | "AWARENESS_PROGRAMME"
  | "ORIENTATION_PROGRAMME";

export type EventWorkflowTransition =
  "submit" | "approve" | "reject" | "schedule" | "conduct" | "submit_report" | "complete" | "cancel";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  department_id: string;
  coordinator_id: string;
  co_coordinator_id: string | null;
  venue: string | null;
  scheduled_at: Date | null;
  chief_guest: string | null;
  expected_participants: number | null;
  participant_limit: number | null;
  status: EventStatus;
  created_at: Date;
  updated_at: Date;
}

export interface EventInput {
  title: string;
  description: string;
  category: EventCategory;
  department_id: string;
  venue?: string;
  scheduled_at?: Date;
  chief_guest?: string;
  expected_participants?: number;
  participant_limit?: number;
}

export const EVENT_STATUS: Record<EventStatus, EventStatus> = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SCHEDULED: "SCHEDULED",
  CONDUCTED: "CONDUCTED",
  REPORT_SUBMITTED: "REPORT_SUBMITTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const EVENT_CATEGORIES: EventCategory[] = [
  "WORKSHOP",
  "SEMINAR",
  "FDP",
  "GUEST_LECTURE",
  "CONFERENCE",
  "INDUSTRIAL_VISIT",
  "COMPETITION",
  "CULTURAL_EVENT",
  "SPORT_EVENT",
  "CLUB_ACTIVITY",
  "HACKATHON",
  "AWARENESS_PROGRAMME",
  "ORIENTATION_PROGRAMME",
];

export interface TransitionRule {
  from: EventStatus[];
  to: EventStatus;
  permission: string;
}

export const EVENT_TRANSITIONS: Record<EventWorkflowTransition, TransitionRule> = {
  submit: { from: ["DRAFT", "REJECTED"], to: "SUBMITTED", permission: "events.submit" },
  approve: { from: ["SUBMITTED"], to: "APPROVED", permission: "events.approve" },
  reject: { from: ["SUBMITTED"], to: "REJECTED", permission: "events.reject" },
  schedule: { from: ["APPROVED"], to: "SCHEDULED", permission: "events.schedule" },
  conduct: { from: ["SCHEDULED"], to: "CONDUCTED", permission: "events.conduct" },
  submit_report: { from: ["CONDUCTED"], to: "REPORT_SUBMITTED", permission: "events.submit" },
  complete: { from: ["REPORT_SUBMITTED"], to: "COMPLETED", permission: "events.complete" },
  cancel: { from: ["DRAFT", "SUBMITTED", "APPROVED", "SCHEDULED"], to: "CANCELLED", permission: "events.cancel" },
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted for Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SCHEDULED: "Scheduled",
  CONDUCTED: "Conducted",
  REPORT_SUBMITTED: "Report Submitted",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ACTION_LABELS: Record<EventWorkflowTransition, string> = {
  submit: "Submit for Approval",
  approve: "Approve",
  reject: "Reject",
  schedule: "Schedule",
  conduct: "Mark Conducted",
  submit_report: "Submit Report",
  complete: "Complete",
  cancel: "Cancel",
};

export function getValidTransitions(status: EventStatus): EventWorkflowTransition[] {
  return Object.entries(EVENT_TRANSITIONS)
    .filter((entry) => entry[1].from.includes(status))
    .map(([action]) => action as EventWorkflowTransition);
}

export function getStatusBadge(status: EventStatus) {
  const colors: Record<EventStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    SCHEDULED: "bg-purple-100 text-purple-700",
    CONDUCTED: "bg-indigo-100 text-indigo-700",
    REPORT_SUBMITTED: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return { className: colors[status], label: status.replace("_", " ") };
}
