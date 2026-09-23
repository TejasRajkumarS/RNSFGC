import { NextRequest, NextResponse } from "next/server";
import { requirePermission, canViewEventDetails } from "@/lib/auth/guards";
import { requireEvent } from "@/lib/services/events";
import { listEventRegistrations, registerForEvent } from "@/lib/services/registrations";
import { ok, handleApiError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("participants.view");
    const { id } = await params;
    const event = await requireEvent(id);

    if (!canViewEventDetails(user, event)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this event" } },
        { status: 403 }
      );
    }

    const registrations = await listEventRegistrations(id);
    return ok(registrations);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("participants.register");
    const { id } = await params;
    const registration = await registerForEvent(user, id);
    return ok(registration, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
