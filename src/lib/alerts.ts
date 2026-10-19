import { db } from "./db";
import { formatNpr } from "./format";
import { sendMail } from "./mail";
import { BUSINESS } from "./business";
import { buildWhere, filtersFromQuery } from "./queries";
import { siteUrl } from "./site";

/**
 * Called when an ad goes live. Emails buyers who saved it and whose saved price is now higher, and
 * buyers whose saved search matches it. Failures to send never block moderation.
 */
export async function notifyListingLive(listingId: string): Promise<{ priceDrops: number; searchMatches: number }> {
  const l = await db.listing.findUnique({ where: { id: listingId } });
  if (!l || l.status !== "ACTIVE") return { priceDrops: 0, searchMatches: 0 };
  const link = `${siteUrl()}/listings/${l.id}`;
  const name = `${l.year} ${l.brand} ${l.model}`;

  // --- price drops on saved bikes ---
  const saved = await db.favorite.findMany({
    where: { listingId, priceAtSave: { not: l.priceNpr }, userId: { not: l.sellerId }, user: { banned: false } },
    include: { user: { select: { email: true } } },
  });
  const drops = saved.filter((f) => f.priceAtSave > l.priceNpr);
  if (saved.length) await db.favorite.updateMany({ where: { listingId, priceAtSave: { not: l.priceNpr } }, data: { priceAtSave: l.priceNpr } });
  for (const f of drops) {
    await sendMail(
      f.user.email,
      `Price drop: ${name}`,
      `The ${name} you saved is now ${formatNpr(l.priceNpr)} (was ${formatNpr(f.priceAtSave)}).\n\n${link}\n\n${BUSINESS.siteName}`,
    ).catch(() => {});
  }

  // --- saved searches ---
  let searchMatches = 0;
  const searches = await db.savedSearch.findMany({
    where: { userId: { not: l.sellerId }, user: { banned: false }, matches: { none: { listingId } } },
    include: { user: { select: { email: true } } },
    take: 1000,
  });
  for (const s of searches) {
    const hit = await db.listing.count({ where: { AND: [buildWhere(filtersFromQuery(s.query)), { id: l.id }] } });
    if (!hit) continue;
    const created = await db.searchMatch.createMany({ data: [{ savedSearchId: s.id, listingId }], skipDuplicates: true });
    if (!created.count) continue;
    searchMatches++;
    await sendMail(
      s.user.email,
      `New match for "${s.label}"`,
      `A new bike matches your saved search "${s.label}":\n\n${name}, ${formatNpr(l.priceNpr)}, ${l.city}\n${link}\n\nManage your alerts: ${siteUrl()}/saved\n\n${BUSINESS.siteName}`,
    ).catch(() => {});
  }
  return { priceDrops: drops.length, searchMatches };
}
