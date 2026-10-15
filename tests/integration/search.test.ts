import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { PAGE_SIZE, parseFilters, searchListings, sellerRatings } from "@/lib/queries";
import { inDays, makeListing, makeUser, resetDb } from "../helpers/db";

beforeAll(resetDb);
beforeEach(resetDb);
const f = (sp: Record<string, string> = {}) => parseFilters(sp);

describe("searchListings", () => {
  it("returns only live ads, newest first", async () => {
    const s = await makeUser();
    const old = await makeListing(s.id, { createdAt: new Date("2026-01-01") });
    const fresh = await makeListing(s.id, { createdAt: new Date("2026-03-01") });
    await makeListing(s.id, { status: "PENDING" });
    await makeListing(s.id, { status: "SOLD" });
    await makeListing(s.id, { status: "REJECTED" });
    const r = await searchListings(f());
    expect(r.items.map((l) => l.id)).toEqual([fresh.id, old.id]);
    expect(r.total).toBe(2);
  });

  it("applies filters and sorting", async () => {
    const s = await makeUser();
    await makeListing(s.id, { brand: "Honda", city: "Pokhara", priceNpr: 100000, year: 2015 });
    const wanted = await makeListing(s.id, { brand: "Yamaha", city: "Pokhara", priceNpr: 250000, year: 2021, kmDriven: 3000, type: "SCOOTER", model: "Fascino" });
    await makeListing(s.id, { brand: "Yamaha", city: "Pokhara", priceNpr: 250000, year: 2021, kmDriven: 90000, type: "SCOOTER" });
    const r = await searchListings(f({ brand: "Yamaha", type: "SCOOTER", city: "Pokhara", minPrice: "200000", maxPrice: "300000", minYear: "2020", maxKm: "10000" }));
    expect(r.items.map((l) => l.id)).toEqual([wanted.id]);
    expect((await searchListings(f({ q: "fascino" }))).items.map((l) => l.id)).toEqual([wanted.id]);
    const asc = await searchListings(f({ sort: "price_asc" }));
    expect(asc.items.map((l) => l.priceNpr)).toEqual([100000, 250000, 250000]);
  });

  it("paginates and reports page counts", async () => {
    const s = await makeUser();
    for (let i = 0; i < PAGE_SIZE + 3; i++) await makeListing(s.id, { priceNpr: 100000 + i });
    const p1 = await searchListings(f());
    const p2 = await searchListings(f({ page: "2" }));
    expect(p1.items).toHaveLength(PAGE_SIZE);
    expect(p2.items).toHaveLength(3);
    expect(p1.pages).toBe(2);
    expect(p1.total).toBe(PAGE_SIZE + 3);
    expect(new Set([...p1.items, ...p2.items].map((l) => l.id)).size).toBe(PAGE_SIZE + 3);
  });

  describe("featured ads", () => {
    it("lists boosted ads separately and keeps them out of the paginated list", async () => {
      const s = await makeUser();
      const boosted = await makeListing(s.id, { featuredUntil: inDays(3), createdAt: new Date("2025-01-01") });
      const normal = await makeListing(s.id);
      const r = await searchListings(f());
      expect(r.featured.map((l) => l.id)).toEqual([boosted.id]);
      expect(r.items.map((l) => l.id)).toEqual([normal.id]);
      expect(r.total).toBe(2);
    });
    it("treats an expired boost as a normal ad", async () => {
      const s = await makeUser();
      const expired = await makeListing(s.id, { featuredUntil: inDays(-1) });
      const r = await searchListings(f());
      expect(r.featured).toEqual([]);
      expect(r.items.map((l) => l.id)).toEqual([expired.id]);
    });
    it("only features ads that match the current filters", async () => {
      const s = await makeUser();
      await makeListing(s.id, { featuredUntil: inDays(3), city: "Pokhara" });
      const r = await searchListings(f({ city: "Biratnagar" }));
      expect(r.featured).toEqual([]);
      expect(r.total).toBe(0);
    });
    it("caps the pinned strip at 4 and the rest still appear below", async () => {
      const s = await makeUser();
      for (let i = 0; i < 6; i++) await makeListing(s.id, { featuredUntil: inDays(1 + i) });
      const r = await searchListings(f());
      expect(r.featured).toHaveLength(4);
      expect(r.items).toHaveLength(2);
      expect(r.total).toBe(6);
    });
    it("never shows a featured ad twice across pages", async () => {
      const s = await makeUser();
      const boosted = await makeListing(s.id, { featuredUntil: inDays(2) });
      for (let i = 0; i < PAGE_SIZE + 2; i++) await makeListing(s.id);
      const seen = new Set<string>();
      for (const page of ["1", "2"]) for (const l of (await searchListings(f({ page }))).items) seen.add(l.id);
      expect(seen.has(boosted.id)).toBe(false);
      expect(seen.size).toBe(PAGE_SIZE + 2);
    });
    it("does not feature ads that are not live", async () => {
      const s = await makeUser();
      await makeListing(s.id, { featuredUntil: inDays(2), status: "PENDING" });
      expect((await searchListings(f())).featured).toEqual([]);
    });
  });

  it("attaches the seller rating to each ad", async () => {
    const seller = await makeUser();
    const [a, b] = [await makeUser(), await makeUser()];
    await db.review.createMany({ data: [{ sellerId: seller.id, reviewerId: a.id, rating: 5 }, { sellerId: seller.id, reviewerId: b.id, rating: 4 }] });
    await makeListing(seller.id);
    const r = await searchListings(f());
    expect(r.items[0].rating).toEqual({ avg: 4.5, count: 2 });
    const other = await makeUser();
    await makeListing(other.id);
    expect((await searchListings(f())).items.find((l) => l.sellerId === other.id)?.rating).toBeNull();
  });
});

describe("sellerRatings", () => {
  it("returns an empty map without querying for no ids", async () => {
    expect((await sellerRatings([])).size).toBe(0);
  });
  it("averages per seller and omits unreviewed sellers", async () => {
    const [s1, s2, r1, r2] = [await makeUser(), await makeUser(), await makeUser(), await makeUser()];
    await db.review.createMany({ data: [
      { sellerId: s1.id, reviewerId: r1.id, rating: 1 },
      { sellerId: s1.id, reviewerId: r2.id, rating: 2 },
    ] });
    const m = await sellerRatings([s1.id, s1.id, s2.id]);
    expect(m.get(s1.id)).toEqual({ avg: 1.5, count: 2 });
    expect(m.has(s2.id)).toBe(false);
  });
});
