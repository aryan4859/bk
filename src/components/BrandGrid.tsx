import Link from "next/link";

/** Logos in public/brands (sources in public/brands/SOURCES.md). Brands without a reliable logo show their name in type. */
const LOGO: Record<string, string> = {
  Bajaj: "bajaj", Hero: "hero", Honda: "honda", Yamaha: "yamaha", Suzuki: "suzuki", "Royal Enfield": "royal-enfield",
  KTM: "ktm", Mahindra: "mahindra", Vespa: "vespa", Aprilia: "aprilia", CFMoto: "cfmoto", Husqvarna: "husqvarna",
};

export function BrandGrid({ brands, counts }: { brands: readonly string[]; counts: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
      {brands.map((b) => {
        const n = counts[b] ?? 0;
        return (
          <li key={b}>
            <Link
              href={`/listings?brand=${encodeURIComponent(b)}`}
              className="group flex h-full flex-col items-center rounded-lg border border-line bg-raised p-2 text-center transition-colors hover:border-field sm:p-3"
            >
              {/* a light plate in both themes, so dark logos stay visible in dark mode */}
              <span className="flex h-12 w-full items-center justify-center rounded bg-snow px-2 py-1.5 sm:h-14">
                {LOGO[b] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small static SVGs; the image optimizer adds nothing for vectors
                  <img src={`/brands/${LOGO[b]}.svg`} alt={`${b} logo`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-lg font-semibold tracking-tight text-on-snow">{b}</span>
                )}
              </span>
              <span className="mt-2 text-sm font-medium text-ink group-hover:text-brand">{b}</span>
              <span className="text-xs text-muted">{n === 0 ? "None right now" : `${n} for sale`}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
