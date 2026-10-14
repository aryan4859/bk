import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { updateListing } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit ad" };

export default async function Edit({ params }: PageProps<"/listings/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/listings/${id}/edit`);
  const l = await db.listing.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } });
  if (!l || l.sellerId !== user.id) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Edit ad</h1>
      <p className="mb-8 mt-2 text-muted">Saving sends the ad back for a quick review.</p>
      <ListingForm action={updateListing.bind(null, id)} initial={l} images={l.images} submitLabel="Save changes" />
    </div>
  );
}
