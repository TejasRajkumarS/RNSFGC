"use client";

import { Suspense, useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check whether the existing session is actually valid (not just present).
    // Invalid/expired cookies are cleared so the user can sign in again —
    // this must happen here instead of a proxy redirect, which would loop.
    const checkExistingSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          router.replace(next);
          return;
        }
        await fetch("/api/auth/session", { method: "DELETE" });
      } catch {
        // network error — let the user attempt login normally
      }
    };
    checkExistingSession();
  }, [router, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Session creation failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <h1 className="mt-6 font-display text-3xl font-semibold text-navy-950">Sign In</h1>
          <p className="mt-2 text-sm text-navy-950/60">RNS First Grade College — Event Management</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

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
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-navy-950">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-navy-950/20 bg-white px-4 py-2.5 text-navy-950 placeholder-navy-950/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-navy-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-navy-950/60 hover:text-navy-950 hover:underline">
            Forgot password?
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-navy-950/60">
          Student?{" "}
          <Link href="/student/signin" className="font-medium text-navy-950 hover:underline">
            Sign in here
          </Link>{" "}
          or{" "}
          <Link href="/student/signup" className="font-medium text-navy-950 hover:underline">
            create an account
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
