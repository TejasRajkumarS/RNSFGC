import { NextRequest, NextResponse } from "next/server";
import { signupStudent } from "@/lib/services/users";
import { ok, errorResponse, handleApiError } from "@/lib/api";
import { studentSignupSchema, parseBody } from "@/lib/validation";
import { allowRateLimited, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Unauthenticated and cost-bearing (creates an Auth user) — cap per-IP signups
    // (30/hour tolerates a computer-lab class sharing one NAT address)
    if (!allowRateLimited(clientKey(req, "signup"), 30, 60 * 60 * 1000)) {
      return errorResponse(429, "RATE_LIMITED", "Too many sign-up attempts — try again later");
    }
    const body = await req.json();
    const input = parseBody(studentSignupSchema, body);
    const uid = await signupStudent(input.email, input.password, input.full_name);
    return ok({ uid }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
