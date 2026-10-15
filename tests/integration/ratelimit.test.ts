import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { resetDb } from "../helpers/db";

beforeEach(resetDb);

describe("rateLimit", () => {
  it("allows up to the limit and blocks after", async () => {
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await rateLimit("k1", 3, 60_000));
    expect(results).toEqual([true, true, true, false, false]);
  });
  it("counts each key separately", async () => {
    expect(await rateLimit("a", 1, 60_000)).toBe(true);
    expect(await rateLimit("a", 1, 60_000)).toBe(false);
    expect(await rateLimit("b", 1, 60_000)).toBe(true);
  });
  it("starts a fresh window once the old one has expired", async () => {
    expect(await rateLimit("w", 1, 200)).toBe(true);
    expect(await rateLimit("w", 1, 200)).toBe(false);
    await new Promise((r) => setTimeout(r, 250));
    expect(await rateLimit("w", 1, 200)).toBe(true);
    expect((await db.rateLimit.findUniqueOrThrow({ where: { key: "w" } })).count).toBe(1);
  });
  it("stays correct under concurrent calls", async () => {
    const r = await Promise.all(Array.from({ length: 10 }, () => rateLimit("c", 4, 60_000)));
    expect(r.filter(Boolean)).toHaveLength(4);
  });
});
