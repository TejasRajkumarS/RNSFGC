import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { updateExpense, type ExpenseStatus } from "@/lib/services/expenses";
import { ok, handleApiError } from "@/lib/api";
import { expenseUpdateSchema, parseBody } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requirePermission("expenses.update");
    const { id } = await params;
    const body = await req.json();
    const updates = parseBody(expenseUpdateSchema, body);
    const expense = await updateExpense(user, id, { ...updates, status: updates.status as ExpenseStatus | undefined });
    return ok(expense);
  } catch (e) {
    return handleApiError(e);
  }
}
