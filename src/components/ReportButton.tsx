"use client";

import { useActionState } from "react";
import { reportListing } from "@/lib/actions";

export function ReportButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reportListing, undefined);
  if (state?.fieldErrors?.done) return <p className="text-sm text-muted">Thanks, we will look into this ad.</p>;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted hover:text-ink">Report this ad</summary>
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="id" value={id} />
        <textarea name="reason" rows={3} aria-label="Why are you reporting this ad?" placeholder="Fake photos, wrong price, already sold…" className="input" />
        {state?.error && <p role="alert" className="text-brand">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-outline">{pending ? "Sending…" : "Send report"}</button>
      </form>
    </details>
  );
}
