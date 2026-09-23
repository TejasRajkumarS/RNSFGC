import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { listMyRegistrations } from "@/lib/services/registrations";
import { ok, handleApiError } from "@/lib/api";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const registrations = await listMyRegistrations(user);
    return ok(registrations);
  } catch (e) {
    return handleApiError(e);
  }
}
