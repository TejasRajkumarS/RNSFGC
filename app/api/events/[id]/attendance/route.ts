import { NextRequest, NextResponse } from "next/server";
import { requirePermission, canViewEventDetails, canManageAttendance } from "@/lib/auth/guards";
import { requireEvent } from "@/lib/services/events";
import { listEventAttendance, markAttendance, type AttendanceStatus } from "@/lib/services/attendance";
import { ok, handleApiError } from "@/lib/api";
import { attendanceMarkSchema, parseBody } from "@/lib/validation";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("attendance.view");
    const { id } = await params;
    const event = await requireEvent(id);
    // Faculty may manage attendance without holding event-detail view rights
    if (!canViewEventDetails(user, event) && !canManageAttendance(user, event)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this event" } },
        { status: 403 }
      );
    }
    const attendance = await listEventAttendance(id);
    return ok(attendance);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("attendance.manage");
    const { id } = await params;
    const body = await req.json();
    const input = parseBody(attendanceMarkSchema, body);
    const record = await markAttendance(user, id, input.registration_id, input.status as AttendanceStatus);
    return ok(record, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
