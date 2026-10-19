import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CompareToggle } from "@/components/Compare";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Gallery } from "@/components/Gallery";
import { JsonLd } from "@/components/JsonLd";
import { ReportButton } from "@/components/ReportButton";
import { Stars } from "@/components/Stars";
import { deleteListing, setSold, startThread, toggleFavorite } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { CONDITIONS, TYPE_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatKm, formatNpr, timeAgo } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

// shared by generateMetadata and the page so the ad is fetched once per request
const getListing = cache((id: string) =>
  db.listing.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, seller: { select: { id: true, name: true, email: true, createdAt: true } } },
  }),
);

export async function generateMetadata({ params }: PageProps<"/listings/[id]">): Promise<Metadata> {
  const l = await getListing((await params).id);
  if (!l || l.status !== "ACTIVE") return { title: "Bike", robots: { index: false } };
  const name = `${l.year} ${l.brand} ${l.model}`;
  const title = `${name} for sale in ${l.city}, ${formatNpr(l.priceNpr)}`;
  const description = `Used ${name} ${TYPE_LABEL[l.type].toLowerCase()}, ${formatKm(l.kmDriven)} driven, ${l.ownerCount === 1 ? "first owner" : `${l.ownerCount} owners`}, for sale in ${l.city}. Asking ${formatNpr(l.priceNpr)}${l.negotiable ? " (negotiable)" : ""}. Message the owner directly.`;
  const url = `/listings/${l.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, images: l.images.slice(0, 1).map((i) => ({ url: i.url, alt: name })) },
  };
}

export default async function ListingPage({ params, searchParams }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [user, l] = await Promise.all([
    getUser(),
    getListing(id),
  ]);
  if (!l) notFound();

  const isOwner = user?.id === l.sellerId;
  const isAdmin = user?.role === "ADMIN";
  const isPublic = l.status === "ACTIVE" || l.status === "SOLD";
  if (!isPublic && !isOwner && !isAdmin) notFound();

  const [rating, savedRow] = await Promise.all([
    db.review.aggregate({ where: { sellerId: l.sellerId }, _avg: { rating: true }, _count: { _all: true } }),
    user ? db.favorite.findUnique({ where: { userId_listingId: { userId: user.id, listingId: id } } }) : null,
  ]);
  const saved = !!savedRow;
  const sellerName = l.seller.name ?? l.seller.email.split("@")[0];
  const specs: [string, string][] = [
    ["Type", TYPE_LABEL[l.type]], ["Brand", l.brand], ["Model", l.model], ["Year", String(l.year)],
    ["Driven", formatKm(l.kmDriven)], ["Owners", String(l.ownerCount)],
    ...(l.condition ? [["Condition", CONDITIONS[l.condition].label] as [string, string]] : []),
    ...(l.lotNumber ? [["Lot number", String(l.lotNumber)] as [string, string]] : []),
    ["Bluebook", l.bluebookOk ? "Seller says up to date" : "Not stated by seller"],
    ["Location", l.city],
  ];
  const url = absoluteUrl(`/listings/${l.id}`);
  const name = `${l.year} ${l.brand} ${l.model}`;
  // schema.org files scooters under Motorcycle too; sold ads stay public, so they are marked sold out
  const vehicleLd = {
    "@type": "Motorcycle",
    "@id": `${url}#vehicle`,
    name,
    description: l.description,
    url,
    image: l.images.map((i) => absoluteUrl(i.url)),
    brand: { "@type": "Brand", name: l.brand },
    model: l.model,
    category: TYPE_LABEL[l.type],
    vehicleModelDate: String(l.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: l.kmDriven, unitCode: "KMT" },
    numberOfPreviousOwners: l.ownerCount,
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url,
      price: l.priceNpr,
      priceCurrency: "NPR",
      availability: l.status === "SOLD" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      availableAtOrFrom: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: l.city, addressCountry: "NP" } },
      seller: { "@type": "Person", name: sellerName, url: absoluteUrl(`/sellers/${l.seller.id}`) },
    },
  };
  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Home", item: absoluteUrl("/") },
      { name: `${TYPE_LABEL[l.type]}s`, item: absoluteUrl(`/listings?type=${l.type}`) },
      { name: l.brand, item: absoluteUrl(`/listings?brand=${encodeURIComponent(l.brand)}`) },
      { name, item: url },
    ].map((b, i) => ({ "@type": "ListItem", position: i + 1, ...b })),
  };
  const wa = `https://wa.me/${l.phone}?text=${encodeURIComponent(`Hi, is your ${l.brand} ${l.model} still available?`)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {isPublic && <JsonLd data={{ "@graph": [vehicleLd, breadcrumbLd] }} />}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-ink">Home</Link> ›</li>
          <li><Link href={`/listings?type=${l.type}`} className="hover:text-ink">{TYPE_LABEL[l.type]}s</Link> ›</li>
          <li><Link href={`/listings?brand=${encodeURIComponent(l.brand)}`} className="hover:text-ink">{l.brand}</Link> ›</li>
          <li aria-current="page" className="text-ink">{l.model}</li>
        </ol>
      </nav>
      {sp.posted && <Banner tone="ok">Your ad is posted and waiting for review. It will go live as soon as it is approved.</Banner>}
      {sp.edited && <Banner tone="ok">Changes saved. The ad will be reviewed again before it shows publicly.</Banner>}
      {l.status === "PENDING" && !sp.posted && !sp.edited && <Banner tone="warn">This ad is waiting for review and is only visible to you{isAdmin && !isOwner ? " and admins" : ""}.</Banner>}
      {l.status === "REJECTED" && <Banner tone="bad">This ad was not approved: {l.rejectReason}. Edit it and save to send it for review again.</Banner>}
      {l.status === "SOLD" && <Banner tone="warn">This bike has been sold.</Banner>}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <Gallery images={l.images.map((i) => i.url)} alt={l.title} />

          <h1 className="mt-6 text-[26px] sm:text-[32px]">{l.title}</h1>
          <p className="mt-2 text-sm text-muted">Posted {timeAgo(l.createdAt)} in {l.city}</p>

          <dl className="mt-8 grid grid-cols-2 gap-5 rounded-lg bg-surface p-6 sm:grid-cols-4">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="mt-0.5 font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-10 text-[28px] sm:text-[36px]">About this {l.brand} {l.model}</h2>
          <p className="mt-3 max-w-[65ch] whitespace-pre-line leading-[1.7] text-ink">{l.description}</p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg bg-surface p-6">
            <div className="text-3xl font-bold tabular-nums text-ink">{formatNpr(l.priceNpr)}</div>
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
                <CompareToggle id={l.id} label={`${l.brand} ${l.model}`} className="min-h-10 w-full rounded-lg text-sm" wide />
                <form action={toggleFavorite}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="w-full pt-1 text-sm text-muted hover:text-ink">{saved ? "Remove from saved" : "Save this bike"}</button>
                </form>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg bg-surface p-6 text-sm">
            <Link href={`/sellers/${l.seller.id}`} className="text-lg font-semibold text-ink hover:underline">{sellerName}</Link>
            <div className="text-muted">Member since {l.seller.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</div>
            <div className="mt-1">
              {rating._avg.rating ? <Stars avg={rating._avg.rating} count={rating._count._all} /> : <span className="text-muted">No reviews yet</span>}
              {" "}<Link href={`/sellers/${l.seller.id}`} className="link">{isOwner ? "See reviews" : "Reviews"}</Link>
            </div>
          </div>

          <div className="rounded-lg bg-wash p-5 text-sm text-body">
            We do not inspect bikes or verify listings. Check the bluebook and the owner’s citizenship before paying, and never send money in advance.
          </div>

          {user && !isOwner && l.status === "ACTIVE" && <ReportButton id={l.id} />}
          {(isOwner || isAdmin) && (
            <form action={deleteListing}>
              <input type="hidden" name="id" value={l.id} />
              <input type="hidden" name="redirect" value={isOwner ? "/my" : "/admin"} />
              <ConfirmButton message="Delete this ad permanently?" className="text-sm link">Delete ad</ConfirmButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const c = { ok: "bg-ok/10 text-ok", warn: "bg-warn/10 text-warn", bad: "bg-error/10 text-error" }[tone];
  return <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${c}`}>{children}</div>;
}
