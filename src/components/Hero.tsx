import Link from "next/link";
import type { Listed } from "@/lib/catalog";
import { HeroScene, type HeroCard } from "./HeroScene";
import { HeroSearch } from "./HeroSearch";

/**
 * The home hero: a plain headline with one hand-drawn underline, the search, and the hills with the newest
 * bikes floating in front. Quiet on purpose: the bikes are the colour.
 */
export function Hero({ count, cities, cards, listed }: {
  count: number;
  cities: number;
  cards: HeroCard[];
  listed: Listed[];
}) {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-24 lg:pt-16">
        <div>
          <p className="text-sm text-muted">
            {count} bikes for sale in {cities} {cities === 1 ? "city" : "cities"}
          </p>
          <h1 className="mt-4 text-[44px] leading-[1.02] sm:text-[60px] lg:text-[66px]">
            Find your next bike,{" "}
            <span className="relative inline-block whitespace-nowrap">
              <em className="font-display italic">straight</em>
              <Scribble />
            </span>{" "}
            from the owner.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-body">
            Used motorcycles and scooters, posted by the people who ride them. Message the seller, meet up, check
            the bluebook, then decide.
          </p>
        </div>

        {cards.length > 0 && (
          <div role="group" aria-label="Recently listed bikes" className="order-last lg:order-none lg:row-span-2">
            <HeroScene cards={cards} />
          </div>
        )}

        <div>
          <HeroSearch listed={listed} />
          <p className="mt-4 text-sm text-muted">
            Just looking? Browse all <Link href="/listings?type=MOTORCYCLE" className="link">motorcycles</Link> or{" "}
            <Link href="/listings?type=SCOOTER" className="link">scooters</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}

/** A pen stroke under a word: slightly uneven on purpose, drawn once when the page opens. */
function Scribble() {
  return (
    <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="scribble absolute -bottom-2 left-[-4%] h-[0.32em] w-[108%] overflow-visible text-accent">
      <path
        d="M3 13 C 34 6, 70 4, 104 7 S 168 12, 197 5"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
