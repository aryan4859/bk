import { unstable_cache } from "next/cache";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
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

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-14 sm:pt-24">
          <h1 className="max-w-3xl text-5xl sm:text-7xl">Used bikes and scooters in Nepal.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            {count} for sale right now. Search, message the seller, then go and see the bike.
          </p>
          <form action="/listings" className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-[1fr_190px_190px_auto]">
            <input name="q" placeholder="Pulsar, Duke, Dio" className="input" aria-label="Search" />
            <select name="brand" className="input" aria-label="Brand" defaultValue="">
              <option value="">Any brand</option>
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select name="city" className="input" aria-label="City" defaultValue="">
              <option value="">All Nepal</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-primary px-8">Search</button>
          </form>
          <p className="mt-4 text-sm text-muted">
            Or browse <Link href="/listings?type=MOTORCYCLE" className="text-ink underline underline-offset-4">motorcycles</Link> or{" "}
            <Link href="/listings?type=SCOOTER" className="text-ink underline underline-offset-4">scooters</Link>.
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-16" aria-labelledby="featured">
          <h2 id="featured" className="text-3xl sm:text-4xl">Featured</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {featured.map((l, i) => <ListingCard key={l.id} listing={withRating(l)} compare priority={i < 4} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl">Just listed</h2>
          <Link href="/listings" className="text-brand underline underline-offset-4">See all {count}</Link>
        </div>
        {latest.length === 0 ? (
          <p className="mt-8 rounded-md border border-dashed border-line p-10 text-center text-muted">
            Nothing listed yet. <Link href="/sell" className="text-brand underline underline-offset-4">Post the first bike.</Link>
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {latest.map((l, i) => <ListingCard key={l.id} listing={withRating(l)} compare priority={featured.length === 0 && i < 4} />)}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pt-20 md:grid-cols-2">
        <div>
          <h2 className="text-3xl">Brands</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {BRANDS.filter((b) => b !== "Other").map((b) => (
              <li key={b}><Link href={`/listings?brand=${encodeURIComponent(b)}`} className="inline-block py-1.5 underline-offset-4 hover:underline">{b}</Link></li>
            ))}
          </ul>
        </div>
        {cities.length > 0 && (
          <div>
            <h2 className="text-3xl">Cities</h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1">
              {cities.map((c) => (
                <li key={c.city}>
                  <Link href={`/listings?city=${encodeURIComponent(c.city)}`} className="inline-block py-1.5 underline-offset-4 hover:underline">
                    {c.city} <span className="text-muted">({c._count.city})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-20">
        <h2 className="text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="border-t-2 border-ink pt-4">
              <div className="font-display text-muted">{i + 1}</div>
              <h3 className="mt-1 text-xl">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-10">
          <div>
            <h2 className="text-3xl">Got a bike to sell?</h2>
            <p className="mt-2 text-muted">Posting an ad is free. Add photos and a price.</p>
          </div>
          <ButtonLink href="/sell">Sell a bike</ButtonLink>
        </div>
      </section>
    </>
  );
}
