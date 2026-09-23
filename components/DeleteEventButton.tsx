"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteEventButtonProps {
  eventId: string;
  className?: string;
}

export default function DeleteEventButton({ eventId, className }: DeleteEventButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Remove this event permanently? Its registrations, attendance, documents, expenses, reports, and certificates will also be removed."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error?.message || "Failed to remove event");
      }
    } catch {
      alert("Failed to remove event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      aria-label="Remove event"
      title="Remove this event"
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
      }
    >
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
