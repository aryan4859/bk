import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- stand-ins for the Next.js request context ----
let current: User | null = null;
const flashes: { msg: string; tone?: string }[] = [];
const afterTasks: (() => unknown)[] = [];
const sent: { to: string; subject: string }[] = [];

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => { afterTasks.push(fn); } }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }), headers: async () => new Headers() }));
vi.mock("@/lib/flash", () => ({ flash: async (msg: string, tone?: string) => { flashes.push({ msg, tone }); } }));
vi.mock("@/lib/mail", () => ({ sendMail: async (to: string, subject: string) => { sent.push({ to, subject }); } }));
vi.mock("@/lib/auth", () => ({
  requireUser: async (next = "/") => { if (!current) throw new Error(`REDIRECT:/login?next=${next}`); return current; },
  requireAdmin: async () => { if (!current || current.role !== "ADMIN") throw new Error("REDIRECT:/"); return current; },
}));

import { approveListing, deleteReview, deleteSavedSearch, featureListing, saveSearch, submitReview, toggleFavorite } from "@/lib/actions";
import { db } from "@/lib/db";
import { makeConversation, makeListing, makeUser, resetDb } from "../helpers/db";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.append(k, v);
  return f;
};
const redirectsTo = async (p: Promise<unknown>) => { try { await p; } catch (e) { return (e as Error).message.replace("REDIRECT:", ""); } return null; };

beforeEach(async () => {
  await resetDb();
  current = null; flashes.length = 0; afterTasks.length = 0; sent.length = 0;
});

describe("submitReview", () => {
  it("requires login", async () => {
    const seller = await makeUser();
    expect(await redirectsTo(submitReview(seller.id, undefined, fd({ rating: "5" })))).toContain("/login");
  });
  it("lets a buyer who messaged the seller leave and then update one review", async () => {
    const [seller, buyer] = [await makeUser(), await makeUser()];
    await makeConversation(buyer.id, (await makeListing(seller.id)).id);
    current = buyer;
    expect(await submitReview(seller.id, undefined, fd({ rating: "4", comment: "Smooth deal" }))).toEqual({ fieldErrors: { done: "1" } });
    expect(await submitReview(seller.id, undefined, fd({ rating: "2", comment: "" }))).toEqual({ fieldErrors: { done: "1" } });
    const all = await db.review.findMany();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ rating: 2, comment: null, sellerId: seller.id, reviewerId: buyer.id });
  });
  it("rejects strangers, self-reviews and banned sellers", async () => {
    const [seller, stranger] = [await makeUser(), await makeUser()];
    current = stranger;
    expect((await submitReview(seller.id, undefined, fd({ rating: "5" })))?.error).toMatch(/messaged them/);
    current = seller;
    expect((await submitReview(seller.id, undefined, fd({ rating: "5" })))?.error).toMatch(/yourself/);
    const banned = await makeUser({ banned: true });
    current = stranger;
    expect((await submitReview(banned.id, undefined, fd({ rating: "5" })))?.error).toMatch(/not found/i);
    expect(await db.review.count()).toBe(0);
  });
  it("validates rating and comment length", async () => {
    const [seller, buyer] = [await makeUser(), await makeUser()];
    await makeConversation(buyer.id, (await makeListing(seller.id)).id);
    current = buyer;
    expect((await submitReview(seller.id, undefined, fd({ rating: "9" })))?.fieldErrors?.rating).toBeTruthy();
    expect((await submitReview(seller.id, undefined, fd({ rating: "" })))?.fieldErrors?.rating).toBeTruthy();
    expect((await submitReview(seller.id, undefined, fd({ rating: "5", comment: "x".repeat(501) })))?.fieldErrors?.comment).toBeTruthy();
    expect(await db.review.count()).toBe(0);
  });
  it("rate-limits review spam", async () => {
    const [seller, buyer] = [await makeUser(), await makeUser()];
    await makeConversation(buyer.id, (await makeListing(seller.id)).id);
    current = buyer;
    let blocked = 0;
    for (let i = 0; i < 12; i++) if ((await submitReview(seller.id, undefined, fd({ rating: "5" })))?.error?.match(/Too many/)) blocked++;
    expect(blocked).toBe(2);
  });
  it("stores markup as plain text (React escapes it on render)", async () => {
    const [seller, buyer] = [await makeUser(), await makeUser()];
    await makeConversation(buyer.id, (await makeListing(seller.id)).id);
    current = buyer;
    await submitReview(seller.id, undefined, fd({ rating: "5", comment: "<script>alert(1)</script>" }));
    expect((await db.review.findFirstOrThrow()).comment).toBe("<script>alert(1)</script>");
  });
});

describe("deleteReview", () => {
  it("is allowed for the author and admins but not others", async () => {
    const [seller, author, other, admin] = [await makeUser(), await makeUser(), await makeUser(), await makeUser({ role: "ADMIN" })];
    const mk = () => db.review.create({ data: { sellerId: seller.id, reviewerId: author.id, rating: 3 } });
    let r = await mk();
    current = other;
    await deleteReview(fd({ id: r.id }));
    expect(await db.review.count()).toBe(1);
    expect(flashes.at(-1)?.tone).toBe("error");
    current = author;
    await deleteReview(fd({ id: r.id }));
    expect(await db.review.count()).toBe(0);
    r = await mk();
    current = admin;
    await deleteReview(fd({ id: r.id }));
    expect(await db.review.count()).toBe(0);
  });
});

