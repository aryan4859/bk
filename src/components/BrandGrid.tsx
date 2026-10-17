import Link from "next/link";

/** Logo files in public/brands (sources in public/brands/SOURCES.md). Brands without one show their name in type. */
const LOGO: Record<string, string> = {
  Bajaj: "bajaj.svg", Hero: "hero.svg", Honda: "honda.svg", Yamaha: "yamaha.svg", Suzuki: "suzuki.svg", "Royal Enfield": "royal-enfield.svg",
  KTM: "ktm.svg", Mahindra: "mahindra.svg", Vespa: "vespa.svg", Aprilia: "aprilia.svg", CFMoto: "cfmoto.svg", Husqvarna: "husqvarna.svg",
  TVS: "tvs.webp", Benelli: "benelli.webp", BMW: "bmw.webp", Crossfire: "crossfire.webp", Ducati: "ducati.webp", Hartford: "hartford.webp",
  Jawa: "jawa.webp", Morbidelli: "morbidelli.webp", "MV Agusta": "mv-agusta.webp", Revolt: "revolt.webp", "Super Soco": "super-soco.webp",
  Triumph: "triumph.webp", Ultraviolette: "ultraviolette.webp", Yadea: "yadea.webp", Yezdi: "yezdi.webp", Zonsen: "zonsen.webp",
  Zontes: "zontes.webp", Zuumav: "zuumav.webp", ZXMoto: "zxmoto.webp",
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
                  // eslint-disable-next-line @next/next/no-img-element -- small static logos (SVG or a few KB of WebP); the optimizer adds nothing
                  <img src={`/brands/${LOGO[b]}`} alt={`${b} logo`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
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

