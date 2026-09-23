import { NextRequest, NextResponse } from "next/server";
import { requirePermission, canViewEventDetails } from "@/lib/auth/guards";
import { requireEvent } from "@/lib/services/events";
import { listEventDocuments, uploadEventDocument } from "@/lib/services/documents";
import { ok, handleApiError, ERROR_CODES } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("documents.view");
    const { id } = await params;
    const event = await requireEvent(id);
    if (!canViewEventDetails(user, event)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this event" } },
        { status: 403 }
      );
    }
    const documents = await listEventDocuments(id);
    return ok(documents);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("documents.upload");
    const { id } = await params;

    const formData = await req.formData();
    const file = formData.get("file");
    const category = formData.get("category");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: "File is required" } },
        { status: 400 }
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: "File must be 10MB or smaller" } },
        { status: 400 }
      );
    }
    const categoryStr = typeof category === "string" && category.trim() ? category.trim() : "GENERAL";

    const buffer = Buffer.from(await file.arrayBuffer());
    const document = await uploadEventDocument(
      user,
      id,
      {
        buffer,
        originalName: file.name,
        contentType: file.type || "application/octet-stream",
      },
      categoryStr
    );
    return ok(document, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
