import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm } from "@/components/Filters";
import { ListingCard } from "@/components/ListingCard";
import { FilterPanel } from "@/components/FilterPanel";
import { PageHero } from "@/components/PageHero";
import { saveSearch } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { filtersToQuery, parseFilters, searchListings } from "@/lib/queries";

export const metadata: Metadata = { title: "Browse bikes and scooters", description: "Filter used motorcycles and scooters for sale in Nepal by brand, city, price, year and kilometres driven." };

export default async function Browse({ searchParams }: PageProps<"/listings">) {
  const f = parseFilters(await searchParams);
  const [{ items, featured, total, pages }, user] = await Promise.all([searchListings(f), getUser()]);
  const query = filtersToQuery(f);

  const href = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v && k !== "page") p.set(k, String(v));
    if (page > 1) p.set("page", String(page));
    return `/listings?${p}`;
  };

  return (
    <>
    <PageHero
      title={`${total} ${f.brand ? `${f.brand} ` : ""}${total === 1 ? "bike" : "bikes"} for sale${f.city ? ` in ${f.city}` : ""}`}
      subtitle="Listings from sellers across Nepal."
    />
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[250px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <FilterPanel>
          <FilterForm f={f} />
        </FilterPanel>
        {query && (
          <form action={saveSearch} className="mt-4">
            <input type="hidden" name="query" value={query} />
            <button className="btn-outline w-full text-sm">{user ? "Email me new matches" : "Log in to get alerts"}</button>
            <p className="mt-1 text-xs text-muted">Saves these filters and emails you when a matching bike goes live.</p>
          </form>
        )}
      </aside>

      <section>
        {f.page === 1 && featured.length > 0 && (
          <div className="mb-10" aria-label="Featured bikes">
            <h2 className="mb-4 text-xl">Featured</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-3">
              {featured.map((l, i) => <ListingCard key={l.id} listing={l} compare priority={i < 3} index={i} />)}
            </div>
          </div>
        )}
        {items.length === 0 && featured.length === 0 ? (
          <div className="rounded-xl bg-surface p-10 text-center text-muted">
            No bikes match these filters. Try widening your search.
          </div>
        ) : items.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-3">
            {items.map((l, i) => <ListingCard key={l.id} listing={l} compare priority={featured.length === 0 && f.page === 1 && i < 3} index={i % 3} />)}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-4 text-base">
            {f.page > 1 ? <Link href={href(f.page - 1)} className="btn-outline">Previous</Link> : <span />}
            <span className="text-muted">Page {f.page} of {pages}</span>
            {f.page < pages ? <Link href={href(f.page + 1)} className="btn-outline">Next</Link> : <span />}
          </nav>
        )}
      </section>
    </div>
    </>
  );
}
