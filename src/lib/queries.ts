import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { BRANDS, BUDGETS, CITIES } from "./constants";

export const PAGE_SIZE = 12;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const num = (v: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

export function parseFilters(sp: SP) {
  // `budget=<key>` is a shorthand for a price band; explicit minPrice/maxPrice win over it
  const band = BUDGETS.find((b) => b.key === one(sp.budget));
  return {
    q: one(sp.q).trim().slice(0, 80),
    type: one(sp.type),
    brand: (BRANDS as readonly string[]).includes(one(sp.brand)) ? one(sp.brand) : "",
    model: one(sp.model).trim().slice(0, 60),
    city: (CITIES as readonly string[]).includes(one(sp.city)) ? one(sp.city) : "",
    minPrice: one(sp.minPrice) || (band?.min !== undefined ? String(band.min) : ""),
    maxPrice: one(sp.maxPrice) || (band?.max !== undefined ? String(band.max) : ""),
    minYear: one(sp.minYear),
    maxKm: one(sp.maxKm),
    sort: one(sp.sort) || "newest",
    page: Math.max(1, num(one(sp.page)) ?? 1),
  };
}

export type Filters = ReturnType<typeof parseFilters>;

const FILTER_KEYS = ["q", "type", "brand", "model", "city", "minPrice", "maxPrice", "minYear", "maxKm"] as const;

/** Where clause for a set of filters. Only ever matches live ads. */
export function buildWhere(f: Filters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: "ACTIVE" };
  if (f.type === "MOTORCYCLE" || f.type === "SCOOTER") where.type = f.type;
  if (f.brand) where.brand = f.brand;
  if (f.model) where.model = { contains: f.model, mode: "insensitive" };
  if (f.city) where.city = f.city;
  const price = { gte: num(f.minPrice), lte: num(f.maxPrice) };
  if (price.gte !== undefined || price.lte !== undefined) where.priceNpr = price;
  const y = num(f.minYear);
  if (y) where.year = { gte: y };
  const km = num(f.maxKm);
  if (km !== undefined) where.kmDriven = { lte: km };
  if (f.q) {
    where.OR = ["title", "model", "brand", "description"].map((k) => ({
      [k]: { contains: f.q, mode: "insensitive" },
    })) as Prisma.ListingWhereInput[];
  }
  return where;
}

/** Stable query string of the filters that narrow results (no sort/page); "" when nothing is set. */
export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = f[k];
    if (!v) continue;
    if ((k === "minPrice" || k === "maxPrice" || k === "minYear" || k === "maxKm") && num(v) === undefined) continue;
    if (k === "type" && v !== "MOTORCYCLE" && v !== "SCOOTER") continue;
    p.set(k, v);
  }
  return p.toString();
}

export const filtersFromQuery = (query: string) => parseFilters(Object.fromEntries(new URLSearchParams(query)));

/** Short human label such as "Scooter, Pokhara, under Rs. 300000". */
export function describeFilters(f: Filters): string {
  const parts = [
    f.q && `"${f.q}"`,
    f.type === "MOTORCYCLE" ? "Motorcycle" : f.type === "SCOOTER" ? "Scooter" : "",
    f.brand,
    f.model,
    f.city,
    num(f.minPrice) !== undefined && `from Rs. ${f.minPrice}`,
    num(f.maxPrice) !== undefined && `under Rs. ${f.maxPrice}`,
    num(f.minYear) && `${f.minYear} or newer`,
    num(f.maxKm) !== undefined && `up to ${f.maxKm} km`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "All bikes";
}

export const FEATURED_MAX = 4;

/** Only the columns a listing card shows. Skips the long description and phone number. */
export const cardSelect = {
  id: true, title: true, priceNpr: true, year: true, kmDriven: true, city: true, brand: true, model: true,
  negotiable: true, status: true, featuredUntil: true, sellerId: true,
  images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ListingSelect;

export async function searchListings(f: Filters) {
  const where = buildWhere(f);
  const orderBy: Prisma.ListingOrderByWithRelationInput =
    f.sort === "price_asc" ? { priceNpr: "asc" }
    : f.sort === "price_desc" ? { priceNpr: "desc" }
    : f.sort === "km_asc" ? { kmDriven: "asc" }
    : f.sort === "year_desc" ? { year: "desc" }
    : { createdAt: "desc" };

  // Boosted ads are pinned above the results on every page of the same search, so they are
  // fetched separately and left out of the paginated list (an expired boost just sorts normally).
  const featured = await db.listing.findMany({
    where: { ...where, featuredUntil: { gt: new Date() } },
    orderBy: { featuredUntil: "desc" },
    take: FEATURED_MAX,
    select: cardSelect,
  });
  const rest: Prisma.ListingWhereInput = featured.length ? { ...where, id: { notIn: featured.map((l) => l.id) } } : where;

  const [items, restTotal] = await Promise.all([
    db.listing.findMany({ where: rest, orderBy, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: cardSelect }),
    db.listing.count({ where: rest }),
  ]);
  const ratings = await sellerRatings([...featured, ...items].map((l) => l.sellerId));
  const withRating = <T extends { sellerId: string }>(l: T) => ({ ...l, rating: ratings.get(l.sellerId) ?? null });
  return {
    items: items.map(withRating),
    featured: featured.map(withRating),
    total: restTotal + featured.length,
    pages: Math.max(1, Math.ceil(restTotal / PAGE_SIZE)),
  };
}

export type Rating = { avg: number; count: number };

/** Average rating and review count for each seller that has at least one review. */
export async function sellerRatings(sellerIds: string[]): Promise<Map<string, Rating>> {
  const ids = [...new Set(sellerIds)];
  if (!ids.length) return new Map();
  const rows = await db.review.groupBy({ by: ["sellerId"], where: { sellerId: { in: ids } }, _avg: { rating: true }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.sellerId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

/** Number of conversations with messages from the other side that the user hasn't opened yet. */
export async function unreadThreadCount(userId: string) {
  const [row] = await db.$queryRaw<{ n: number }[]>`
    SELECT COUNT(DISTINCT t."id")::int AS n
    FROM "Thread" t
    JOIN "Listing" l ON l."id" = t."listingId"
    JOIN "Message" m ON m."threadId" = t."id"
    WHERE m."senderId" <> ${userId}
      AND ((t."buyerId" = ${userId} AND m."createdAt" > t."buyerReadAt")
        OR (l."sellerId" = ${userId} AND m."createdAt" > t."sellerReadAt"))`;
  return row?.n ?? 0;
}
