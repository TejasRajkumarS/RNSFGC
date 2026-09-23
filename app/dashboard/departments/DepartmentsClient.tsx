"use client";

import { useState, useEffect, useCallback } from "react";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser, type Department } from "@/lib/auth/types";

interface DepartmentsClientProps {
  user: SessionUser;
}

export default function DepartmentsClient({ user }: DepartmentsClientProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const canCreate = hasPermission(user.role, "departments.create");

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.success) setDepartments(data.data);
      else setError(data.error?.message || "Failed to load departments");
    } catch {
      setError("Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = () => void fetchDepartments();
    run();
  }, [fetchDepartments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setName("");
        fetchDepartments();
      } else {
        setError(data.error?.message || "Failed to create department");
      }
    } catch {
      setError("Failed to create department");
    } finally {
      setCreating(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-950">Departments</h2>
        <p className="text-sm text-navy-950/60">Academic departments used for event scoping</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {canCreate && (
        <form
          onSubmit={handleCreate}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-950/10 bg-white p-6 shadow-card"
        >
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="dept-name" className="block text-sm font-medium text-navy-950 mb-1">
              New department name *
            </label>
            <input
              id="dept-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-navy-950 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {creating ? "Adding…" : "Add Department"}
          </button>
        </form>
      )}

      <div className="rounded-xl border border-navy-950/10 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-950/5">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                Name
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                ID
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-950/10">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-navy-950/5">
                <td className="px-4 py-3 font-medium text-navy-950">{dept.name}</td>
                <td className="px-4 py-3 text-sm font-mono text-navy-950/60">{dept.id}</td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-navy-950/60">
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
