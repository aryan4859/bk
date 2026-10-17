import { unstable_cache } from "next/cache";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { BrandGrid } from "@/components/BrandGrid";
import { BudgetBands } from "@/components/BudgetBands";
import { Hero } from "@/components/Hero";
import { Icon } from "@/components/Icon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { Listed } from "@/lib/catalog";
import { BRANDS, BUDGETS, POPULAR_BRAND_COUNT } from "@/lib/constants";
import { db } from "@/lib/db";
import { FEATURED_MAX, cardSelect, sellerRatings } from "@/lib/queries";

const SAFETY = [
  "See the bike in daylight, somewhere public.",
  "Match the chassis and engine numbers to the bluebook.",
  "Take it for a ride before you agree on a price.",
  "Never send an advance to hold a bike.",
] as const;

// Totals only need to be roughly right, so they are cached for a minute instead of hitting the
// database on every visit to the busiest page.
const getHomeStats = unstable_cache(
  async () => {
    const live = { status: "ACTIVE" } as const;
    const [count, cities, brands, models, budgetCounts] = await Promise.all([
      db.listing.count({ where: live }),
      db.listing.groupBy({ by: ["city"], where: live, _count: { city: true }, orderBy: { _count: { city: "desc" } }, take: 8 }),
      db.listing.groupBy({ by: ["brand"], where: live, _count: { brand: true } }),
      db.listing.groupBy({ by: ["brand", "model", "type"], where: live, _count: { _all: true }, orderBy: [{ brand: "asc" }, { model: "asc" }] }),
      Promise.all(BUDGETS.map((b) => db.listing.count({ where: { ...live, priceNpr: { gte: b.min, lte: b.max } } }))),
    ]);
    // live ads per brand, model and type: the hero search adds them to its model catalogue
    const listed: Listed[] = models.map((m) => ({ brand: m.brand, model: m.model, type: m.type, n: m._count._all }));
    return {
      count, cities, listed,
      brandCounts: Object.fromEntries(brands.map((b) => [b.brand, b._count.brand])) as Record<string, number>,
      budgets: BUDGETS.map((b, i) => ({ key: b.key, label: b.label, count: budgetCounts[i] })),
    };
  },
  ["home-stats"],
  { revalidate: 60 },
);

export default async function Home() {
  const [featured, latest, { count, cities, brandCounts, listed, budgets }] = await Promise.all([
    db.listing.findMany({ where: { status: "ACTIVE", featuredUntil: { gt: new Date() } }, orderBy: { featuredUntil: "desc" }, take: FEATURED_MAX, select: cardSelect }),
    db.listing.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 8, select: cardSelect }),
    getHomeStats(),
  ]);
  const ratings = await sellerRatings([...featured, ...latest].map((l) => l.sellerId));
  const withRating = <T extends { sellerId: string }>(l: T) => ({ ...l, rating: ratings.get(l.sellerId) ?? null });
  return (
    <>
      <Hero count={count} cities={cities} listed={listed} />

      {featured.length > 0 && (
        <Section id="featured" title="Featured ads" more={{ href: "/listings", label: "View all" }}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((l, i) => <ListingCard key={l.id} listing={withRating(l)} compare priority={i < 4} />)}
          </div>
        </Section>
      )}

      <Section id="latest" title="Recently added" more={{ href: "/listings", label: `View all ${count.toLocaleString("en-IN")}` }}>
        {latest.length === 0 ? (
          <p className="rounded-lg border border-line bg-raised p-10 text-center text-muted">
            Nothing listed yet. <Link href="/sell" className="link">Post the first bike.</Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {latest.map((l, i) => <ListingCard key={l.id} listing={withRating(l)} compare priority={featured.length === 0 && i < 4} />)}
          </div>
        )}
      </Section>

      <BudgetBands bands={budgets} />

      <Section id="brands" title="Popular brands" more={{ href: "/listings", label: "All bikes" }}>
        <BrandGrid brands={BRANDS.slice(0, POPULAR_BRAND_COUNT)} counts={brandCounts} />
        <details className="group mt-3">
          <summary className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            <span className="group-open:hidden">All {BRANDS.length - 1} brands</span>
            <span className="hidden group-open:inline">Fewer brands</span>
          </summary>
          <div className="mt-3"><BrandGrid brands={BRANDS.slice(POPULAR_BRAND_COUNT).filter((b) => b !== "Other")} counts={brandCounts} /></div>
        </details>
      </Section>

      {cities.length > 0 && (
        <Section id="cities" title="Bikes by city">
          <ul className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <li key={c.city}>
                <Link href={`/listings?city=${encodeURIComponent(c.city)}`} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-3 py-2 text-sm text-ink transition-colors hover:border-field">
                  {c.city} <span className="text-muted tabular-nums">{c._count.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="sell-cta" className="flex flex-col justify-between gap-6 rounded-lg bg-dark p-6 text-on-dark sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 id="sell-cta" className="text-xl text-on-dark sm:text-2xl">Selling your bike?</h2>
            <p className="mt-1.5 max-w-md text-on-dark-soft">Posting is free and takes about five minutes. Buyers call or message you directly; we never take a cut.</p>
          </div>
          <ButtonLink href="/sell" className="shrink-0">Post a free ad</ButtonLink>
        </section>
        <section aria-labelledby="safety" className="rounded-lg border border-line bg-raised p-6">
          <h2 id="safety" className="text-base">Before you pay</h2>
          <ul className="mt-3 space-y-2 text-sm text-body">
            {SAFETY.map((t) => (
              <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-ok" />{t}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Section({ id, title, more, children }: { id: string; title: string; more?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id={id} className="text-xl sm:text-2xl">{title}</h2>
        {more && <Link href={more.href} className="shrink-0 text-sm font-medium text-brand hover:underline">{more.label} ›</Link>}
      </div>
      {children}
    </section>
  );
}
