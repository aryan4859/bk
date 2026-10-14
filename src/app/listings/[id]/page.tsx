import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Gallery } from "@/components/Gallery";
import { ReportButton } from "@/components/ReportButton";
import { deleteListing, setSold, startThread, toggleFavorite } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { TYPE_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatKm, formatNpr, timeAgo } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/listings/[id]">): Promise<Metadata> {
  const l = await db.listing.findUnique({ where: { id: (await params).id } });
  return { title: l && l.status === "ACTIVE" ? `${l.year} ${l.brand} ${l.model}` : "Bike" };
}

export default async function ListingPage({ params, searchParams }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [user, l] = await Promise.all([
    getUser(),
    db.listing.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } }, seller: { select: { name: true, email: true, createdAt: true } } },
    }),
  ]);
  if (!l) notFound();

  const isOwner = user?.id === l.sellerId;
  const isAdmin = user?.role === "ADMIN";
  const isPublic = l.status === "ACTIVE" || l.status === "SOLD";
  if (!isPublic && !isOwner && !isAdmin) notFound();

  const saved = user ? !!(await db.favorite.findUnique({ where: { userId_listingId: { userId: user.id, listingId: id } } })) : false;
  const sellerName = l.seller.name ?? l.seller.email.split("@")[0];
  const specs: [string, string][] = [
    ["Type", TYPE_LABEL[l.type]], ["Brand", l.brand], ["Model", l.model], ["Year", String(l.year)],
    ["Driven", formatKm(l.kmDriven)], ["Owners", String(l.ownerCount)], ["Bluebook", l.bluebookOk ? "Up to date" : "Not confirmed"],
    ["Location", l.city],
  ];
  const wa = `https://wa.me/${l.phone}?text=${encodeURIComponent(`Hi, is your ${l.brand} ${l.model} still available?`)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {sp.posted && <Banner tone="ok">Your ad is posted and waiting for review. It will go live as soon as it is approved.</Banner>}
      {sp.edited && <Banner tone="ok">Changes saved. The ad will be reviewed again before it shows publicly.</Banner>}
      {l.status === "PENDING" && !sp.posted && !sp.edited && <Banner tone="warn">This ad is waiting for review and is only visible to you{isAdmin && !isOwner ? " and admins" : ""}.</Banner>}
      {l.status === "REJECTED" && <Banner tone="bad">This ad was not approved: {l.rejectReason}. Edit it and save to send it for review again.</Banner>}
      {l.status === "SOLD" && <Banner tone="warn">This bike has been sold.</Banner>}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <Gallery images={l.images.map((i) => i.url)} alt={l.title} />

          <h1 className="mt-6 text-2xl font-bold">{l.title}</h1>
          <p className="mt-1 text-sm text-muted">Posted {timeAgo(l.createdAt)} · {l.city}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-5 sm:grid-cols-4">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-6 text-lg font-semibold">Description</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{l.description}</p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-line bg-card p-5">
            <div className="text-3xl font-bold">{formatNpr(l.priceNpr)}</div>
            <div className="text-sm text-muted">{l.negotiable ? "Negotiable" : "Fixed price"}</div>

            {isOwner ? (
              <div className="mt-5 space-y-2">
                <Link href={`/listings/${l.id}/edit`} className="btn-outline w-full">Edit ad</Link>
                {(l.status === "ACTIVE" || l.status === "SOLD") && (
                  <form action={setSold}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="sold" value={l.status === "ACTIVE" ? "1" : "0"} />
                    <button className="btn-outline w-full">{l.status === "ACTIVE" ? "Mark as sold" : "Mark as available"}</button>
                  </form>
                )}
              </div>
            ) : l.status === "ACTIVE" ? (
              <div className="mt-5 space-y-2">
                <form action={startThread}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="btn-primary w-full">Message seller</button>
                </form>
                {user ? (
                  <>
                    <a href={`tel:+${l.phone}`} className="btn-outline w-full">Call +{l.phone.replace(/^(977)(\d{2})(\d{4})(\d{4})$/, "$1 $2-$3-$4")}</a>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">WhatsApp</a>
                  </>
                ) : (
                  <Link href={`/login?next=/listings/${l.id}`} className="btn-outline w-full">Log in to see phone number</Link>
                )}
                <form action={toggleFavorite}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="w-full pt-1 text-sm text-muted hover:text-ink">{saved ? "Remove from saved" : "Save this bike"}</button>
                </form>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-line bg-card p-5 text-sm">
            <div className="font-medium">{sellerName}</div>
            <div className="text-muted">Member since {l.seller.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</div>
          </div>

          <div className="rounded-lg bg-wash p-4 text-sm text-muted">
            Check the bluebook and owner’s citizenship before paying. Never send money in advance.
          </div>

          {user && !isOwner && l.status === "ACTIVE" && <ReportButton id={l.id} />}
          {(isOwner || isAdmin) && (
            <form action={deleteListing}>
              <input type="hidden" name="id" value={l.id} />
              <input type="hidden" name="redirect" value={isOwner ? "/my" : "/admin"} />
              <ConfirmButton message="Delete this ad permanently?" className="text-sm text-brand hover:underline">Delete ad</ConfirmButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const c = { ok: "border-ok/30 bg-ok/5 text-ok", warn: "border-warn/30 bg-warn/5 text-warn", bad: "border-brand/30 bg-brand/5 text-brand" }[tone];
  return <div className={`mb-6 rounded-md border px-4 py-3 text-sm ${c}`}>{children}</div>;
}
