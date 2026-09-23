"use client";

import { useState, useEffect, useCallback } from "react";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type EventStatus } from "@/lib/workflows/events";
import { type Certificate } from "@/lib/services/certificates";

interface CertificatesSectionProps {
  user: SessionUser;
  eventId: string;
  eventStatus: EventStatus;
}

export default function CertificatesSection({ user, eventId, eventStatus }: CertificatesSectionProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const canGenerate = hasPermission(user.role, "certificates.generate");

  const fetchCertificates = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/certificates`);
      const data = await res.json();
      if (data.success) setCertificates(data.data);
      else setError(data.error?.message || "Failed to load certificates");
    } catch {
      setError("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const run = () => void fetchCertificates();
    run();
  }, [fetchCertificates]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/events/${eventId}/certificates`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `Generated ${data.data.generated} certificate${data.data.generated === 1 ? "" : "s"}${data.data.skipped > 0 ? ` (${data.data.skipped} already issued)` : ""}`
        );
        fetchCertificates();
      } else {
        setError(data.error?.message || "Failed to generate certificates");
      }
    } catch {
      setError("Failed to generate certificates");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-navy-950">Certificates</h3>
      <p className="text-sm text-navy-950/60 mt-1">Issued to registered participants</p>

      {error && <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
      {message && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">{message}</div>
      )}

      {canGenerate && eventStatus === "COMPLETED" && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-4 rounded-md bg-navy-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-navy-800 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate Certificates"}
        </button>
      )}
      {canGenerate && eventStatus !== "COMPLETED" && (
        <p className="mt-4 text-xs text-navy-950/40">Certificates can be generated once the event is completed.</p>
      )}

      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : certificates.length === 0 ? (
        <p className="mt-4 text-sm text-navy-950/50">No certificates issued.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {certificates.map((cert) => (
            <li
              key={cert.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-navy-950/10 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-mono text-navy-950/80">{cert.serial}</p>
                <p className="text-xs text-navy-950/50">{cert.user_uid.slice(0, 14)}…</p>
              </div>
              <span className="text-xs text-navy-950/50">
                {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
