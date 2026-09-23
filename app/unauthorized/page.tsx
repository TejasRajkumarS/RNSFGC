import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950/5 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-navy-950/10 bg-white p-8 shadow-card text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-navy-950">Access Denied</h1>
        <p className="mt-3 text-sm text-navy-950/60">You do not have permission to access this page.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-md bg-navy-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-navy-800"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-md border border-navy-950/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-navy-950 transition-colors hover:bg-navy-950/5"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
