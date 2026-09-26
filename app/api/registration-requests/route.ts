import { NextRequest, NextResponse } from "next/server";
import { allowRateLimited, clientKey } from "@/lib/rate-limit";
import { createRegistrationRequest } from "@/lib/services/registrations";
import { registrationRequestSchema, parseBody } from "@/lib/validation";
import { ok, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Public endpoint (no auth) — rate-limit per IP to prevent abuse
    if (!allowRateLimited(clientKey(req, "reg-request"), 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many requests — try again later" } },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const input = parseBody(registrationRequestSchema, body);
    const result = await createRegistrationRequest(input);
    return ok(result, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
