import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listRegistrationsForManager } from "@/lib/services/registrations";
import { ok, handleApiError } from "@/lib/api";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requirePermission("participants.view");
    const registrations = await listRegistrationsForManager(user);
    return ok(registrations);
  } catch (e) {
    return handleApiError(e);
  }
}
