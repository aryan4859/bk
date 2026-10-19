import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { BRANDS } from "@/lib/constants";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// one sitemap file holds at most 50,000 URLs; well past that, split it with generateSitemaps
const MAX_LISTINGS = 45_000;

const getEntries = unstable_cache(
  async () => {
    const live = { status: "ACTIVE" } as const;
    const [listings, sellers, brands, cities] = await Promise.all([
      db.listing.findMany({ where: live, orderBy: { updatedAt: "desc" }, take: MAX_LISTINGS, select: { id: true, updatedAt: true } }),
      db.user.findMany({ where: { banned: false, listings: { some: live } }, select: { id: true } }),
      db.listing.groupBy({ by: ["brand"], where: live }),
      db.listing.groupBy({ by: ["city"], where: live }),
    ]);
    return { listings, sellers, brands: brands.map((b) => b.brand), cities: cities.map((c) => c.city) };
  },
  ["sitemap"],
  { revalidate: 3600 },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // the database is only reachable at runtime, not during the build
  const base = siteUrl();
  const { listings, sellers, brands, cities } = await getEntries();
  const browse = (q: string) => `${base}/listings?${q}`;
  // only brands and cities with ads right now: an empty results page is a thin page
  const known = new Set<string>(BRANDS);
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/listings`, changeFrequency: "hourly", priority: 0.9 },
    { url: browse("type=MOTORCYCLE"), changeFrequency: "daily", priority: 0.8 },
    { url: browse("type=SCOOTER"), changeFrequency: "daily", priority: 0.8 },
    ...brands.filter((b) => known.has(b) && b !== "Other").map((b) => ({ url: browse(`brand=${encodeURIComponent(b)}`), changeFrequency: "daily" as const, priority: 0.7 })),
    ...cities.filter((c) => c !== "Other").map((c) => ({ url: browse(`city=${encodeURIComponent(c)}`), changeFrequency: "daily" as const, priority: 0.7 })),
    ...listings.map((l) => ({ url: `${base}/listings/${l.id}`, lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...sellers.map((s) => ({ url: `${base}/sellers/${s.id}`, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...["contact", "privacy", "terms", "refunds", "cookies"].map((p) => ({ url: `${base}/${p}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
