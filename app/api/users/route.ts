import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listUsersForAdmin, createUser } from "@/lib/services/users";
import { ok, handleApiError } from "@/lib/api";
import { userCreateSchema, parseBody } from "@/lib/validation";

export async function GET(): Promise<NextResponse> {
  try {
    await requirePermission("users.view");
    const users = await listUsersForAdmin();
    return ok(users);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const actor = await requirePermission("users.create");
    const body = await req.json();
    const input = parseBody(userCreateSchema, body);

    const uid = await createUser(
      actor,
      input.email,
      input.password,
      input.full_name,
      input.role,
      input.department_id ?? null
    );
    return ok({ uid }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
