import { approveListing, deleteListing, rejectListing } from "@/lib/actions";
import { ConfirmButton } from "./ConfirmButton";

export function ReviewActions({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "ACTIVE" && status !== "SOLD" && (
        <form action={approveListing}>
          <input type="hidden" name="id" value={id} />
          <button className="btn-primary py-1 text-sm">Approve</button>
        </form>
      )}
      {status !== "REJECTED" && (
        <form action={rejectListing} className="flex gap-1">
          <input type="hidden" name="id" value={id} />
          <input name="reason" placeholder="Reason" className="input w-36 py-1 text-sm" />
          <button className="btn-outline py-1 text-sm">Reject</button>
        </form>
      )}
      <form action={deleteListing}>
        <input type="hidden" name="id" value={id} />
        <ConfirmButton message="Delete this ad and its messages permanently?" className="px-1 text-sm text-muted hover:text-brand">Delete</ConfirmButton>
      </form>
    </div>
  );
}
