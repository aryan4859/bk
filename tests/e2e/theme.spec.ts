import { expect, test } from "./fixtures";

const bg = (page: import("@playwright/test").Page) => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
const DARK = "rgb(23, 21, 19)";     // #171513
const LIGHT = "rgb(247, 244, 238)"; // #f7f4ee

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

  test("the primary button is rhododendron red in both themes, with readable text", async ({ page }) => {
    for (const [scheme, fill, text] of [["light", "rgb(184, 50, 42)", "rgb(255, 255, 255)"], ["dark", "rgb(224, 100, 90)", "rgb(23, 21, 19)"]] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const sell = page.getByRole("banner").getByRole("link", { name: /^Sell/ });
      expect(await sell.evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color])).toEqual([fill, text]);
    }
  });
});
