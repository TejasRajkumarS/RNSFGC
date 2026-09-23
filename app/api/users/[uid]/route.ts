import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { getUserProfile, updateUser, deleteUser } from "@/lib/services/users";
import { ok, handleApiError, ERROR_CODES } from "@/lib/api";
import { userUpdateSchema, parseBody } from "@/lib/validation";
import { type Role } from "@/lib/auth/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }): Promise<NextResponse> {
  try {
    await requirePermission("users.view");
    const { uid } = await params;
    const user = await getUserProfile(uid);
    if (!user)
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: "User not found" } },
        { status: 404 }
      );
    return ok(user);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ uid: string }> }): Promise<NextResponse> {
  try {
    const actor = await requirePermission("users.update");
    const { uid } = await params;
    const body = await req.json();
    const updates = parseBody(userUpdateSchema, body);

    await updateUser(actor, uid, { ...updates, role: updates.role as Role | undefined });
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }): Promise<NextResponse> {
  try {
    const actor = await requirePermission("users.delete");
    const { uid } = await params;
    await deleteUser(actor, uid);
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
