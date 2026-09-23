"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type Event } from "@/lib/workflows/events";
import { type Certificate } from "@/lib/services/certificates";

interface CertificateWithEvent {
  certificate: Certificate;
  event: Event | null;
}

export default function CertificatesClient() {
  const [items, setItems] = useState<CertificateWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch("/api/certificates/me");
        const data = await res.json();
        if (data.success) setItems(data.data);
        else setError(data.error?.message || "Failed to load certificates");
      } catch {
        setError("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-navy-950">My Certificates</h2>
        <p className="text-sm text-navy-950/60">Certificates issued for events you participated in</p>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {items.length === 0 ? (
        <div className="rounded-xl border border-navy-950/10 bg-white p-12 text-center">
          <p className="text-navy-950/60">
            No certificates yet.{" "}
            <Link href="/dashboard/events" className="text-gold-dark underline">
              Participate in events
            </Link>{" "}
            to earn them.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(({ certificate, event }) => (
            <div key={certificate.id} className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                    Certificate of Participation
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-navy-950">{event?.title ?? "Event"}</h3>
                  <p className="mt-2 text-sm font-mono text-navy-950/60">{certificate.serial}</p>
                  <p className="mt-1 text-sm text-navy-950/60">
                    Issued {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-navy-950">
                  <span className="text-lg text-gold-light">✦</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
