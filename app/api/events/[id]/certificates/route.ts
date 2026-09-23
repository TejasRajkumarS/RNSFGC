import { NextRequest, NextResponse } from "next/server";
import { requirePermission, canViewEventDetails } from "@/lib/auth/guards";
import { requireEvent } from "@/lib/services/events";
import { listEventCertificates, generateCertificates } from "@/lib/services/certificates";
import { ok, handleApiError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("certificates.view");
    const { id } = await params;
    const event = await requireEvent(id);
    if (!canViewEventDetails(user, event)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this event" } },
        { status: 403 }
      );
    }
    const certificates = await listEventCertificates(id);
    return ok(certificates);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("certificates.generate");
    const { id } = await params;
    const result = await generateCertificates(user, id);
    return ok(result, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
