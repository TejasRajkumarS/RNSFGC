"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import Link from "next/link";
import Image from "next/image";

function firebaseAuthError(message: string): string {
  if (message.includes("auth/user-not-found")) {
    return "No account exists with this email. Please contact your administrator.";
  }
  if (message.includes("auth/invalid-email")) {
    return "Invalid email address.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts. Please try again later.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Network error. Please check your connection and try again.";
  }
  return "Failed to send the password reset email. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(firebaseAuthError(err instanceof Error ? err.message : "Failed to send reset email"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950/5 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-navy-950/10 bg-white p-8 shadow-card">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/rnslogo.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-md bg-white object-contain p-1"
            />
          </Link>
          <h1 className="mt-6 font-display text-3xl font-semibold text-navy-950">Forgot Password</h1>
          <p className="mt-2 text-sm text-navy-950/60">
            {sent
              ? "Check your email for the reset link"
              : "Enter your email and we will send you a password reset link"}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-5">
            <div
              className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700"
              role="status"
            >
              A password reset link has been sent to <span className="font-semibold">{email}</span>. Open
              the email and follow the link to set your new password. Remember to check your spam folder
              if you do not see it within a few minutes.
            </div>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="w-full text-sm text-navy-950/60 hover:text-navy-950 focus:outline-none"
            >
              Did not receive the email? Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-950">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-md border border-navy-950/20 bg-white px-4 py-2.5 text-navy-950 placeholder-navy-950/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-navy-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending reset link…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-navy-950/60">
          <Link href="/login" className="hover:text-navy-950">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
