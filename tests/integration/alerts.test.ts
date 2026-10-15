import { beforeEach, describe, expect, it, vi } from "vitest";

const sent: { to: string; subject: string; text: string }[] = [];
vi.mock("@/lib/mail", () => ({ sendMail: vi.fn(async (to: string, subject: string, text: string) => { sent.push({ to, subject, text }); }) }));

import { notifyListingLive } from "@/lib/alerts";
import { db } from "@/lib/db";
import { makeListing, makeUser, resetDb } from "../helpers/db";

beforeEach(async () => { await resetDb(); sent.length = 0; });

describe("price-drop alerts", () => {
  it("emails buyers who saved the bike when the price is now lower, then records the new price", async () => {
    const seller = await makeUser();
    const buyer = await makeUser({ email: "buyer@test.local" });
    const l = await makeListing(seller.id, { priceNpr: 180000 });
    await db.favorite.create({ data: { userId: buyer.id, listingId: l.id, priceAtSave: 200000 } });
    const r = await notifyListingLive(l.id);
    expect(r.priceDrops).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("buyer@test.local");
    expect(sent[0].subject).toContain("Price drop");
    expect(sent[0].text).toContain("Rs. 1,80,000");
    expect(sent[0].text).toContain("Rs. 2,00,000");
    expect(sent[0].text).toContain(`http://test.local/listings/${l.id}`);
    expect((await db.favorite.findFirstOrThrow()).priceAtSave).toBe(180000);
    // approving again without a further change stays quiet
    sent.length = 0;
    expect((await notifyListingLive(l.id)).priceDrops).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("stays quiet when the price went up, but remembers the new price", async () => {
    const seller = await makeUser();
    const buyer = await makeUser();
    const l = await makeListing(seller.id, { priceNpr: 250000 });
    await db.favorite.create({ data: { userId: buyer.id, listingId: l.id, priceAtSave: 200000 } });
    await notifyListingLive(l.id);
    expect(sent).toHaveLength(0);
    expect((await db.favorite.findFirstOrThrow()).priceAtSave).toBe(250000);
  });

  it("skips banned users and listings that are not live", async () => {
    const seller = await makeUser();
    const banned = await makeUser({ banned: true });
    const l = await makeListing(seller.id, { priceNpr: 100000 });
    await db.favorite.create({ data: { userId: banned.id, listingId: l.id, priceAtSave: 200000 } });
    await notifyListingLive(l.id);
    expect(sent).toHaveLength(0);
    const pending = await makeListing(seller.id, { status: "PENDING" });
    expect(await notifyListingLive(pending.id)).toEqual({ priceDrops: 0, searchMatches: 0 });
    expect(await notifyListingLive("does-not-exist")).toEqual({ priceDrops: 0, searchMatches: 0 });
  });
});

describe("saved-search alerts", () => {
  it("emails buyers whose saved filters match and never twice for the same ad", async () => {
    const seller = await makeUser();
    const buyer = await makeUser({ email: "scooter-fan@test.local" });
    await db.savedSearch.create({ data: { userId: buyer.id, label: "Scooter, Pokhara", query: "type=SCOOTER&city=Pokhara&maxPrice=300000" } });
    const l = await makeListing(seller.id, { type: "SCOOTER", city: "Pokhara", priceNpr: 250000, brand: "Honda", model: "Dio" });
    expect((await notifyListingLive(l.id)).searchMatches).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("scooter-fan@test.local");
    expect(sent[0].subject).toContain("Scooter, Pokhara");
    expect(sent[0].text).toContain("Honda Dio");
    expect((await notifyListingLive(l.id)).searchMatches).toBe(0);
    expect(sent).toHaveLength(1);
  });

  it("does not email when the ad does not match", async () => {
    const seller = await makeUser();
    const buyer = await makeUser();
    await db.savedSearch.create({ data: { userId: buyer.id, label: "x", query: "type=SCOOTER&maxPrice=100000" } });
    const l = await makeListing(seller.id, { type: "SCOOTER", priceNpr: 250000 });
    expect((await notifyListingLive(l.id)).searchMatches).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("does not alert the seller about their own ad or banned users", async () => {
    const seller = await makeUser();
    const banned = await makeUser({ banned: true });
    await db.savedSearch.createMany({ data: [
      { userId: seller.id, label: "mine", query: "brand=Honda" },
      { userId: banned.id, label: "banned", query: "brand=Honda" },
    ] });
    const l = await makeListing(seller.id, { brand: "Honda" });
    expect((await notifyListingLive(l.id)).searchMatches).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("keeps going when sending an email fails", async () => {
    const { sendMail } = await import("@/lib/mail");
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("smtp down"));
    const seller = await makeUser();
    const [a, b] = [await makeUser({ email: "a@test.local" }), await makeUser({ email: "b@test.local" })];
    await db.savedSearch.createMany({ data: [{ userId: a.id, label: "a", query: "brand=Honda" }, { userId: b.id, label: "b", query: "brand=Honda" }] });
    const l = await makeListing(seller.id, { brand: "Honda" });
    await expect(notifyListingLive(l.id)).resolves.toMatchObject({ searchMatches: 2 });
    expect(sent.length).toBeGreaterThanOrEqual(1);
  });
});
