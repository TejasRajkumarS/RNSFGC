"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function StudentSignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already signed in with a valid session, go straight to the dashboard
    const checkExistingSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          router.replace("/dashboard");
        }
      } catch {
        // network error — allow signup attempt normally
      }
    };
    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error?.message ?? "Signup failed");
      }

      // Auto sign-in with the credentials just created
      const auth = getFirebaseAuth();
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await user.getIdToken();
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionRes.ok) throw new Error("Session creation failed");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "mt-1.5 block w-full rounded-md border border-navy-950/20 bg-white px-4 py-2.5 text-navy-950 placeholder-navy-950/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20";

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
          <h1 className="mt-6 font-display text-3xl font-semibold text-navy-950">Student Sign Up</h1>
          <p className="mt-2 text-sm text-navy-950/60">Create your student account — RNS First Grade College</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-navy-950">
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClasses}
            />
          </div>
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
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-navy-950">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
            <p className="mt-1 text-xs text-navy-950/50">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-navy-950">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClasses}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-navy-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-950/60">
          Already have an account?{" "}
          <Link href="/student/signin" className="font-medium text-navy-950 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-navy-950/60">
          Staff member?{" "}
          <Link href="/login" className="font-medium text-navy-950 hover:underline">
            Use the main sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function StudentSignupPage() {
  return <StudentSignupForm />;
}
