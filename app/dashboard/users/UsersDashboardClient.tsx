"use client";

import { useState, useEffect, useCallback } from "react";
import { type SessionUser, type Role, ROLES } from "@/lib/auth/types";
import { type Department } from "@/lib/auth/types";

interface UsersDashboardClientProps {
  user: SessionUser;
}

interface AppUser {
  uid: string;
  email: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  is_active: boolean;
}

export default function UsersDashboardClient({ user }: UsersDashboardClientProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "STUDENT" as Role,
    department_id: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    role: "STUDENT" as Role,
    department_id: "",
    is_active: true,
    full_name: "",
  });
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.data);
      else setError(data.error?.message || "Failed to load users");
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.success) setDepartments(data.data);
      else setError(data.error?.message || "Failed to load departments");
    } catch {
      setError("Failed to load departments");
    }
  }, []);

  useEffect(() => {
    const run = () => {
      void fetchUsers();
      void fetchDepartments();
    };
    run();
  }, [fetchUsers, fetchDepartments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, department_id: formData.department_id || null }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setFormData({ email: "", password: "", full_name: "", role: "STUDENT", department_id: "" });
        fetchUsers();
      } else {
        alert(data.error?.message || "Failed to create user");
      }
    } catch {
      alert("Failed to create user");
    }
  };

  const handleUpdate = async (uid: string) => {
    if (uid === user.uid) {
      alert("Cannot modify your own role/department/status");
      return;
    }
    try {
      const res = await fetch(`/api/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchUsers();
      } else {
        alert(data.error?.message || "Failed to update");
      }
    } catch {
      alert("Failed to update");
    }
  };

  const startEdit = (u: AppUser) => {
    if (u.uid === user.uid) return;
    setEditingId(u.uid);
    setEditData({ role: u.role, department_id: u.department_id || "", is_active: u.is_active, full_name: u.full_name });
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.uid}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeletingUser(null);
        fetchUsers();
      } else {
        alert(data.error?.message || "Failed to delete user");
      }
    } catch {
      alert("Failed to delete user");
    } finally {
      setDeleting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-navy-950">User Management</h2>
          <p className="text-sm text-navy-950/60">Manage users, roles, and departments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-navy-950 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white hover:bg-navy-800"
        >
          Add User
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-navy-950 mb-6">Create User</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="cu-email" className="block text-sm font-medium text-navy-950 mb-1">
                  Email *
                </label>
                <input
                  id="cu-email"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="cu-password" className="block text-sm font-medium text-navy-950 mb-1">
                  Password *
                </label>
                <input
                  id="cu-password"
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="cu-name" className="block text-sm font-medium text-navy-950 mb-1">
                  Full Name *
                </label>
                <input
                  id="cu-name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cu-role" className="block text-sm font-medium text-navy-950 mb-1">
                    Role *
                  </label>
                  <select
                    id="cu-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cu-dept" className="block text-sm font-medium text-navy-950 mb-1">
                    Department
                  </label>
                  <select
                    id="cu-dept"
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-md border border-navy-950/20 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-navy-950 hover:bg-navy-950/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-navy-950 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white hover:bg-navy-800"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-navy-950 mb-4">Remove User</h3>
            <p className="text-sm text-navy-950/70 mb-6">
              Are you sure you want to permanently remove{" "}
              <span className="font-semibold text-navy-950">{deletingUser.full_name}</span> ({deletingUser.email})? This
              deletes their account and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
                className="rounded-md border border-navy-950/20 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-navy-950 hover:bg-navy-950/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-navy-950/10 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-950/5">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                Name
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                Email
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                Role
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                Department
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-navy-950/60">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-950/10">
            {users.map((u) => (
              <tr key={u.uid} className="hover:bg-navy-950/5">
                <td className="px-4 py-3 font-medium text-navy-950">{u.full_name}</td>
                <td className="px-4 py-3 text-sm text-navy-950/60">{u.email}</td>
                <td className="px-4 py-3">
                  {editingId === u.uid ? (
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value as Role })}
                      className="rounded-md border border-navy-950/20 px-2 py-1 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] bg-navy-950/5 text-navy-950">
                      {(u.role ?? "").replace("_", " ")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === u.uid ? (
                    <select
                      value={editData.department_id}
                      onChange={(e) => setEditData({ ...editData, department_id: e.target.value })}
                      className="rounded-md border border-navy-950/20 px-2 py-1 text-sm"
                    >
                      <option value="">None</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-navy-950/60">
                      {departments.find((d) => d.id === u.department_id)?.name || "—"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === u.uid ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.is_active}
                        onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                        className="rounded border-navy-950/20"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  ) : (
                    <span className={u.is_active ? "text-green-600" : "text-red-600"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === u.uid ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(u.uid)}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-navy-950/20 px-3 py-1.5 text-[10px] font-bold text-navy-950 hover:bg-navy-950/5"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(u)} className="text-sm font-semibold text-gold-dark underline">
                        Edit
                      </button>
                      {u.uid !== user.uid && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="text-sm font-semibold text-red-600 underline hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
