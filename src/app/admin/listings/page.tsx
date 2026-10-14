import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { ReviewActions } from "@/components/ReviewActions";
import { db } from "@/lib/db";
import { formatNpr, timeAgo } from "@/lib/format";

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
      <h1 className="text-3xl font-bold">Listings</h1>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={href({ status: s, page: 1 })} className={`rounded-full border px-3 py-1 text-sm ${s === status ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink"}`}>
            {s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase()} <span className="opacity-60">{count(s)}</span>
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Title, model or seller email" className="input w-64 py-1.5" />
          <button className="btn-outline py-1.5">Search</button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-10 text-center text-muted">No listings found.</p>
      ) : (
        <ul className="mt-5 divide-y divide-line rounded-lg border border-line bg-surface">
          {items.map((l) => (
            <li key={l.id} className="flex gap-4 p-4">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-surface-sunk"><Photo src={l.images[0]?.url} alt="" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/listings/${l.id}`} className="truncate font-medium hover:underline">{l.title}</Link>
                  <span className="shrink-0 rounded bg-surface-sunk px-2 py-0.5 text-xs">{l.status.toLowerCase()}</span>
                </div>
                <div className="text-sm text-muted">{l.brand} {l.model} · {l.year} · {formatNpr(l.priceNpr)} · {l.city}</div>
                <div className="text-sm text-muted">{l.seller.email} · {timeAgo(l.createdAt)}{l.rejectReason && ` · ${l.rejectReason}`}</div>
                <div className="mt-2"><ReviewActions id={l.id} status={l.status} /></div>
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
