import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listDepartments, createDepartment } from "@/lib/services/departments";
import { ok, handleApiError } from "@/lib/api";
import { departmentCreateSchema, parseBody } from "@/lib/validation";

export async function GET(): Promise<NextResponse> {
  try {
    await requirePermission("departments.view");
    const departments = await listDepartments();
    return ok(departments);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const actor = await requirePermission("departments.create");
    const body = await req.json();
    const { name } = parseBody(departmentCreateSchema, body);
    const dept = await createDepartment(actor, name);
    return ok(dept, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
