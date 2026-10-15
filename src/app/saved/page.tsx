import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ListingCard } from "@/components/ListingCard";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteSavedSearch } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/queries";

export const metadata: Metadata = { title: "Saved bikes", robots: { index: false } };

export default async function Saved() {
  const user = await requireUser("/saved");
  const [searches, favs] = await Promise.all([
    db.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.favorite.findMany({
    where: { userId: user.id, listing: { status: { in: ["ACTIVE", "SOLD"] } } },
    select: { listingId: true, listing: { select: cardSelect } },
    orderBy: { listing: { createdAt: "desc" } },
    }),
  ]);
  return (
    <>
    <PageHero title="Saved bikes" subtitle="Bikes you are keeping an eye on." />
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section aria-labelledby="alerts" className="mb-12">
        <h2 id="alerts" className="text-2xl">Search alerts</h2>
        <p className="mt-1 text-sm text-muted">We email you when a new bike matching one of these searches goes live, and when a bike you saved drops in price.</p>
        {searches.length === 0 ? (
          <p className="mt-4 text-muted">No saved searches. Use filters on <Link href="/listings" className="text-brand hover:underline">Browse</Link>, then tap “Email me new matches”.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {searches.map((s) => (
              <li key={s.id} className="flex items-center gap-4 rounded-xl bg-surface p-4">
                <Link href={`/listings?${s.query}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{s.label}</Link>
                <form action={deleteSavedSearch}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton message="Stop alerts for this search?" className="text-sm text-muted hover:text-brand">Remove</ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      {favs.length === 0 ? (
        <p className="rounded-xl bg-surface p-10 text-center text-muted">
          Nothing saved yet. <Link href="/listings" className="text-brand hover:underline">Browse bikes</Link> and tap “Save this bike”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {favs.map((f) => <ListingCard key={f.listingId} listing={f.listing} compare={f.listing.status === "ACTIVE"} />)}
        </div>
      )}
    </div>
    </>
  );
}
