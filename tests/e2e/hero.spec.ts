import { expect, test } from "./fixtures";

test.describe("home hero 3D scene", () => {
  test("shows recent bikes as links that lead to their ads", async ({ page, consoleErrors }) => {
    await page.goto("/");
    const scene = page.getByRole("group", { name: "Recently listed bikes" });
    const cards = scene.getByRole("link");
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText(/Rs\. [\d,]+/);
    await expect(cards.first()).toHaveAttribute("href", /^\/listings\/[a-z0-9]+$/);
    // the cards bob continuously, so skip Playwright's "wait until it stops moving" check
    await cards.first().click({ force: true });
    await expect(page).toHaveURL(/\/listings\/[a-z0-9]+$/);
    void consoleErrors;
  });

  test("tilts toward the mouse and settles back", async ({ page }) => {
    await page.goto("/");
    const scene = page.locator(".hero-scene");
    await expect(scene).toHaveAttribute("data-live", "1");
    await page.mouse.move(1200, 80, { steps: 4 });
    await expect.poll(async () => Number(await scene.evaluate((e) => e.style.getPropertyValue("--px")))).toBeGreaterThan(0.2);
    expect(Number(await scene.evaluate((e) => e.style.getPropertyValue("--py")))).toBeLessThan(0);
  });

  test("layers shift as the page scrolls", async ({ page }) => {
    await page.goto("/");
    const scene = page.locator(".hero-scene");
    await expect(scene).toHaveAttribute("data-live", "1");
    const before = Number(await scene.evaluate((e) => e.style.getPropertyValue("--sy")));
    await page.evaluate(() => window.scrollTo(0, 250));
    await expect.poll(async () => Number(await scene.evaluate((e) => e.style.getPropertyValue("--sy")))).toBeGreaterThan(before + 100);
  });

  test("stays still for people who prefer reduced motion", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3100/");
    const scene = page.locator(".hero-scene");
    await expect(scene).toBeVisible();
    await page.mouse.move(1200, 80, { steps: 4 });
    await page.evaluate(() => window.scrollTo(0, 250));
    await page.waitForTimeout(400);
    expect(await scene.getAttribute("data-live")).toBeNull();
    expect(await scene.evaluate((e) => [e.style.getPropertyValue("--px"), e.style.getPropertyValue("--sy")])).toEqual(["0", "0"]);
    expect(await page.locator(".hero-float").first().evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
    await ctx.close();
  });
});
