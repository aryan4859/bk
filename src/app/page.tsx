import { unstable_cache } from "next/cache";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { HeroScene } from "@/components/HeroScene";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { BRANDS, CITIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { FEATURED_MAX, cardSelect, sellerRatings } from "@/lib/queries";

const STEPS = [
  ["Post your bike", "Add photos, the price and an honest description of the condition."],
  ["We review it", "Our team reviews each ad before it appears. We cannot verify every detail, so always check the bike and papers yourself."],
  ["Meet the buyer", "Buyers message or call you. You agree on a price and handle the paperwork yourselves."],
] as const;

// Totals only need to be roughly right, so they are cached for a minute instead of hitting the
// database on every visit to the busiest page.
const getHomeStats = unstable_cache(
  async () => {
    const [count, cities] = await Promise.all([
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.listing.groupBy({ by: ["city"], where: { status: "ACTIVE" }, _count: { city: true }, orderBy: { _count: { city: "desc" } }, take: 8 }),
    ]);
    return { count, cities };
  },
  ["home-stats"],
  { revalidate: 60 },
);

export default async function Home() {
  const [featured, latest, { count, cities }] = await Promise.all([
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
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-8 px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <h1 className="max-w-3xl text-[44px] sm:text-[64px] lg:text-[72px]">Used bikes and scooters in Nepal.</h1>
            <p className="mt-5 max-w-xl text-lg text-body">
              {count} for sale right now. Search, message the seller, then go and see the bike.
            </p>
          </div>
          {heroCards.length > 0 && (
            <div role="group" aria-label="Recently listed bikes" className="order-last lg:order-none lg:row-span-2">
              <HeroScene cards={heroCards} />
            </div>
          )}
          <div>
            <form action="/listings" className="grid gap-3 sm:grid-cols-2">
              <input name="q" placeholder="Pulsar, Duke, Dio" className="input sm:col-span-2" aria-label="Search" />
              <select name="brand" className="input" aria-label="Brand" defaultValue="">
                <option value="">Any brand</option>
                {BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
              <select name="city" className="input" aria-label="City" defaultValue="">
                <option value="">All Nepal</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button className="btn-primary px-8 sm:col-span-2 lg:col-span-1 lg:justify-self-start">Search</button>
            </form>
            <p className="mt-4 text-sm text-muted">
              Or browse <Link href="/listings?type=MOTORCYCLE" className="link">motorcycles</Link> or{" "}
              <Link href="/listings?type=SCOOTER" className="link">scooters</Link>.
            </p>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-wash py-20 sm:py-24" aria-labelledby="featured">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="featured" data-reveal className="text-[32px] sm:text-[44px]">Featured</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {featured.map((l, i) => <ListingCard key={l.id} listing={withRating(l)} compare priority={i < 4} index={i} />)}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="flex items-end justify-between gap-4">
          <h2 data-reveal className="text-[32px] sm:text-[44px]">Just listed</h2>
          <Link href="/listings" className="link">See all {count}</Link>
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
      </section>

      <section className="bg-surface py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-20 px-4 sm:px-6 md:grid-cols-2 md:gap-12">
          <div>
            <h2 data-reveal className="text-[32px] sm:text-[44px]">Brands</h2>
            <ul data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {BRANDS.filter((b) => b !== "Other").map((b) => (
                <li key={b}><Link href={`/listings?brand=${encodeURIComponent(b)}`} className="inline-block py-1.5 text-ink underline-offset-4 hover:underline">{b}</Link></li>
              ))}
            </ul>
          </div>
          {cities.length > 0 && (
            <div>
              <h2 data-reveal style={{ "--i": 1 } as React.CSSProperties} className="text-[32px] sm:text-[44px]">Cities</h2>
              <ul data-reveal style={{ "--i": 2 } as React.CSSProperties} className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1">
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

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6 sm:pt-24" aria-labelledby="how">
        <div data-reveal className="rounded-2xl bg-dark px-6 py-12 sm:px-12 sm:py-16">
          <h2 id="how" className="text-[32px] text-on-dark sm:text-[44px]">How it works</h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <li key={title} data-reveal style={{ "--i": i + 1 } as React.CSSProperties}>
                <h3 className="text-[28px] text-on-dark">{title}</h3>
                <p className="mt-3 text-on-dark">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6" aria-labelledby="sell-cta">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-6 rounded-2xl bg-accent px-6 py-12 text-on-accent sm:px-12 sm:py-16">
          <div>
            <h2 id="sell-cta" className="text-[32px] !text-on-accent sm:text-[44px]">Got a bike to sell?</h2>
            <p className="mt-3 max-w-md text-lg">Posting an ad is free. Add photos and a price, and buyers message you directly.</p>
          </div>
          <ButtonLink href="/sell" variant="onColor">Sell a bike</ButtonLink>
        </div>
      </section>
    </>
  );
}
