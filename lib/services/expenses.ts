import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { AuthError, canManageEvent } from "@/lib/auth/guards";
import { type SessionUser } from "@/lib/auth/types";
import { requireEvent } from "@/lib/services/events";
import { writeAuditLog } from "@/lib/audit";
import { serializeTimestamps } from "@/lib/serialize";

export type ExpenseStatus = "PENDING" | "APPROVED" | "REIMBURSED";

// Forward-only lifecycle — no backwards moves, no re-opening reimbursed expenses
const EXPENSE_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  PENDING: ["APPROVED"],
  APPROVED: ["REIMBURSED"],
  REIMBURSED: [],
};

export interface Expense {
  id: string;
  event_id: string;
  title: string;
  category: string;
  amount: number;
  notes: string | null;
  status: ExpenseStatus;
  created_by: string;
  created_at: Date | null;
  updated_at: Date | null;
}

const EXPENSE_DATE_FIELDS = ["created_at", "updated_at"] as const;

function serializeExpense<T extends { created_at: unknown; updated_at: unknown }>(expense: T): T {
  return serializeTimestamps(expense, EXPENSE_DATE_FIELDS);
}

export async function listEventExpenses(eventId: string): Promise<Expense[]> {
  // Equality-only query — no composite index required
  const snap = await getAdminDb().collection("expenses").where("event_id", "==", eventId).get();
  return snap.docs.map((d) => serializeExpense({ id: d.id, ...d.data() } as Expense));
}

export async function createExpense(
  user: SessionUser,
  eventId: string,
  input: { title: string; category: string; amount: number; notes?: string }
): Promise<Expense> {
  const event = await requireEvent(eventId);
  if (!canManageEvent(user, event)) {
    throw new AuthError(403, "FORBIDDEN", "Not authorized to add expenses for this event");
  }

  const now = new Date();
  const data = {
    event_id: eventId,
    title: input.title,
    category: input.category,
    amount: input.amount,
    notes: input.notes ?? null,
    status: "PENDING" as ExpenseStatus,
    created_by: user.uid,
    created_at: now,
    updated_at: now,
  };
  const ref = await getAdminDb().collection("expenses").add(data);
  await writeAuditLog(user.uid, user.role, "expense.create", "expenses", ref.id, "success", {
    event_id: eventId,
    amount: input.amount,
  });
  return serializeExpense({ id: ref.id, ...data });
}

export async function updateExpense(
  user: SessionUser,
  expenseId: string,
  updates: { title?: string; category?: string; amount?: number; notes?: string; status?: ExpenseStatus }
): Promise<Expense> {
  const db = getAdminDb();
  const ref = db.collection("expenses").doc(expenseId);

  // Transactional read-modify-write so concurrent edits/approvals can't clobber each other
  const { expense, updateData } = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new AuthError(404, "NOT_FOUND", "Expense not found");
    const expense = { id: doc.id, ...doc.data() } as Expense;

    const event = await requireEvent(expense.event_id);
    if (!canManageEvent(user, event)) {
      throw new AuthError(403, "FORBIDDEN", "Not authorized to update expenses for this event");
    }

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;

    const fieldEdits = Object.keys(updateData).filter((k) => k !== "status");
    if (fieldEdits.length > 0 && expense.status !== "PENDING") {
      throw new AuthError(409, "WORKFLOW_CONFLICT", "Only pending expenses can be edited");
    }
    if (updates.status !== undefined) {
      if (!EXPENSE_TRANSITIONS[expense.status].includes(updates.status)) {
        throw new AuthError(
          409,
          "WORKFLOW_CONFLICT",
          `Cannot move expense from ${expense.status} to ${updates.status}`
        );
      }
      // The person who logged an expense must not approve/reimburse it themselves
      if (expense.created_by === user.uid && user.role !== "ADMIN") {
        throw new AuthError(403, "SELF_ACTION_FORBIDDEN", "You cannot approve or reimburse your own expense");
      }
    }

    if (Object.keys(updateData).length === 0) return { expense, updateData };
    updateData.updated_at = new Date();
    tx.update(ref, updateData);
    return { expense, updateData };
  });

  if (Object.keys(updateData).length === 0) return expense;
  await writeAuditLog(user.uid, user.role, "expense.update", "expenses", expenseId, "success", {
    event_id: expense.event_id,
    fields: Object.keys(updateData),
  });
  return serializeExpense({ ...expense, ...updateData } as Expense);
}
