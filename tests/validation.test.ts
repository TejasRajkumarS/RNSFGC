import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  eventCreateSchema,
  eventUpdateSchema,
  transitionSchema,
  sessionSchema,
  userCreateSchema,
  userUpdateSchema,
  departmentCreateSchema,
  attendanceMarkSchema,
  expenseCreateSchema,
  expenseUpdateSchema,
  reportSubmitSchema,
  parseBody,
} from "../lib/validation.ts";
import { AuthError } from "../lib/auth/errors.ts";

describe("Event create schema", () => {
  const valid = {
    title: "Tech Fest",
    description: "Annual technical festival",
    category: "WORKSHOP",
    department_id: "cse",
  };

  test("accepts a valid minimal event", () => {
    const result = eventCreateSchema.safeParse(valid);
    assert.ok(result.success);
  });

  test("accepts optional fields with valid date and numbers", () => {
    const result = eventCreateSchema.safeParse({
      ...valid,
      venue: "Auditorium",
      scheduled_at: "2026-10-03T10:00:00Z",
      expected_participants: 100,
      participant_limit: 120,
      chief_guest: "Dr. Rao",
    });
    assert.ok(result.success);
    if (result.success) {
      assert.ok(result.data.scheduled_at instanceof Date);
      assert.ok(!Number.isNaN(result.data.scheduled_at.getTime()));
    }
  });

  test("rejects missing required fields", () => {
    assert.ok(!eventCreateSchema.safeParse({ ...valid, title: "" }).success);
    assert.ok(!eventCreateSchema.safeParse({ ...valid, description: "" }).success);
    assert.ok(!eventCreateSchema.safeParse({ ...valid, department_id: "" }).success);
    assert.ok(!eventCreateSchema.safeParse({ title: "x" }).success);
  });

  test("rejects invalid category", () => {
    assert.ok(!eventCreateSchema.safeParse({ ...valid, category: "PARTY" }).success);
  });

  test("rejects invalid date format", () => {
    assert.ok(!eventCreateSchema.safeParse({ ...valid, scheduled_at: "not-a-date" }).success);
  });

  test("rejects negative or non-integer counts", () => {
    assert.ok(!eventCreateSchema.safeParse({ ...valid, expected_participants: -1 }).success);
    assert.ok(!eventCreateSchema.safeParse({ ...valid, participant_limit: 1.5 }).success);
  });

  test("trims whitespace in required strings", () => {
    const result = eventCreateSchema.safeParse({ ...valid, title: "  Tech Fest  " });
    if (result.success) assert.equal(result.data.title, "Tech Fest");
    else assert.fail("should pass");
  });
});

describe("Event update schema", () => {
  test("accepts partial updates", () => {
    assert.ok(eventUpdateSchema.safeParse({ title: "New title" }).success);
    assert.ok(eventUpdateSchema.safeParse({ venue: "Hall A" }).success);
  });

  test("rejects empty object", () => {
    assert.ok(!eventUpdateSchema.safeParse({}).success);
  });
});

describe("Transition schema", () => {
  test("accepts valid workflow actions", () => {
    for (const action of [
      "submit",
      "approve",
      "reject",
      "schedule",
      "conduct",
      "submit_report",
      "complete",
      "cancel",
    ]) {
      assert.ok(transitionSchema.safeParse({ action }).success);
    }
  });

  test("rejects invalid action", () => {
    assert.ok(!transitionSchema.safeParse({ action: "explode" }).success);
    assert.ok(!transitionSchema.safeParse({}).success);
  });
});

describe("Session schema", () => {
  test("requires non-empty idToken", () => {
    assert.ok(sessionSchema.safeParse({ idToken: "abc" }).success);
    assert.ok(!sessionSchema.safeParse({ idToken: "" }).success);
    assert.ok(!sessionSchema.safeParse({}).success);
  });
});

