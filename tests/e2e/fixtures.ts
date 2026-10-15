import { readFileSync } from "node:fs";
import { test as base, expect, type BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";
import { projectEnv } from "../helpers/env";

type Fx = {
  users: Record<"admin" | "seller" | "buyer" | "stranger", { id: string; email: string; name: string }>;
  listings: Record<"pulsar" | "dio" | "featured" | "pending" | "pendingHidden" | "adminOwn" | "deadPhoto", { id: string; title: string }> & { filler: string[] };
};
export const fx = (): Fx => JSON.parse(readFileSync("test-results/fixtures.json", "utf8"));

/** Signs in by minting the same session cookie the OTP flow would set. */
export async function loginAs(context: BrowserContext, userId: string, baseURL = "http://localhost:3100") {
  const secret = process.env.AUTH_SECRET ?? projectEnv().AUTH_SECRET;
  const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(secret));
  await context.addCookies([{ name: "session", value: token, url: baseURL }]);
}

// Fails a test if the page logs console errors or throws (ignores failed image loads from missing seed photos).
export const test = base.extend<{ consoleErrors: string[]; greet: boolean }>({
  // the assistant's hello pops up 5.5 s into a visit; keep it out of tests that are not about it
  greet: [false, { option: true }],
  page: async ({ page, greet }, run) => {
    if (!greet) await page.addInitScript(() => { try { sessionStorage.setItem("assistant-greeted", "1"); } catch {} });
    await run(page);
  },
  consoleErrors: async ({ page }, run) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await run(errors);
    expect(errors, "browser console errors").toEqual([]);
  },
});
export { expect };
