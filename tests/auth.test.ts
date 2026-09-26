import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_PERMISSIONS,
  type Permission,
} from "../lib/auth/permissions.ts";
import { type Role } from "../lib/auth/types.ts";
import { getValidTransitions, EVENT_TRANSITIONS, EVENT_STATUS } from "../lib/workflows/events.ts";

describe("Permission System", () => {
  const testRolePerms = (role: Role, expected: string[]) => {
    for (const perm of expected) {
      test(`${role} has ${perm}`, () => assert.ok(hasPermission(role, perm as Permission)));
    }
    const allPerms = Object.values(ROLE_PERMISSIONS).flat();
    for (const perm of allPerms) {
      if (!expected.includes(perm)) {
        test(`${role} does NOT have ${perm}`, () => assert.ok(!hasPermission(role, perm as Permission)));
      }
    }
  };

  testRolePerms("ADMIN", [
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
  ]);

  testRolePerms("PRINCIPAL", [
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
  ]);

  testRolePerms("HOD", [
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
  ]);

  testRolePerms("EVENT_COORDINATOR", [
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
  ]);

  testRolePerms("FACULTY", [
    "dashboard.view",
    "events.view",
    "participants.register",
    "participants.update",
    "participants.view",
    "attendance.view",
    "attendance.manage",
    "certificates.view",
  ]);

  testRolePerms("STUDENT", [
    "dashboard.view",
    "events.view",
    "participants.register",
    "participants.view",
    "certificates.view",
  ]);

  test("hasAnyPermission works", () => {
    assert.ok(hasAnyPermission("STUDENT", ["events.view", "users.create"]));
    assert.ok(!hasAnyPermission("STUDENT", ["users.create", "users.update"]));
  });

  test("hasAllPermissions works", () => {
    assert.ok(hasAllPermissions("ADMIN", ["events.view", "users.create"]));
    assert.ok(!hasAllPermissions("STUDENT", ["events.view", "users.create"]));
  });
});

describe("Event Workflow Transitions", () => {
  test("DRAFT can submit", () => {
    const transitions = getValidTransitions(EVENT_STATUS.DRAFT);
    assert.ok(transitions.includes("submit"));
    assert.ok(!transitions.includes("approve"));
  });

  test("SUBMITTED can approve/reject", () => {
    const transitions = getValidTransitions(EVENT_STATUS.SUBMITTED);
    assert.ok(transitions.includes("approve"));
    assert.ok(transitions.includes("reject"));
    assert.ok(!transitions.includes("submit"));
  });

  test("APPROVED can schedule", () => {
    const transitions = getValidTransitions(EVENT_STATUS.APPROVED);
    assert.ok(transitions.includes("schedule"));
  });

  test("SCHEDULED can conduct", () => {
    const transitions = getValidTransitions(EVENT_STATUS.SCHEDULED);
    assert.ok(transitions.includes("conduct"));
  });

  test("CONDUCTED can submit_report", () => {
    const transitions = getValidTransitions(EVENT_STATUS.CONDUCTED);
    assert.ok(transitions.includes("submit_report"));
  });

  test("REPORT_SUBMITTED can complete", () => {
    const transitions = getValidTransitions(EVENT_STATUS.REPORT_SUBMITTED);
    assert.ok(transitions.includes("complete"));
  });

  test("cancel available from draft/submitted/approved/scheduled", () => {
    for (const status of [EVENT_STATUS.DRAFT, EVENT_STATUS.SUBMITTED, EVENT_STATUS.APPROVED, EVENT_STATUS.SCHEDULED]) {
      const transitions = getValidTransitions(status);
      assert.ok(transitions.includes("cancel"));
    }
  });

  test("cancel NOT available from conducted/report_submitted/completed/cancelled", () => {
    for (const status of [
      EVENT_STATUS.CONDUCTED,
      EVENT_STATUS.REPORT_SUBMITTED,
      EVENT_STATUS.COMPLETED,
      EVENT_STATUS.CANCELLED,
    ]) {
      const transitions = getValidTransitions(status);
      assert.ok(!transitions.includes("cancel"));
    }
  });

  test("transition rules have correct permissions", () => {
    assert.equal(EVENT_TRANSITIONS.submit.permission, "events.submit");
    assert.equal(EVENT_TRANSITIONS.approve.permission, "events.approve");
    assert.equal(EVENT_TRANSITIONS.reject.permission, "events.reject");
    assert.equal(EVENT_TRANSITIONS.schedule.permission, "events.schedule");
    assert.equal(EVENT_TRANSITIONS.conduct.permission, "events.conduct");
    assert.equal(EVENT_TRANSITIONS.submit_report.permission, "events.submit");
    assert.equal(EVENT_TRANSITIONS.complete.permission, "events.complete");
    assert.equal(EVENT_TRANSITIONS.cancel.permission, "events.cancel");
  });
});

