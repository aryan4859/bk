import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Saved bikes" };

export default async function Saved() {
  const user = await requireUser("/saved");
  const favs = await db.favorite.findMany({
    where: { userId: user.id, listing: { status: { in: ["ACTIVE", "SOLD"] } } },
    include: { listing: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
    orderBy: { listing: { createdAt: "desc" } },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Saved bikes</h1>
      {favs.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-10 text-center text-muted">
          Nothing saved yet. <Link href="/listings" className="text-brand hover:underline">Browse bikes</Link> and tap “Save this bike”.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {favs.map((f) => <ListingCard key={f.listingId} listing={f.listing} />)}
        </div>
      )}
    </div>
  );
}
