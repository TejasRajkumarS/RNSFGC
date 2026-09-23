import { NextRequest, NextResponse } from "next/server";
import { requirePermission, canManageEvent } from "@/lib/auth/guards";
import { getEvent, updateEvent, deleteEvent } from "@/lib/services/events";
import { ok, handleApiError, ERROR_CODES } from "@/lib/api";
import { eventUpdateSchema, parseBody } from "@/lib/validation";
import { type EventInput } from "@/lib/workflows/events";

// Mirrors listEventsForUser: students/faculty only see publicly visible statuses
const PUBLIC_DETAIL_STATUSES = new Set(["APPROVED", "SCHEDULED", "CONDUCTED", "COMPLETED", "REPORT_SUBMITTED"]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("events.view");
    const { id } = await params;
    const event = await getEvent(id);
    if (!event)
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: "Event not found" } },
        { status: 404 }
      );
    if (["STUDENT", "FACULTY"].includes(user.role) && !PUBLIC_DETAIL_STATUSES.has(event.status)) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: "Event not found" } },
        { status: 404 }
      );
    }
    return ok(event);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("events.update");
    const { id } = await params;
    const body = await req.json();
    const event = await getEvent(id);
    if (!event)
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: "Event not found" } },
        { status: 404 }
      );

    if (!canManageEvent(user, event)) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.FORBIDDEN, message: "Not authorized for this event" } },
        { status: 403 }
      );
    }

    const updates = parseBody(eventUpdateSchema, body) as Partial<EventInput>;
    const updated = await updateEvent(user, id, updates);
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await requirePermission("events.delete");
    const { id } = await params;
    await deleteEvent(user, id);
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
