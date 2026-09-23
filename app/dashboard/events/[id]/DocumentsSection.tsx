"use client";

import { useState, useEffect, useCallback } from "react";
import { hasPermission } from "@/lib/auth/permissions";
import { type SessionUser } from "@/lib/auth/types";
import { type DocumentMeta } from "@/lib/services/documents";

interface DocumentsSectionProps {
  user: SessionUser;
  eventId: string;
}

export default function DocumentsSection({ user, eventId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("GENERAL");

  const canUpload = hasPermission(user.role, "documents.upload");
  const canDelete = hasPermission(user.role, "documents.delete");

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/documents`);
      const data = await res.json();
      if (data.success) setDocuments(data.data);
      else setError(data.error?.message || "Failed to load documents");
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const run = () => void fetchDocuments();
    run();
  }, [fetchDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      const res = await fetch(`/api/events/${eventId}/documents`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFile(null);
        setCategory("GENERAL");
        fetchDocuments();
      } else {
        setError(data.error?.message || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchDocuments();
      else setError(data.error?.message || "Delete failed");
    } catch {
      setError("Delete failed");
    }
  };

  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-navy-950">Documents</h3>
      <p className="text-sm text-navy-950/60 mt-1">Reports, brochures, and supporting files</p>

      {error && <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      {canUpload && (
        <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-navy-950 mb-1">File (max 10MB) *</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-navy-950/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold text-navy-950"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-navy-950 mb-1">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-navy-950/20 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-navy-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : documents.length === 0 ? (
        <p className="mt-4 text-sm text-navy-950/50">No documents uploaded.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-950/10 px-3 py-2"
            >
              <div className="min-w-0">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-navy-950 underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-dark"
                >
                  {doc.name}
                </a>
                <p className="text-xs text-navy-950/50">
                  {doc.category} · {(doc.size / 1024).toFixed(0)} KB ·{" "}
                  {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ""}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
