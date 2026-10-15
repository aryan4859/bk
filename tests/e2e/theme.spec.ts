import { expect, test } from "./fixtures";

const bg = (page: import("@playwright/test").Page) => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
const DARK = "rgb(24, 23, 21)";   // #181715
const LIGHT = "rgb(250, 249, 245)"; // #faf9f5

test.describe("dark mode", () => {
  test("follows the device setting", async ({ browser }) => {
    for (const [scheme, want] of [["dark", DARK], ["light", LIGHT]] as const) {
      const ctx = await browser.newContext({ colorScheme: scheme });
      const page = await ctx.newPage();
      await page.goto("http://localhost:3100/");
      expect(await bg(page)).toBe(want);
      await ctx.close();
    }
  });

  test("the header switch overrides it, survives a reload and can go back to the device setting", async ({ page, consoleErrors }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    expect(await bg(page)).toBe(DARK);
    // the saved choice is applied before the page paints, not after hydration
    await page.reload({ waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    expect(await bg(page)).toBe(DARK);
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    expect(await bg(page)).toBe(LIGHT);
    expect(await page.evaluate(() => [document.documentElement.dataset.theme ?? null, localStorage.getItem("theme")])).toEqual([null, null]);
    void consoleErrors;
  });

  test("text on coral stays dark ink in both themes", async ({ page }) => {
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const sell = page.getByRole("banner").getByRole("link", { name: /^Sell/ });
      expect(await sell.evaluate((e) => getComputedStyle(e).color)).toBe("rgb(20, 20, 19)");
    }
  });
});
