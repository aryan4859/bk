import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { BRANDS, CITIES } from "./constants";

export const PAGE_SIZE = 12;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const num = (v: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

export function parseFilters(sp: SP) {
  return {
    q: one(sp.q).trim().slice(0, 80),
    type: one(sp.type),
    brand: (BRANDS as readonly string[]).includes(one(sp.brand)) ? one(sp.brand) : "",
    city: (CITIES as readonly string[]).includes(one(sp.city)) ? one(sp.city) : "",
    minPrice: one(sp.minPrice),
    maxPrice: one(sp.maxPrice),
    minYear: one(sp.minYear),
    maxKm: one(sp.maxKm),
    sort: one(sp.sort) || "newest",
    page: Math.max(1, num(one(sp.page)) ?? 1),
  };
}

export type Filters = ReturnType<typeof parseFilters>;

export async function searchListings(f: Filters) {
  const where: Prisma.ListingWhereInput = { status: "ACTIVE" };
  if (f.type === "MOTORCYCLE" || f.type === "SCOOTER") where.type = f.type;
  if (f.brand) where.brand = f.brand;
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

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    f.sort === "price_asc" ? { priceNpr: "asc" }
    : f.sort === "price_desc" ? { priceNpr: "desc" }
    : f.sort === "km_asc" ? { kmDriven: "asc" }
    : f.sort === "year_desc" ? { year: "desc" }
    : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    db.listing.findMany({
      where, orderBy, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    db.listing.count({ where }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
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