describe("Role-based transition authorization", () => {
  test("Only HOD/ADMIN can approve", () => {
    const approvePerm = EVENT_TRANSITIONS.approve.permission;
    assert.ok(hasPermission("ADMIN", approvePerm as Permission));
    assert.ok(hasPermission("HOD", approvePerm as Permission));
    assert.ok(!hasPermission("EVENT_COORDINATOR", approvePerm as Permission));
    assert.ok(!hasPermission("STUDENT", approvePerm as Permission));
  });

  test("Only EVENT_COORDINATOR/ADMIN can submit", () => {
    const submitPerm = EVENT_TRANSITIONS.submit.permission;
    assert.ok(hasPermission("ADMIN", submitPerm as Permission));
    assert.ok(hasPermission("EVENT_COORDINATOR", submitPerm as Permission));
    assert.ok(!hasPermission("HOD", submitPerm as Permission));
    assert.ok(!hasPermission("STUDENT", submitPerm as Permission));
  });

  test("Only EVENT_COORDINATOR/ADMIN can create events", () => {
    assert.ok(hasPermission("ADMIN", "events.create" as Permission));
    assert.ok(hasPermission("EVENT_COORDINATOR", "events.create" as Permission));
    assert.ok(!hasPermission("HOD", "events.create" as Permission));
    assert.ok(!hasPermission("STUDENT", "events.create" as Permission));
  });

  test("Only ADMIN can manage users", () => {
    assert.ok(hasPermission("ADMIN", "users.create" as Permission));
    assert.ok(hasPermission("ADMIN", "users.update" as Permission));
    assert.ok(hasPermission("ADMIN", "users.assign_role" as Permission));
    for (const role of ["PRINCIPAL", "HOD", "EVENT_COORDINATOR", "FACULTY", "STUDENT"]) {
      assert.ok(!hasPermission(role as Role, "users.create" as Permission));
    }
  });

  test("Only ADMIN can complete events (HOD is approver/monitor only)", () => {
    assert.ok(hasPermission("ADMIN", "events.complete" as Permission));
    for (const role of ["PRINCIPAL", "HOD", "EVENT_COORDINATOR", "FACULTY", "STUDENT"]) {
      assert.ok(!hasPermission(role as Role, "events.complete" as Permission));
    }
  });

  test("Only ADMIN/EVENT_COORDINATOR can schedule and conduct", () => {
    for (const perm of ["events.schedule", "events.conduct"] as const) {
      assert.ok(hasPermission("ADMIN", perm as Permission));
      assert.ok(hasPermission("EVENT_COORDINATOR", perm as Permission));
      for (const role of ["PRINCIPAL", "HOD", "FACULTY", "STUDENT"]) {
        assert.ok(!hasPermission(role as Role, perm as Permission));
      }
    }
  });

  test("HOD cannot cancel events", () => {
    assert.ok(!hasPermission("HOD", "events.cancel" as Permission));
    assert.ok(hasPermission("ADMIN", "events.cancel" as Permission));
    assert.ok(hasPermission("EVENT_COORDINATOR", "events.cancel" as Permission));
  });

  test("Faculty can manage attendance but not events", () => {
    assert.ok(hasPermission("FACULTY", "attendance.manage" as Permission));
    assert.ok(hasPermission("FACULTY", "participants.update" as Permission));
    assert.ok(!hasPermission("FACULTY", "events.update" as Permission));
    assert.ok(!hasPermission("FACULTY", "events.create" as Permission));
    assert.ok(!hasPermission("FACULTY", "documents.upload" as Permission));
  });
});
