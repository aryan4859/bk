import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ListingForm } from "@/components/ListingForm";
import { createListing } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sell your bike", description: "Post your motorcycle or scooter for sale with photos and a price.", robots: { index: false } };

export default async function Sell() {
  await requireUser("/sell");
  return (
    <>
      <PageHero title="Sell your bike" subtitle="Honest details and clear photos sell faster." />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <ListingForm action={createListing} submitLabel="Post ad" />
      </div>
    </>
  );
}
