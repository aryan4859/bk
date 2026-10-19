import Link from "next/link";
import type { Listed } from "@/lib/catalog";
import { HeroSearch } from "./HeroSearch";
import { HeroVideo } from "./HeroVideo";

/**
 * The top of the home page: what the site is, the search, and a row of searches people are likely to want,
 * built from what is actually listed right now.
 */
export function Hero({ count, cities, listed }: {
  count: number;
  cities: { city: string; _count: { city: number } }[];
  listed: Listed[];
}) {
  const topModels = [...listed].sort((a, b) => b.n - a.n).slice(0, 4);
  const topCity = cities[0]?.city;
  const popular = [
    ...topModels.map((m) => ({ href: `/listings?brand=${encodeURIComponent(m.brand)}&model=${encodeURIComponent(m.model)}`, label: `${m.brand} ${m.model}` })),
    ...(topCity ? [{ href: `/listings?type=SCOOTER&city=${encodeURIComponent(topCity)}`, label: `Scooters in ${topCity}` }] : []),
    { href: "/listings?budget=under-1l", label: "Under Rs 1 lakh" },
  ];

  return (
    // black and white rather than theme tokens: the video is dark in both themes
    <>
      <section className="relative isolate overflow-hidden bg-black">
        <HeroVideo />
        <div aria-hidden className="absolute inset-0 bg-black/60" />
        {/* tall enough to show the video; the bottom padding is the strip the search panel overlaps */}
        <div className="relative mx-auto flex min-h-[340px] max-w-6xl flex-col justify-end px-4 pb-20 pt-10 sm:min-h-[440px] sm:px-6 sm:pb-24">
          <h1 className="text-[28px] text-white sm:text-[40px]">Used bikes and scooters for sale in Nepal</h1>
          <p className="mt-1.5 text-white/80 sm:text-lg">
            {count.toLocaleString("en-IN")} ads from owners in {cities.length} {cities.length === 1 ? "city" : "cities"}. Message the seller directly, no middleman.
          </p>
        </div>
      </section>

      {/* the search sits half on the video and half on the page */}
      <div className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 sm:-mt-16 sm:px-6">
        <div className="rounded-lg bg-raised shadow-pop">
          <HeroSearch listed={listed} />
        </div>

        {popular.length > 0 && (
          <nav aria-label="Popular searches" className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-1 text-muted">Popular right now:</span>
            {popular.map((p) => (
              <Link key={p.href} href={p.href} className="rounded-full border border-line bg-raised px-3 py-1 text-body transition-colors hover:border-field hover:text-ink">
                {p.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
