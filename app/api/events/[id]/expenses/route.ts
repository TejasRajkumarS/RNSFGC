import { NextRequest, NextResponse } from "next/server";
import { requirePermission, canViewEventDetails } from "@/lib/auth/guards";
import { requireEvent } from "@/lib/services/events";
import { listEventExpenses, createExpense } from "@/lib/services/expenses";
import { ok, handleApiError } from "@/lib/api";
import { expenseCreateSchema, parseBody } from "@/lib/validation";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("expenses.view");
    const { id } = await params;
    const event = await requireEvent(id);
    if (!canViewEventDetails(user, event)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this event" } },
        { status: 403 }
      );
    }
    const expenses = await listEventExpenses(id);
    return ok(expenses);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("expenses.create");
    const { id } = await params;
    const body = await req.json();
    const input = parseBody(expenseCreateSchema, body);
    const expense = await createExpense(user, id, input);
    return ok(expense, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
