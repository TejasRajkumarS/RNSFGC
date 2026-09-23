import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { cancelRegistration } from "@/lib/services/registrations";
import { ok, handleApiError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await params;
    await cancelRegistration(user, id);
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
