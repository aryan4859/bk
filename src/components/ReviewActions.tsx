import { approveListing, deleteListing, featureListing, rejectListing } from "@/lib/actions";
import { FEATURE_DAYS } from "@/lib/constants";
import { isFeaturedNow } from "@/lib/format";
import { ConfirmButton } from "./ConfirmButton";

export function ReviewActions({ id, status, featuredUntil }: { id: string; status: string; featuredUntil?: Date | null }) {
  const featured = isFeaturedNow(featuredUntil);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "ACTIVE" && status !== "SOLD" && (
        <form action={approveListing}>
          <input type="hidden" name="id" value={id} />
          <button className="btn-primary py-1 text-sm">Approve</button>
        </form>
      )}
      {status !== "REJECTED" && (
        <form action={rejectListing} className="flex min-w-0 gap-1">
          <input type="hidden" name="id" value={id} />
          <input name="reason" placeholder="Reason" className="input w-32 min-w-0 py-1 text-sm sm:w-36" />
          <button className="btn-outline py-1 text-sm">Reject</button>
        </form>
      )}
      {status === "ACTIVE" && (
        <form action={featureListing} className="flex flex-wrap items-center gap-1">
          <input type="hidden" name="id" value={id} />
          {FEATURE_DAYS.map((d) => <button key={d} name="days" value={d} className="btn-outline py-1 text-sm">Feature {d}d</button>)}
          {featured && <button name="days" value={0} className="px-1 text-sm text-muted hover:text-brand">Unfeature</button>}
        </form>
      )}
      <form action={deleteListing}>
        <input type="hidden" name="id" value={id} />
        <ConfirmButton message="Delete this ad and its messages permanently?" className="px-1 text-sm text-muted hover:text-brand">Delete</ConfirmButton>
      </form>
    </div>
  );
}
