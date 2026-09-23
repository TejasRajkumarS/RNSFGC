"use client";

import { useState, useEffect, useCallback } from "react";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type Expense, type ExpenseStatus } from "@/lib/services/expenses";

interface ExpensesSectionProps {
  user: SessionUser;
  eventId: string;
}

const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REIMBURSED: "bg-emerald-100 text-emerald-700",
};

export default function ExpensesSection({ user, eventId }: ExpensesSectionProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", category: "", amount: "", notes: "" });

  const canCreate = hasPermission(user.role, "expenses.create");
  const canUpdate = hasPermission(user.role, "expenses.update");

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/expenses`);
      const data = await res.json();
      if (data.success) setExpenses(data.data);
      else setError(data.error?.message || "Failed to load expenses");
    } catch {
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const run = () => void fetchExpenses();
    run();
  }, [fetchExpenses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          amount: parseFloat(formData.amount),
          notes: formData.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ title: "", category: "", amount: "", notes: "" });
        fetchExpenses();
      } else {
        setError(data.error?.message || "Failed to add expense");
      }
    } catch {
      setError("Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (expenseId: string, status: ExpenseStatus) => {
    setError("");
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchExpenses();
      else setError(data.error?.message || "Failed to update expense");
    } catch {
      setError("Failed to update expense");
    }
  };

  const total = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-navy-950">Expenses</h3>
        <span className="text-sm font-semibold text-navy-950">Total: ₹{total.toLocaleString("en-IN")}</span>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      {canCreate && (
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              aria-label="Expense title"
              placeholder="Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="rounded-md border border-navy-950/20 px-3 py-2 text-sm"
            />
            <input
              required
              aria-label="Expense category"
              placeholder="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="rounded-md border border-navy-950/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              aria-label="Amount in rupees"
              placeholder="Amount (₹) *"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="rounded-md border border-navy-950/20 px-3 py-2 text-sm"
            />
            <input
              aria-label="Notes"
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-md border border-navy-950/20 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-navy-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add Expense"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : expenses.length === 0 ? (
        <p className="mt-4 text-sm text-navy-950/50">No expenses recorded.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-950/10 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy-950">{expense.title}</p>
                <p className="text-xs text-navy-950/50">
                  {expense.category} · ₹{(expense.amount ?? 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${EXPENSE_STATUS_COLORS[expense.status]}`}
                >
                  {expense.status}
                </span>
                {canUpdate && expense.status !== "REIMBURSED" && (
                  <select
                    value={expense.status}
                    onChange={(e) => handleStatus(expense.id, e.target.value as ExpenseStatus)}
                    className="rounded border border-navy-950/20 px-2 py-1 text-xs"
                  >
                    {(["PENDING", "APPROVED", "REIMBURSED"] as ExpenseStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
