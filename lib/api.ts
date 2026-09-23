import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/guards";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function okPage<T>(
  items: T[],
  nextCursor: string | null,
  total?: number
): NextResponse<ApiResponse<T[]> & { nextCursor: string | null; total?: number }> {
  return NextResponse.json(
    { success: true, data: items, nextCursor, ...(total !== undefined ? { total } : {}) },
    { status: 200 }
  );
}

export function errorResponse(status: number, code: string, message: string): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// Known Firebase Auth error codes mapped to clean client-facing messages.
// Anything else keeps its details server-side (logged above) and stays generic.
const FIREBASE_AUTH_ERROR_MAP: Record<string, { status: number; code: string; message: string }> = {
  "auth/email-already-exists": { status: 409, code: "CONFLICT", message: "An account with this email already exists" },
  "auth/invalid-email": { status: 400, code: "VALIDATION_ERROR", message: "Invalid email address" },
  "auth/invalid-password": { status: 400, code: "VALIDATION_ERROR", message: "Password must be at least 6 characters" },
  "auth/user-not-found": { status: 404, code: "NOT_FOUND", message: "User not found" },
  "auth/id-token-expired": {
    status: 401,
    code: "UNAUTHENTICATED",
    message: "Your session has expired — sign in again",
  },
  "auth/id-token-revoked": {
    status: 401,
    code: "UNAUTHENTICATED",
    message: "Your session has been revoked — sign in again",
  },
  "auth/argument-error": { status: 401, code: "UNAUTHENTICATED", message: "Invalid authentication token" },
  "auth/too-many-requests": { status: 429, code: "RATE_LIMITED", message: "Too many attempts — try again later" },
};

export function handleApiError(err: unknown): NextResponse<ApiResponse> {
  if (err instanceof AuthError) {
    if (err.status >= 500) console.error("[API]", err.code, err.message);
    return errorResponse(err.status, err.code, err.message);
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return errorResponse(400, "VALIDATION_ERROR", issue?.message ?? "Invalid input");
  }
  if (err instanceof Error) {
    // Log the full error server-side; never leak internals to the client
    console.error("[API]", err.name, err.message, err.stack);
    if (err.name === "FirebaseAuthError") {
      const code = (err as { code?: string }).code ?? "";
      const mapped = FIREBASE_AUTH_ERROR_MAP[code];
      if (mapped) return errorResponse(mapped.status, mapped.code, mapped.message);
      return errorResponse(401, "UNAUTHENTICATED", "Authentication failed");
    }
    // Firestore/Storage and other Firebase failures are server faults, not client input errors
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred");
  }
  console.error("[API] Unknown error", err);
  return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred");
}

export const ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  WORKFLOW_CONFLICT: "WORKFLOW_CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  EVENT_FULL: "EVENT_FULL",
  DUPLICATE_REGISTRATION: "DUPLICATE_REGISTRATION",
  SELF_ACTION_FORBIDDEN: "SELF_ACTION_FORBIDDEN",
} as const;
