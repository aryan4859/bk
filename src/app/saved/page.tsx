import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ListingCard } from "@/components/ListingCard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Saved bikes", robots: { index: false } };

export default async function Saved() {
  const user = await requireUser("/saved");
  const favs = await db.favorite.findMany({
    where: { userId: user.id, listing: { status: { in: ["ACTIVE", "SOLD"] } } },
    include: { listing: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
    orderBy: { listing: { createdAt: "desc" } },
  });
  return (
    <>
    <PageHero title="Saved bikes" subtitle="Bikes you are keeping an eye on." />
    <div className="mx-auto max-w-6xl px-6 py-10">
      {favs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-10 text-center text-muted">
          Nothing saved yet. <Link href="/listings" className="text-brand hover:underline">Browse bikes</Link> and tap “Save this bike”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {favs.map((f) => <ListingCard key={f.listingId} listing={f.listing} />)}
        </div>
      )}
    </div>
    </>
  );
}
