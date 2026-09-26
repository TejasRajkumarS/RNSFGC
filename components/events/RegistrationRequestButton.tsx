"use client";

import { useState } from "react";

interface RegistrationRequestButtonProps {
  eventId: string;
  eventTitle: string;
}

export default function RegistrationRequestButton({ eventId, eventTitle }: RegistrationRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/registration-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, full_name: fullName, email, message: message || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setOpen(false);
      } else {
        setError(data.error?.message || "Failed to send request");
      }
    } catch {
      setError("Failed to send request — please try again");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <p
        role="status"
        className="rounded-md border border-green-200 bg-green-50 px-6 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-green-700"
      >
        Request Sent
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-md bg-gold px-6 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-navy-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        Send Request
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 md:w-80" aria-label={`Register for ${eventTitle}`}>
      <div>
        <label htmlFor={`rr-name-${eventId}`} className="mb-1 block text-sm font-medium text-navy-950">
          Full Name *
        </label>
        <input
          id={`rr-name-${eventId}`}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
        />
      </div>
      <div>
        <label htmlFor={`rr-email-${eventId}`} className="mb-1 block text-sm font-medium text-navy-950">
          Email *
        </label>
        <input
          id={`rr-email-${eventId}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
        />
      </div>
      <div>
        <label htmlFor={`rr-message-${eventId}`} className="mb-1 block text-sm font-medium text-navy-950">
          Message
        </label>
        <textarea
          id={`rr-message-${eventId}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border border-navy-950/20 px-4 py-2.5"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-gold px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {busy ? "Sending…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy-950/60 hover:text-navy-950"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