describe("User schemas", () => {
  test("userCreateSchema validates email, password, role", () => {
    assert.ok(
      userCreateSchema.safeParse({
        email: "user@rnsfc.edu",
        password: "password123",
        full_name: "Test User",
        role: "STUDENT",
      }).success
    );
    assert.ok(
      !userCreateSchema.safeParse({
        email: "not-an-email",
        password: "password123",
        full_name: "Test User",
        role: "STUDENT",
      }).success
    );
    assert.ok(
      !userCreateSchema.safeParse({
        email: "user@rnsfc.edu",
        password: "short",
        full_name: "Test User",
        role: "STUDENT",
      }).success
    );
    assert.ok(
      !userCreateSchema.safeParse({
        email: "user@rnsfc.edu",
        password: "password123",
        full_name: "Test User",
        role: "SUPERUSER",
      }).success
    );
  });

  test("userUpdateSchema rejects empty object and invalid role", () => {
    assert.ok(!userUpdateSchema.safeParse({}).success);
    assert.ok(!userUpdateSchema.safeParse({ role: "SUPERUSER" }).success);
    assert.ok(userUpdateSchema.safeParse({ is_active: false }).success);
    assert.ok(userUpdateSchema.safeParse({ department_id: null }).success);
  });
});

describe("Department schema", () => {
  test("requires non-empty name", () => {
    assert.ok(departmentCreateSchema.safeParse({ name: "Computer Science" }).success);
    assert.ok(!departmentCreateSchema.safeParse({ name: "" }).success);
  });
});

describe("Attendance schema", () => {
  test("validates status enum and required registration_id", () => {
    for (const status of ["PRESENT", "ABSENT", "LATE"]) {
      assert.ok(attendanceMarkSchema.safeParse({ registration_id: "reg1", status }).success);
    }
    assert.ok(!attendanceMarkSchema.safeParse({ registration_id: "reg1", status: "MAYBE" }).success);
    assert.ok(!attendanceMarkSchema.safeParse({ status: "PRESENT" }).success);
  });
});

describe("Expense schemas", () => {
  test("create validates amount and required fields", () => {
    assert.ok(expenseCreateSchema.safeParse({ title: "Banner", category: "Printing", amount: 500 }).success);
    assert.ok(!expenseCreateSchema.safeParse({ title: "Banner", category: "Printing", amount: -5 }).success);
    assert.ok(!expenseCreateSchema.safeParse({ title: "", category: "Printing", amount: 100 }).success);
  });

  test("update validates status transitions and rejects empty", () => {
    assert.ok(expenseUpdateSchema.safeParse({ status: "APPROVED" }).success);
    assert.ok(!expenseUpdateSchema.safeParse({ status: "PAID" }).success);
    assert.ok(!expenseUpdateSchema.safeParse({}).success);
  });
});

describe("Report schema", () => {
  test("validates required summary and outcomes", () => {
    assert.ok(reportSubmitSchema.safeParse({ summary: "Great event", outcomes: "200 attendees" }).success);
    assert.ok(
      reportSubmitSchema.safeParse({
        summary: "Great event",
        outcomes: "200 attendees",
        actual_participants: 200,
        highlights: "Keynote was excellent",
      }).success
    );
    assert.ok(!reportSubmitSchema.safeParse({ summary: "", outcomes: "x" }).success);
    assert.ok(!reportSubmitSchema.safeParse({ summary: "x", outcomes: "" }).success);
    assert.ok(!reportSubmitSchema.safeParse({ summary: "x", outcomes: "y", actual_participants: -3 }).success);
  });
});

describe("parseBody", () => {
  test("returns parsed data on success", () => {
    const data = parseBody(transitionSchema, { action: "approve" });
    assert.equal(data.action, "approve");
  });

  test("throws AuthError with VALIDATION_ERROR code on failure", () => {
    try {
      parseBody(transitionSchema, { action: "nope" });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err instanceof AuthError);
      const authError = err as AuthError;
      assert.equal(authError.status, 400);
      assert.equal(authError.code, "VALIDATION_ERROR");
      assert.ok(authError.message.includes("action"));
    }
  });
});
