import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { exportEventParticipantsCsv } from "@/lib/services/reports";
import { handleApiError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("reports.export");
    const { id } = await params;
    const csv = await exportEventParticipantsCsv(user, id);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="event-${id}-participants.csv"`,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
