import type { Metadata } from "next";
import { ListingForm } from "@/components/ListingForm";
import { createListing } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sell your bike" };

export default async function Sell() {
  await requireUser("/sell");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Sell your bike</h1>
      <p className="mb-8 mt-2 text-muted">Honest details and clear photos sell faster.</p>
      <ListingForm action={createListing} submitLabel="Post ad" />
    </div>
  );
}
