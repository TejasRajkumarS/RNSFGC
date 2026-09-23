import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionEvent,
  canViewEventDetails,
  canManageAttendance,
  canManageEvent,
} from "../lib/auth/transition-policy.ts";
import { type SessionUser, type Role } from "../lib/auth/types.ts";
import { type Event, type EventWorkflowTransition } from "../lib/workflows/events.ts";

function makeUser(role: Role, uid = "user-1", department_id: string | null = "dept-1"): SessionUser {
  return { uid, email: "", full_name: "", role, department_id, is_active: true };
}

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    title: "Test Event",
    description: "",
    category: "WORKSHOP",
    department_id: "dept-1",
    coordinator_id: "user-1",
    co_coordinator_id: null,
    venue: null,
    scheduled_at: null,
    chief_guest: null,
    expected_participants: null,
    participant_limit: null,
    status: "DRAFT",
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe("canTransitionEvent", () => {
  test("coordinator can submit own draft", () => {
    assert.ok(canTransitionEvent(makeUser("EVENT_COORDINATOR"), makeEvent(), "submit"));
  });

  test("coordinator cannot submit another coordinator event", () => {
    assert.ok(!canTransitionEvent(makeUser("EVENT_COORDINATOR", "user-2"), makeEvent(), "submit"));
  });

  test("admin can submit any event", () => {
    assert.ok(
      canTransitionEvent(makeUser("ADMIN", "admin-1"), makeEvent({ coordinator_id: "someone-else" }), "submit")
    );
  });

  test("HOD and STUDENT cannot submit", () => {
    assert.ok(!canTransitionEvent(makeUser("HOD"), makeEvent(), "submit"));
    assert.ok(!canTransitionEvent(makeUser("STUDENT"), makeEvent(), "submit"));
  });

  test("HOD can approve submitted event in own department", () => {
    assert.ok(canTransitionEvent(makeUser("HOD"), makeEvent({ status: "SUBMITTED" }), "approve"));
  });

  test("HOD cannot approve event in another department", () => {
    assert.ok(
      !canTransitionEvent(
        makeUser("HOD", "user-1", "dept-2"),
        makeEvent({ status: "SUBMITTED", department_id: "dept-1" }),
        "approve"
      )
    );
  });

  test("coordinator cannot approve or reject", () => {
    const submitted = makeEvent({ status: "SUBMITTED" });
    assert.ok(!canTransitionEvent(makeUser("EVENT_COORDINATOR"), submitted, "approve"));
    assert.ok(!canTransitionEvent(makeUser("EVENT_COORDINATOR"), submitted, "reject"));
  });

  test("only admin can complete", () => {
    const reported = makeEvent({ status: "REPORT_SUBMITTED" });
    assert.ok(canTransitionEvent(makeUser("ADMIN"), reported, "complete"));
    assert.ok(!canTransitionEvent(makeUser("HOD"), reported, "complete"));
    assert.ok(!canTransitionEvent(makeUser("EVENT_COORDINATOR"), reported, "complete"));
    assert.ok(!canTransitionEvent(makeUser("PRINCIPAL"), reported, "complete"));
  });

  test("coordinator and admin can schedule and conduct, HOD cannot", () => {
    const approved = makeEvent({ status: "APPROVED" });
    const scheduled = makeEvent({ status: "SCHEDULED" });
    assert.ok(canTransitionEvent(makeUser("EVENT_COORDINATOR"), approved, "schedule"));
    assert.ok(canTransitionEvent(makeUser("EVENT_COORDINATOR"), scheduled, "conduct"));
    assert.ok(canTransitionEvent(makeUser("ADMIN"), approved, "schedule"));
    assert.ok(!canTransitionEvent(makeUser("HOD"), approved, "schedule"));
    assert.ok(!canTransitionEvent(makeUser("HOD"), scheduled, "conduct"));
  });

  test("wrong current status returns false even for admin", () => {
    assert.ok(!canTransitionEvent(makeUser("ADMIN"), makeEvent({ status: "APPROVED" }), "approve"));
    assert.ok(!canTransitionEvent(makeUser("ADMIN"), makeEvent({ status: "COMPLETED" }), "complete"));
  });

  test("unknown action returns false", () => {
    assert.ok(!canTransitionEvent(makeUser("ADMIN"), makeEvent(), "nonexistent" as EventWorkflowTransition));
  });

  test("coordinator can cancel own event, not others", () => {
    assert.ok(canTransitionEvent(makeUser("EVENT_COORDINATOR"), makeEvent({ status: "APPROVED" }), "cancel"));
    assert.ok(
      !canTransitionEvent(makeUser("EVENT_COORDINATOR", "user-2"), makeEvent({ status: "APPROVED" }), "cancel")
    );
  });
});

