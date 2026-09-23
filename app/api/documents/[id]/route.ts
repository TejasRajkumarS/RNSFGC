import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { deleteDocument } from "@/lib/services/documents";
import { ok, handleApiError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await requirePermission("documents.delete");
    const { id } = await params;
    await deleteDocument(user, id);
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
