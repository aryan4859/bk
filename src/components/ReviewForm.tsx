"use client";

import { useActionState } from "react";
import { submitReview } from "@/lib/actions";

export function ReviewForm({ sellerId, initial }: { sellerId: string; initial?: { rating: number; comment: string | null } }) {
  const [state, action, pending] = useActionState(submitReview.bind(null, sellerId), undefined);
  if (state?.fieldErrors?.done) return <p role="status" className="text-sm text-ok">Thanks, your review is saved.</p>;
  const err = state?.fieldErrors?.rating ?? state?.fieldErrors?.comment ?? state?.error;
  return (
    <form action={action} className="space-y-3">
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} defaultChecked={initial?.rating === n} required aria-label={`${n} ${n === 1 ? "star" : "stars"}`} className="peer sr-only" />
              <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-canvas text-sm font-medium text-ink transition-colors peer-checked:bg-dark peer-checked:text-on-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">{n}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">1 is poor, 5 is excellent.</p>
      </fieldset>
      <div>
        <label htmlFor="comment" className="label">Comment (optional)</label>
        <textarea id="comment" name="comment" rows={3} maxLength={500} defaultValue={initial?.comment ?? ""} placeholder="Was the bike as described? Was the seller easy to deal with?" className="input !bg-canvas" />
      </div>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Saving…" : initial ? "Update review" : "Post review"}</button>
    </form>
  );
}
