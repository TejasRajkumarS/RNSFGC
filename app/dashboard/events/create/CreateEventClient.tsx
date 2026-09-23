"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EVENT_CATEGORIES } from "@/lib/workflows/events";

export default function CreateEventClient() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "WORKSHOP",
    department_id: "",
    venue: "",
    scheduled_at: "",
    chief_guest: "",
    expected_participants: "",
    participant_limit: "",
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/departments");
        const data = await res.json();
        if (data.success) setDepartments(data.data);
        else setError(data.error?.message || "Failed to load departments");
      } catch {
        // ignore
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          expected_participants: formData.expected_participants ? parseInt(formData.expected_participants) : undefined,
          participant_limit: formData.participant_limit ? parseInt(formData.participant_limit) : undefined,
          scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/events/${data.data.id}`);
      } else {
        setError(data.error?.message || "Failed to create event");
      }
    } catch {
      setError("Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-950">Create Event</h2>
        <p className="text-sm text-navy-950/60">New events start as drafts — submit them for approval when ready</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
        <div>
          <label htmlFor="evt-title" className="block text-sm font-medium text-navy-950 mb-1">
            Title *
          </label>
          <input
            id="evt-title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
          />
        </div>
        <div>
          <label htmlFor="evt-description" className="block text-sm font-medium text-navy-950 mb-1">
            Description *
          </label>
          <textarea
            id="evt-description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="evt-category" className="block text-sm font-medium text-navy-950 mb-1">
              Category *
            </label>
            <select
              id="evt-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="evt-department" className="block text-sm font-medium text-navy-950 mb-1">
              Department *
            </label>
            <select
              id="evt-department"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              required
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="evt-venue" className="block text-sm font-medium text-navy-950 mb-1">
              Venue
            </label>
            <input
              id="evt-venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            />
          </div>
          <div>
            <label htmlFor="evt-scheduled-at" className="block text-sm font-medium text-navy-950 mb-1">
              Scheduled At
            </label>
            <input
              id="evt-scheduled-at"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="evt-chief-guest" className="block text-sm font-medium text-navy-950 mb-1">
              Chief Guest
            </label>
            <input
              id="evt-chief-guest"
              value={formData.chief_guest}
              onChange={(e) => setFormData({ ...formData, chief_guest: e.target.value })}
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            />
          </div>
          <div>
            <label htmlFor="evt-expected" className="block text-sm font-medium text-navy-950 mb-1">
              Expected Participants
            </label>
            <input
              id="evt-expected"
              type="number"
              min="1"
              value={formData.expected_participants}
              onChange={(e) => setFormData({ ...formData, expected_participants: e.target.value })}
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            />
          </div>
          <div>
            <label htmlFor="evt-limit" className="block text-sm font-medium text-navy-950 mb-1">
              Participant Limit
            </label>
            <input
              id="evt-limit"
              type="number"
              min="1"
              value={formData.participant_limit}
              onChange={(e) => setFormData({ ...formData, participant_limit: e.target.value })}
              className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/dashboard/events"
            className="rounded-md border border-navy-950/20 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-navy-950 hover:bg-navy-950/5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-navy-950 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
