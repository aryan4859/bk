import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Photo } from "@/components/Photo";
import { deleteListing, setSold, updateName } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNpr, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

const BADGE: Record<string, string> = {
  PENDING: "bg-warn/10 text-warn", ACTIVE: "bg-ok/10 text-ok", SOLD: "bg-surface-sunk text-muted", REJECTED: "bg-error/10 text-error",
};
const LABEL: Record<string, string> = { PENDING: "In review", ACTIVE: "Live", SOLD: "Sold", REJECTED: "Not approved" };

export default async function My() {
  const user = await requireUser("/my");
  const listings = await db.listing.findMany({
    where: { sellerId: user.id }, orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <>
    <PageHero title="My account" subtitle={`Signed in as ${user.email}`} />
    <div className="mx-auto max-w-3xl px-6 py-10">
      <form action={updateName} className="flex max-w-md items-end gap-2 rounded-lg bg-surface p-5">
        <div className="flex-1">
          <label className="label" htmlFor="name">Display name</label>
          <input id="name" name="name" defaultValue={user.name ?? ""} placeholder="Shown to buyers" className="input" />
        </div>
        <button className="btn-outline">Save</button>
      </form>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl">My ads</h2>
        <Link href="/sell" className="btn-primary">Post a new ad</Link>
      </div>

      {listings.length === 0 ? (
        <p className="mt-6 rounded-lg bg-surface p-8 text-center text-muted">You have not posted anything yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {listings.map((l) => (
            <li key={l.id} className="flex gap-4 rounded-lg bg-surface p-4">
              <Link href={`/listings/${l.id}`} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-sunk">
                <Photo src={l.images[0]?.url} alt="" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/listings/${l.id}`} className="truncate font-medium hover:underline">{l.title}</Link>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${BADGE[l.status]}`}>{LABEL[l.status]}</span>
                </div>
                <div className="text-sm text-muted">{formatNpr(l.priceNpr)}, posted {timeAgo(l.createdAt)}</div>
                {l.status === "REJECTED" && <div className="mt-1 text-sm text-error">{l.rejectReason}</div>}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <Link href={`/listings/${l.id}/edit`} className="text-brand hover:underline">Edit</Link>
                  {(l.status === "ACTIVE" || l.status === "SOLD") && (
                    <form action={setSold}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="sold" value={l.status === "ACTIVE" ? "1" : "0"} />
                      <button className="text-brand hover:underline">{l.status === "ACTIVE" ? "Mark sold" : "Mark available"}</button>
                    </form>
                  )}
                  <form action={deleteListing}>
                    <input type="hidden" name="id" value={l.id} />
                    <ConfirmButton message="Delete this ad permanently?" className="text-muted hover:text-brand">Delete</ConfirmButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
}
