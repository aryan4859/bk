import { expect, test } from "./fixtures";

test.describe("footer wordmark", () => {
  test("draws itself letter by letter when the footer comes into view, then stays solid", async ({ page, consoleErrors }) => {
    await page.goto("/");
    const mark = page.locator("footer svg.wordmark");
    await expect(mark.locator("path")).toHaveCount(6);
    await expect(mark).toHaveAttribute("data-state", "hidden"); // waiting below the fold
    await mark.scrollIntoViewIfNeeded();
    await expect(mark).toHaveAttribute("data-state", "drawing");
    await expect(mark).toHaveAttribute("data-state", "drawn", { timeout: 5000 });
    const last = mark.locator("path").last();
    expect(await last.evaluate((p) => getComputedStyle(p).fillOpacity)).toBe("1");
    expect(await last.evaluate((p) => getComputedStyle(p).strokeDashoffset)).toMatch(/^0(px)?$/);
    void consoleErrors;
  });

  test("is simply solid for people who prefer reduced motion", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3100/");
    const mark = page.locator("footer svg.wordmark");
    await mark.scrollIntoViewIfNeeded();
    expect(await mark.getAttribute("data-state")).toBeNull();
    expect(await mark.locator("path").first().evaluate((p) => getComputedStyle(p).fillOpacity)).toBe("1");
    await ctx.close();
  });
});
