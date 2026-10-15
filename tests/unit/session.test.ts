import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, { value: string; opts?: Record<string, unknown> }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (k: string) => jar.get(k), set: (k: string, value: string, opts?: Record<string, unknown>) => { jar.set(k, { value, opts }); } }),
}));

import { createSession, getSessionUserId } from "@/lib/session";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);
beforeEach(() => jar.clear());

describe("session", () => {
  it("round-trips a user id through an httpOnly, lax cookie", async () => {
    await createSession("user_1");
    expect(jar.get("session")!.opts).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(await getSessionUserId()).toBe("user_1");
  });
  it("returns null without a cookie", async () => {
    expect(await getSessionUserId()).toBeNull();
  });
  it("rejects tampered, foreign-signed and expired tokens", async () => {
    await createSession("user_1");
    const good = jar.get("session")!.value;
    jar.set("session", { value: good.slice(0, -3) + "abc" });
    expect(await getSessionUserId()).toBeNull();
    const foreign = await new SignJWT({ sub: "admin" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode("another-secret-another-secret-123"));
    jar.set("session", { value: foreign });
    expect(await getSessionUserId()).toBeNull();
    const expired = await new SignJWT({ sub: "user_1" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(Math.floor(Date.now() / 1000) - 10).sign(secret());
    jar.set("session", { value: expired });
    expect(await getSessionUserId()).toBeNull();
    jar.set("session", { value: "garbage" });
    expect(await getSessionUserId()).toBeNull();
  });
  it("rejects unsigned (alg none) tokens", async () => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    jar.set("session", { value: `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "admin" })}.` });
    expect(await getSessionUserId()).toBeNull();
  });
});
