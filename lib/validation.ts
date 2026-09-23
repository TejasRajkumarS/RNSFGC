import { z } from "zod";
// Relative imports with explicit .ts extensions: this module is imported by
// node --test, which requires fully-specified ESM paths (no @/ alias support).
import {
  EVENT_CATEGORIES,
  EVENT_STATUS,
  EVENT_TRANSITIONS,
  type EventCategory,
  type EventStatus,
  type EventWorkflowTransition,
} from "../lib/workflows/events.ts";
import { ROLES, type Role } from "./auth/types.ts";
import { AuthError } from "./auth/errors.ts";

const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date format" })
  .transform((v) => new Date(v));

const nonEmptyString = z.string().trim().min(1, { message: "This field is required" });

const EVENT_CATEGORY_ENUM = z.enum(EVENT_CATEGORIES as [EventCategory, ...EventCategory[]], {
  message: "Invalid category",
});
const ROLE_ENUM = z.enum(ROLES as [Role, ...Role[]], { message: "Invalid role" });
const TRANSITION_ENUM = z.enum(
  Object.keys(EVENT_TRANSITIONS) as [EventWorkflowTransition, ...EventWorkflowTransition[]],
  { message: "Invalid action" }
);

export const eventCreateSchema = z.object({
  title: nonEmptyString,
  description: nonEmptyString,
  category: EVENT_CATEGORY_ENUM,
  department_id: nonEmptyString,
  venue: z.string().trim().optional(),
  scheduled_at: dateString.optional(),
  chief_guest: z.string().trim().optional(),
  expected_participants: z.number().int().positive().optional(),
  participant_limit: z.number().int().positive().optional(),
});

export const eventUpdateSchema = eventCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export const transitionSchema = z.object({
  action: TRANSITION_ENUM,
});

export const eventStatusSchema = z.enum(Object.keys(EVENT_STATUS) as [EventStatus, ...EventStatus[]], {
  message: "Invalid status",
});

export const sessionSchema = z.object({
  idToken: z.string().min(1, { message: "idToken is required" }),
});

export const studentSignupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  full_name: nonEmptyString,
});

export const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  full_name: nonEmptyString,
  role: ROLE_ENUM,
  department_id: z.string().trim().nullable().optional(),
});

export const userUpdateSchema = z
  .object({
    full_name: z.string().trim().min(1).optional(),
    role: ROLE_ENUM.optional(),
    department_id: z.string().trim().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export const departmentCreateSchema = z.object({
  name: nonEmptyString,
});

export const attendanceMarkSchema = z.object({
  registration_id: nonEmptyString,
  status: z.enum(["PRESENT", "ABSENT", "LATE"], { message: "Invalid attendance status" }),
});

export const expenseCreateSchema = z.object({
  title: nonEmptyString,
  category: nonEmptyString,
  amount: z.number().nonnegative({ message: "Amount must be non-negative" }),
  notes: z.string().trim().optional(),
});

export const expenseUpdateSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    amount: z.number().nonnegative().optional(),
    notes: z.string().trim().optional(),
    status: z.enum(["PENDING", "APPROVED", "REIMBURSED"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export const reportSubmitSchema = z.object({
  summary: nonEmptyString,
  outcomes: nonEmptyString,
  actual_participants: z.number().int().nonnegative().optional(),
  highlights: z.string().trim().optional(),
});

export const documentCreateSchema = z.object({
  name: nonEmptyString,
  category: nonEmptyString,
  url: z.string().url({ message: "Invalid URL" }),
});

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    throw new AuthError(400, "VALIDATION_ERROR", `${path}${issue.message}`);
  }
  return result.data;
}
