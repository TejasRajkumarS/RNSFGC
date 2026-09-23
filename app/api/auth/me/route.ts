import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { ok, handleApiError } from "@/lib/api";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    return ok(user);
  } catch (e) {
    return handleApiError(e);
  }
}
