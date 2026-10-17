import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { ReviewActions } from "@/components/ReviewActions";
import { db } from "@/lib/db";
import { formatNpr, isFeaturedNow, timeAgo } from "@/lib/format";

const STATUSES = ["ALL", "PENDING", "ACTIVE", "SOLD", "REJECTED"] as const;
const PAGE = 20;

export default async function AdminListings({ searchParams }: PageProps<"/admin/listings">) {
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const status = STATUSES.find((s) => s === str(sp.status)) ?? "ALL";
  const q = str(sp.q).trim().slice(0, 80);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const where: Prisma.ListingWhereInput = {};
  if (status !== "ALL") where.status = status;
  if (q) where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { brand: { contains: q, mode: "insensitive" } },
    { model: { contains: q, mode: "insensitive" } },
    { seller: { email: { contains: q, mode: "insensitive" } } },
  ];

  const [items, total, counts] = await Promise.all([
    db.listing.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE,
      include: { images: { orderBy: { position: "asc" }, take: 1 }, seller: { select: { email: true } } },
    }),
    db.listing.count({ where }),
    db.listing.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => (s === "ALL" ? counts.reduce((a, c) => a + c._count, 0) : counts.find((c) => c.status === s)?._count ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (o: Record<string, string | number>) => {
    const p = new URLSearchParams({ ...(status !== "ALL" && { status }), ...(q && { q }), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) });
    return `/admin/listings?${p}`;
  };

  return (
    <div>
      <h1 className="text-4xl">Listings</h1>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={href({ status: s, page: 1 })} className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${s === status ? "bg-cream text-ink" : "text-muted hover:bg-wash hover:text-ink"}`}>
            {s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase()} <span className="opacity-60">{count(s)}</span>
          </Link>
        ))}
        <form className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Title, model or seller email" className="input min-w-0 flex-1 py-1.5 sm:w-64 sm:flex-none" />
          <button className="btn-outline py-1.5">Search</button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 rounded-lg bg-surface p-10 text-center text-muted">No listings found.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((l) => (
            <li key={l.id} className="flex gap-3 rounded-lg bg-surface p-3 sm:gap-4 sm:p-4">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-surface-sunk sm:h-16 sm:w-24"><Photo src={l.images[0]?.url} alt="" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/listings/${l.id}`} className="truncate font-medium hover:underline">{l.title}</Link>
                  <span className="shrink-0 rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-ink">{l.status.toLowerCase()}</span>
                  {isFeaturedNow(l.featuredUntil) && l.featuredUntil && <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-on-accent">featured until {l.featuredUntil.toLocaleDateString("en-GB")}</span>}
                </div>
                <div className="text-sm text-muted">{l.brand} {l.model} · {l.year} · {formatNpr(l.priceNpr)} · {l.city}</div>
                <div className="text-sm text-muted">{l.seller.email} · {timeAgo(l.createdAt)}{l.rejectReason && ` · ${l.rejectReason}`}</div>
                <div className="mt-2"><ReviewActions id={l.id} status={l.status} featuredUntil={l.featuredUntil} /></div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4 text-sm">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="btn-outline">Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="btn-outline">Next</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
