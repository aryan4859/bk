import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { BRANDS, CITIES } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function Home() {
  const [latest, count] = await Promise.all([
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    db.listing.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <>
      <section className="border-b border-line bg-wash">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Buy and sell used bikes and scooters, straight from the owner.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            No dealers in the middle. Talk to the seller, see the bike, agree a price.
          </p>

          <form action="/listings" className="mt-8 grid max-w-3xl gap-3 rounded-lg border border-line bg-card p-3 sm:grid-cols-[1fr_170px_170px_auto]">
            <input name="q" placeholder="Pulsar, Duke, Dio…" className="input" aria-label="Search" />
            <select name="brand" className="input" aria-label="Brand" defaultValue="">
              <option value="">Any brand</option>
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select name="city" className="input" aria-label="City" defaultValue="">
              <option value="">All Nepal</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-primary">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Just listed</h2>
          <Link href="/listings" className="text-[15px] text-brand hover:underline">
            See all {count > 0 && `${count} `}bikes
          </Link>
        </div>
        {latest.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-line p-10 text-center text-muted">
            Nothing listed yet. <Link href="/sell" className="text-brand hover:underline">Be the first to post a bike.</Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {latest.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <h2 className="text-2xl font-semibold">Browse by brand</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {BRANDS.filter((b) => b !== "Other").map((b) => (
            <Link key={b} href={`/listings?brand=${encodeURIComponent(b)}`} className="rounded-full border border-line bg-card px-4 py-1.5 text-[15px] hover:border-ink">
              {b}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {[
            ["Post your bike", "Add photos, the price and the condition. Takes about five minutes."],
            ["We check it", "Every listing is looked at before it goes live, to keep out spam and fake ads."],
            ["Meet the buyer", "Buyers message you or call. You agree on a price and finish the paperwork yourselves."],
          ].map(([t, d], i) => (
            <li key={t} className="border-t-2 border-ink pt-3">
              <div className="text-sm text-muted">Step {i + 1}</div>
              <div className="mt-1 text-lg font-semibold">{t}</div>
              <p className="mt-1 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
