"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="text-5xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-muted">We could not load this page. Try again, or go back to the home page.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Home</Link>
      </div>
    </div>
  );
}
