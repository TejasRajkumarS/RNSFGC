import { NextRequest, NextResponse } from "next/server";
import { requirePermission, canViewEventDetails } from "@/lib/auth/guards";
import { requireEvent } from "@/lib/services/events";
import { getEventReport, submitReport } from "@/lib/services/reports";
import { ok, handleApiError } from "@/lib/api";
import { reportSubmitSchema, parseBody } from "@/lib/validation";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("reports.view");
    const { id } = await params;
    const event = await requireEvent(id);
    if (!canViewEventDetails(user, event)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this event" } },
        { status: 403 }
      );
    }
    const report = await getEventReport(id);
    return ok(report);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("reports.create");
    const { id } = await params;
    const body = await req.json();
    const input = parseBody(reportSubmitSchema, body);
    const result = await submitReport(user, id, input);
    return ok(result, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