describe("saved searches", () => {
  it("saves a cleaned-up query once, with a readable label", async () => {
    const u = await makeUser();
    current = u;
    const to = await redirectsTo(saveSearch(fd({ query: "type=SCOOTER&city=Pokhara&junk=1&brand=Nokia" })));
    expect(to).toBe("/listings?type=SCOOTER&city=Pokhara");
    await redirectsTo(saveSearch(fd({ query: "city=Pokhara&type=SCOOTER" })));
    const rows = await db.savedSearch.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: u.id, query: "type=SCOOTER&city=Pokhara", label: "Scooter, Pokhara" });
  });
  it("refuses an empty filter set and caps the number per user", async () => {
    const u = await makeUser();
    current = u;
    await redirectsTo(saveSearch(fd({ query: "sort=price_asc" })));
    expect(await db.savedSearch.count()).toBe(0);
    expect(flashes.at(-1)?.tone).toBe("error");
    for (let i = 0; i < 12; i++) await redirectsTo(saveSearch(fd({ query: `maxPrice=${100000 + i}` })));
    expect(await db.savedSearch.count()).toBe(10);
  });
  it("only lets owners remove their own", async () => {
    const [a, b] = [await makeUser(), await makeUser()];
    const s = await db.savedSearch.create({ data: { userId: a.id, label: "x", query: "brand=Honda" } });
    current = b;
    await deleteSavedSearch(fd({ id: s.id }));
    expect(await db.savedSearch.count()).toBe(1);
    current = a;
    await deleteSavedSearch(fd({ id: s.id }));
    expect(await db.savedSearch.count()).toBe(0);
  });
});

describe("featureListing", () => {
  it("is admin only", async () => {
    const seller = await makeUser();
    const l = await makeListing(seller.id);
    current = seller;
    expect(await redirectsTo(featureListing(fd({ id: l.id, days: "7" })))).toBe("/");
    expect((await db.listing.findUniqueOrThrow({ where: { id: l.id } })).featuredUntil).toBeNull();
  });
  it("features a live ad for the chosen number of days, and can undo it", async () => {
    const admin = await makeUser({ role: "ADMIN" });
    const l = await makeListing(admin.id);
    current = admin;
    await featureListing(fd({ id: l.id, days: "14" }));
    const until = (await db.listing.findUniqueOrThrow({ where: { id: l.id } })).featuredUntil!;
    expect(Math.round((until.getTime() - Date.now()) / 86_400_000)).toBe(14);
    await featureListing(fd({ id: l.id, days: "0" }));
    expect((await db.listing.findUniqueOrThrow({ where: { id: l.id } })).featuredUntil).toBeNull();
  });
  it("rejects odd durations and ads that are not live", async () => {
    const admin = await makeUser({ role: "ADMIN" });
    const live = await makeListing(admin.id);
    const pending = await makeListing(admin.id, { status: "PENDING" });
    current = admin;
    await featureListing(fd({ id: live.id, days: "9999" }));
    await featureListing(fd({ id: pending.id, days: "7" }));
    await featureListing(fd({ id: "missing", days: "7" }));
    expect(await db.listing.count({ where: { featuredUntil: { not: null } } })).toBe(0);
    expect(flashes.every((f) => f.tone === "error")).toBe(true);
  });
});

describe("favorites and approval alerts", () => {
  it("remembers the price when a bike is saved", async () => {
    const [seller, buyer] = [await makeUser(), await makeUser()];
    const l = await makeListing(seller.id, { priceNpr: 321000 });
    current = buyer;
    await toggleFavorite(fd({ id: l.id }));
    expect((await db.favorite.findFirstOrThrow()).priceAtSave).toBe(321000);
    await toggleFavorite(fd({ id: l.id }));
    expect(await db.favorite.count()).toBe(0);
  });
  it("approving an ad sends price-drop and saved-search emails afterwards", async () => {
    const [seller, saver, searcher, admin] = [await makeUser(), await makeUser({ email: "saver@test.local" }), await makeUser({ email: "searcher@test.local" }), await makeUser({ role: "ADMIN" })];
    const l = await makeListing(seller.id, { status: "PENDING", priceNpr: 150000, brand: "KTM" });
    await db.favorite.create({ data: { userId: saver.id, listingId: l.id, priceAtSave: 190000 } });
    await db.savedSearch.create({ data: { userId: searcher.id, label: "KTMs", query: "brand=KTM" } });
    current = admin;
    await approveListing(fd({ id: l.id }));
    expect((await db.listing.findUniqueOrThrow({ where: { id: l.id } })).status).toBe("ACTIVE");
    expect(sent).toHaveLength(0); // deferred until after the response
    for (const t of afterTasks) await t();
    expect(sent.map((m) => m.to).sort()).toEqual(["saver@test.local", "searcher@test.local"]);
  });
  it("only admins can approve", async () => {
    const u = await makeUser();
    const l = await makeListing(u.id, { status: "PENDING" });
    current = u;
    expect(await redirectsTo(approveListing(fd({ id: l.id })))).toBe("/");
    expect((await db.listing.findUniqueOrThrow({ where: { id: l.id } })).status).toBe("PENDING");
  });
});
