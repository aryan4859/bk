import { unstable_cache } from "next/cache";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { BrandGrid } from "@/components/BrandGrid";
import { BudgetBands } from "@/components/BudgetBands";
import { Hero } from "@/components/Hero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { Listed } from "@/lib/catalog";
import { BRANDS, BUDGETS } from "@/lib/constants";
import { db } from "@/lib/db";
import { FEATURED_MAX, cardSelect, sellerRatings } from "@/lib/queries";

// written as a note from us, not a feature grid
const STEPS = [
  ["You post the bike.", "A few photos, the price, and an honest word about its condition. Scratches included."],
  ["We read every ad.", "Someone on our team checks each one before it goes up. We can't see the bike, though, so look it over and check the bluebook yourself."],
  ["You meet the buyer.", "They message or call you. You agree on a price over tea, and do the transfer papers together."],
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
  // the floating bikes in the hero: featured first, then the newest, only ones with a photo
  const heroCards = [...featured, ...latest.filter((l) => !featured.some((f) => f.id === l.id))]
    .filter((l) => l.images[0])
    .slice(0, 3)
    .map((l) => ({ id: l.id, title: `${l.year} ${l.brand} ${l.model}`, priceNpr: l.priceNpr, url: l.images[0].url }));

  return (
    <>
      <Hero count={count} cities={cities.length} cards={heroCards} listed={listed} />

      {featured.length > 0 && (
        <section className="border-t border-line py-16 sm:py-20" aria-labelledby="featured">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="featured" data-reveal className="text-2xl sm:text-3xl">Featured</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {featured.map((l, i) => <ListingCard key={l.id} listing={withRating(l)} compare priority={i < 4} index={i} />)}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 data-reveal className="text-2xl sm:text-3xl">Just listed</h2>
          <Link href="/listings" className="text-sm text-muted transition-colors hover:text-ink">See all {count} →</Link>
        </div>
        {latest.length === 0 ? (
          <p className="mt-8 rounded-xl bg-surface p-10 text-center text-muted">
            Nothing listed yet. <Link href="/sell" className="link">Post the first bike.</Link>
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {latest.map((l, i) => <ListingCard key={l.id} listing={withRating(l)} compare priority={featured.length === 0 && i < 4} index={i} />)}
          </div>
        )}
        </div>
      </section>

      <BudgetBands bands={budgets} />

      <section className="border-t border-line py-16 sm:py-20" aria-labelledby="brands">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 id="brands" data-reveal className="text-2xl sm:text-3xl">Popular brands</h2>
            <Link href="/listings" className="text-sm text-muted transition-colors hover:text-ink">See all bikes →</Link>
          </div>
          <BrandGrid brands={BRANDS.filter((b) => b !== "Other")} counts={brandCounts} />

          {cities.length > 0 && (
            <div className="mt-16">
              <h2 data-reveal className="text-2xl sm:text-3xl">Cities</h2>
              <ul data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                {cities.map((c) => (
                  <li key={c.city}>
                    <Link href={`/listings?city=${encodeURIComponent(c.city)}`} className="inline-block py-1.5 text-ink underline-offset-4 hover:underline">
                      {c.city} <span className="text-muted">({c._count.city})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line py-16 sm:py-20" aria-labelledby="how">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div data-reveal>
              <h2 id="how" className="text-2xl sm:text-3xl">How it works</h2>
              <p className="mt-3 max-w-xs text-muted">We&apos;re a noticeboard, not a dealer. The deal is between you and the other rider.</p>
            </div>
            <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
              {STEPS.map(([title, body], i) => (
                <li key={title} data-reveal style={{ "--i": i + 1 } as React.CSSProperties} className="border-t border-ink pt-4">
                  <h3 className="text-xl">{title}</h3>
                  <p className="mt-2 text-body">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="sell-cta">
        <div data-reveal className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-surface px-6 py-10 sm:px-10">
          <div>
            <h2 id="sell-cta" className="text-2xl sm:text-3xl">Bike sitting in the gully?</h2>
            <p className="mt-2 max-w-md text-body">Someone in your city is probably looking for it. Posting is free, takes about five minutes, and buyers message you directly.</p>
          </div>
          <ButtonLink href="/sell">Sell a bike</ButtonLink>
        </div>
      </section>
    </>
  );
}
