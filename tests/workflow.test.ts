import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  EVENT_TRANSITIONS,
  EVENT_STATUS,
  STATUS_LABELS,
  ACTION_LABELS,
  getValidTransitions,
} from "../lib/workflows/events.ts";
import { ROLE_PERMISSIONS } from "../lib/auth/permissions.ts";
import { type EventStatus, type EventWorkflowTransition } from "../lib/workflows/events.ts";

const ALL_STATUSES = Object.keys(EVENT_STATUS) as EventStatus[];
const ALL_ACTIONS = Object.keys(EVENT_TRANSITIONS) as EventWorkflowTransition[];

describe("Event workflow state machine", () => {
  test("every transition targets a valid status", () => {
    for (const action of ALL_ACTIONS) {
      assert.ok(EVENT_TRANSITIONS[action].to in EVENT_STATUS, `${action} targets unknown status`);
    }
  });

  test("every transition starts from valid statuses", () => {
    for (const action of ALL_ACTIONS) {
      for (const from of EVENT_TRANSITIONS[action].from) {
        assert.ok(from in EVENT_STATUS, `${action} starts from unknown status ${from}`);
      }
    }
  });

  test("every transition requires a permission", () => {
    for (const action of ALL_ACTIONS) {
      const permission = EVENT_TRANSITIONS[action].permission;
      assert.ok(typeof permission === "string" && permission.length > 0, `${action} has no permission`);
    }
  });

  test("every transition permission exists in at least one role", () => {
    const rolePermissions = new Set<string>(Object.values(ROLE_PERMISSIONS).flat());
    for (const action of ALL_ACTIONS) {
      assert.ok(
        rolePermissions.has(EVENT_TRANSITIONS[action].permission),
        `${action} permission is granted to no role — transition is unreachable`
      );
    }
  });

  test("STATUS_LABELS covers every status", () => {
    for (const status of ALL_STATUSES) {
      assert.ok(status in STATUS_LABELS, `missing label for ${status}`);
    }
  });

  test("ACTION_LABELS covers every transition", () => {
    for (const action of ALL_ACTIONS) {
      assert.ok(action in ACTION_LABELS, `missing label for ${action}`);
    }
  });

  test("happy path: DRAFT to COMPLETED", () => {
    let status: EventStatus = "DRAFT";
    const path: EventStatus[] = ["DRAFT"];
    const actions: EventWorkflowTransition[] = [
      "submit",
      "approve",
      "schedule",
      "conduct",
      "submit_report",
      "complete",
    ];
    for (const action of actions) {
      const rule = EVENT_TRANSITIONS[action];
      assert.ok(rule.from.includes(status), `cannot ${action} from ${status}`);
      status = rule.to;
      path.push(status);
    }
    assert.equal(status, "COMPLETED");
    assert.deepEqual(path, [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "SCHEDULED",
      "CONDUCTED",
      "REPORT_SUBMITTED",
      "COMPLETED",
    ]);
  });

  test("rejected events can be resubmitted", () => {
    assert.ok(EVENT_TRANSITIONS.submit.from.includes("REJECTED"));
  });

  test("cancel is allowed before conducting, never after", () => {
    assert.deepEqual(getValidTransitions("COMPLETED"), []);
    for (const status of ["DRAFT", "SUBMITTED", "APPROVED", "SCHEDULED"] as EventStatus[]) {
      assert.ok(getValidTransitions(status).includes("cancel"), `cancel should be valid from ${status}`);
    }
    assert.ok(!getValidTransitions("CONDUCTED").includes("cancel"));
  });

  test("completed and cancelled are terminal states", () => {
    assert.deepEqual(getValidTransitions("COMPLETED"), []);
    assert.deepEqual(getValidTransitions("CANCELLED"), []);
  });

  test("every non-initial status is reachable via a transition", () => {
    for (const status of ALL_STATUSES) {
      if (status === "DRAFT") continue;
      const entries = ALL_ACTIONS.filter((action) => EVENT_TRANSITIONS[action].to === status);
      assert.ok(entries.length >= 1, `no transition leads to ${status}`);
    }
  });
});
