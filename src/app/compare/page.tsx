import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import { Stars } from "@/components/Stars";
import { compareRows, parseCompareIds } from "@/lib/compare";
import { db } from "@/lib/db";
import { cardSelect, sellerRatings } from "@/lib/queries";

export const metadata: Metadata = { title: "Compare bikes", robots: { index: false } };

export default async function Compare({ searchParams }: PageProps<"/compare">) {
  const ids = parseCompareIds((await searchParams).ids);
  const found = ids.length
    ? await db.listing.findMany({ where: { id: { in: ids }, status: { in: ["ACTIVE", "SOLD"] } }, select: { ...cardSelect, type: true, ownerCount: true, bluebookOk: true } })
    : [];
  // keep the order the visitor picked
  const items = ids.flatMap((id) => found.filter((l) => l.id === id));
  const ratings = await sellerRatings(items.map((l) => l.sellerId));
  const rows = compareRows(items);

  return (
    <>
      <PageHero title="Compare bikes" subtitle="Side by side. The best value in each row is highlighted." />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {items.length < 2 ? (
          <p className="rounded-lg border border-dashed border-line p-10 text-center text-muted">
            Pick at least two bikes to compare. Tap “+ Compare” on any listing, then come back here.{" "}
            <Link href="/listings" className="text-brand underline underline-offset-4">Browse bikes</Link>
          </p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className={`w-full table-fixed border-collapse text-left text-sm sm:text-base ${items.length > 2 ? "min-w-[560px]" : ""}`}>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-20 bg-white sm:w-32" />
                  {items.map((l) => (
                    <th key={l.id} scope="col" className="p-2 align-top font-normal sm:p-3">
                      <Link href={`/listings/${l.id}`} className="group block">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-wash"><Photo src={l.images[0]?.url} alt={`${l.year} ${l.brand} ${l.model}`} sizes="(min-width: 1024px) 300px, 50vw" /></div>
                        <div className="mt-2 font-semibold leading-snug group-hover:underline">{l.brand} {l.model}</div>
                      </Link>
                      {ratings.get(l.sellerId) && <Stars avg={ratings.get(l.sellerId)!.avg} count={ratings.get(l.sellerId)!.count} className="text-sm" />}
                      {l.status === "SOLD" && <div className="text-sm text-brand">Sold</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-line">
                    <th scope="row" className="sticky left-0 z-10 bg-white p-2 text-sm font-normal text-muted sm:p-3">{r.label}</th>
                    {r.values.map((v, i) => (
                      <td key={i} className={`p-2 align-top sm:p-3 ${r.best?.includes(i) ? "font-semibold text-ok" : ""}`}>
                        {v}{r.best?.includes(i) && <span className="sr-only"> (best)</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