describe("canViewEventDetails", () => {
  test("admin and principal can view any event", () => {
    assert.ok(canViewEventDetails(makeUser("ADMIN"), makeEvent()));
    assert.ok(canViewEventDetails(makeUser("PRINCIPAL"), makeEvent()));
  });

  test("HOD limited to own department", () => {
    assert.ok(canViewEventDetails(makeUser("HOD"), makeEvent()));
    assert.ok(!canViewEventDetails(makeUser("HOD", "user-1", "dept-2"), makeEvent({ department_id: "dept-1" })));
  });

  test("coordinator limited to own events", () => {
    assert.ok(canViewEventDetails(makeUser("EVENT_COORDINATOR"), makeEvent()));
    assert.ok(!canViewEventDetails(makeUser("EVENT_COORDINATOR", "user-2"), makeEvent({ coordinator_id: "user-1" })));
  });

  test("faculty and student cannot view event details", () => {
    assert.ok(!canViewEventDetails(makeUser("FACULTY"), makeEvent()));
    assert.ok(!canViewEventDetails(makeUser("STUDENT"), makeEvent()));
  });
});

describe("canManageAttendance", () => {
  test("admin can always manage attendance", () => {
    assert.ok(canManageAttendance(makeUser("ADMIN", "admin-1"), makeEvent({ coordinator_id: "x" })));
  });

  test("coordinator limited to own events", () => {
    assert.ok(canManageAttendance(makeUser("EVENT_COORDINATOR"), makeEvent()));
    assert.ok(!canManageAttendance(makeUser("EVENT_COORDINATOR", "user-2"), makeEvent({ coordinator_id: "user-1" })));
  });

  test("HOD and faculty limited to own department", () => {
    assert.ok(canManageAttendance(makeUser("HOD"), makeEvent()));
    assert.ok(canManageAttendance(makeUser("FACULTY"), makeEvent()));
    assert.ok(!canManageAttendance(makeUser("FACULTY", "user-1", "dept-2"), makeEvent({ department_id: "dept-1" })));
  });

  test("student and principal cannot manage attendance", () => {
    assert.ok(!canManageAttendance(makeUser("STUDENT"), makeEvent()));
    assert.ok(!canManageAttendance(makeUser("PRINCIPAL"), makeEvent()));
  });
});

describe("canManageEvent", () => {
  test("admin, coordinator (own), and HOD (own dept) can manage", () => {
    assert.ok(canManageEvent(makeUser("ADMIN"), makeEvent()));
    assert.ok(canManageEvent(makeUser("EVENT_COORDINATOR"), makeEvent()));
    assert.ok(canManageEvent(makeUser("HOD"), makeEvent()));
  });

  test("coordinator cannot manage other coordinator events", () => {
    assert.ok(!canManageEvent(makeUser("EVENT_COORDINATOR", "user-2"), makeEvent({ coordinator_id: "user-1" })));
  });

  test("HOD cannot manage other department events", () => {
    assert.ok(!canManageEvent(makeUser("HOD", "user-1", "dept-2"), makeEvent({ department_id: "dept-1" })));
  });

  test("faculty, student, and principal cannot manage events", () => {
    assert.ok(!canManageEvent(makeUser("FACULTY"), makeEvent()));
    assert.ok(!canManageEvent(makeUser("STUDENT"), makeEvent()));
    assert.ok(!canManageEvent(makeUser("PRINCIPAL"), makeEvent()));
  });
});
