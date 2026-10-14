import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm } from "@/components/Filters";
import { ListingCard } from "@/components/ListingCard";
import { parseFilters, searchListings } from "@/lib/queries";

export const metadata: Metadata = { title: "Browse bikes and scooters" };

export default async function Browse({ searchParams }: PageProps<"/listings">) {
  const f = parseFilters(await searchParams);
  const { items, total, pages } = await searchListings(f);

  const href = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v && k !== "page") p.set(k, String(v));
    if (page > 1) p.set("page", String(page));
    return `/listings?${p}`;
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <details open className="rounded-lg border border-line bg-card p-4 lg:[&>summary]:hidden">
          <summary className="cursor-pointer font-medium lg:hidden">Filters</summary>
          <div className="mt-3 lg:mt-0">
            <FilterForm f={f} />
          </div>
        </details>
      </aside>

      <section>
        <h1 className="text-2xl font-semibold">
          {total} {total === 1 ? "bike" : "bikes"} for sale
          {f.brand && <span className="text-muted"> · {f.brand}</span>}
          {f.city && <span className="text-muted"> · {f.city}</span>}
        </h1>

        {items.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-line p-10 text-center text-muted">
            No bikes match these filters. Try widening your search.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-3">
            {items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-4 text-[15px]">
            {f.page > 1 ? <Link href={href(f.page - 1)} className="btn-outline">Previous</Link> : <span />}
            <span className="text-muted">Page {f.page} of {pages}</span>
            {f.page < pages ? <Link href={href(f.page + 1)} className="btn-outline">Next</Link> : <span />}
          </nav>
        )}
      </section>
    </div>
  );
}
