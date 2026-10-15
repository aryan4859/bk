import { jwtVerify } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
let ip = "10.0.0.1";
const mails: { to: string; text: string }[] = [];
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined), set: (k: string, v: string) => { jar.set(k, v); }, delete: (k: string) => { jar.delete(k); } }),
  headers: async () => new Headers({ "x-forwarded-for": ip }),
}));
vi.mock("@/lib/mail", () => ({ sendMail: vi.fn(async (to: string, _s: string, text: string) => { mails.push({ to, text }); }) }));

import { POST as verify } from "@/app/api/auth/verify-otp/route";
import { POST as requestOtp } from "@/app/api/auth/request-otp/route";
import { db } from "@/lib/db";
import { makeUser, resetDb } from "../helpers/db";

const post = (handler: (r: Request) => Promise<Response>, body: unknown) =>
  handler(new Request("http://x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }));
const lastCode = () => /code is (\d{6})/.exec(mails.at(-1)!.text)![1];

beforeEach(async () => {
  await resetDb();
  jar.clear(); mails.length = 0; ip = "10.0.0." + Math.floor(Math.random() * 200);
  delete process.env.ADMIN_EMAILS;
});

describe("request-otp", () => {
  it("rejects bad email, missing consent and bad JSON", async () => {
    expect((await post(requestOtp, { email: "nope", consent: true })).status).toBe(400);
    expect((await post(requestOtp, { email: "a@b.com" })).status).toBe(400);
    expect((await requestOtp(new Request("http://x", { method: "POST", body: "{" }))).status).toBe(400);
    expect(mails).toHaveLength(0);
  });
  it("emails a six digit code and stores only its hash", async () => {
    expect((await post(requestOtp, { email: "Rider@Test.local", consent: true })).status).toBe(200);
    expect(mails[0].to).toBe("rider@test.local");
    const stored = await db.otp.findFirstOrThrow();
    expect(stored.codeHash).not.toContain(lastCode());
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
  it("makes people wait a minute between codes", async () => {
    await post(requestOtp, { email: "a@test.local", consent: true });
    expect((await post(requestOtp, { email: "a@test.local", consent: true })).status).toBe(429);
  });
  it("limits requests per IP", async () => {
    let last = 200;
    for (let i = 0; i < 12; i++) last = (await post(requestOtp, { email: `u${i}@test.local`, consent: true })).status;
    expect(last).toBe(429);
  });
});

describe("verify-otp", () => {
  const login = async (email = "rider@test.local") => { await post(requestOtp, { email, consent: true }); return lastCode(); };

  it("logs in with the right code, creates the user and sets a signed session", async () => {
    const code = await login();
    const res = await post(verify, { email: "rider@test.local", code });
    expect(res.status).toBe(200);
    const user = await db.user.findUniqueOrThrow({ where: { email: "rider@test.local" } });
    expect(user.role).toBe("USER");
    const { payload } = await jwtVerify(jar.get("session")!, new TextEncoder().encode(process.env.AUTH_SECRET));
    expect(payload.sub).toBe(user.id);
    expect(await db.otp.count()).toBe(0); // single use
  });
  it("rejects a wrong code and locks out after five tries", async () => {
    const code = await login();
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) expect((await post(verify, { email: "rider@test.local", code: wrong })).status).toBe(400);
    expect((await post(verify, { email: "rider@test.local", code })).status).toBe(400);
    expect(jar.has("session")).toBe(false);
  });
  it("rejects expired codes and codes that were never requested", async () => {
    const code = await login();
    await db.otp.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await post(verify, { email: "rider@test.local", code })).status).toBe(400);
    expect((await post(verify, { email: "ghost@test.local", code: "123456" })).status).toBe(400);
  });
  it("rejects malformed input", async () => {
    expect((await post(verify, { email: "rider@test.local", code: "12" })).status).toBe(400);
    expect((await post(verify, { email: "x", code: "123456" })).status).toBe(400);
  });
  it("blocks suspended accounts", async () => {
    await makeUser({ email: "banned@test.local", banned: true });
    const code = await login("banned@test.local");
    expect((await post(verify, { email: "banned@test.local", code })).status).toBe(403);
    expect(jar.has("session")).toBe(false);
  });
  it("makes emails listed in ADMIN_EMAILS admins", async () => {
    process.env.ADMIN_EMAILS = "boss@test.local, other@test.local";
    const code = await login("boss@test.local");
    await post(verify, { email: "boss@test.local", code });
    expect((await db.user.findUniqueOrThrow({ where: { email: "boss@test.local" } })).role).toBe("ADMIN");
  });
});
