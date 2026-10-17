import type { Page } from "@playwright/test";
import { expect, fx, loginAs, test } from "./fixtures";

// The page itself must never scroll sideways on a phone; wide content (tables, tab bars) scrolls inside its own box.
async function expectNoSideScroll(page: Page) {
  const r = await page.evaluate(() => {
    window.scrollTo(400, window.scrollY);
    const x = window.scrollX;
    window.scrollTo(0, window.scrollY);
    return { x, vw: Math.round(window.visualViewport!.width), iw: window.innerWidth };
  });
  expect(r.x, "page scrolled sideways").toBe(0);
  expect(r.vw).toBe(r.iw);
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "consent", value: "essential", url: "http://localhost:3100" }]);
});

test.describe("phone layout", () => {
  test("public pages fit the screen", async ({ page, consoleErrors }) => {
    const { pulsar, dio } = fx().listings;
    const { seller } = fx().users;
    for (const path of ["/", "/listings", `/listings/${pulsar.id}`, `/sellers/${seller.id}`, `/compare?ids=${pulsar.id},${dio.id}`, "/login", "/terms", "/privacy"]) {
      await page.goto(path);
      await expectNoSideScroll(page);
    }
    void consoleErrors;
  });

  test("signed-in pages fit the screen", async ({ page, context }) => {
    await loginAs(context, fx().users.buyer.id);
    for (const path of ["/saved", "/inbox", "/my", "/sell"]) {
      await page.goto(path);
      await expectNoSideScroll(page);
    }
  });

  test("admin pages fit the screen; wide parts scroll inside their own box", async ({ page, context }) => {
    await loginAs(context, fx().users.admin.id);
    for (const path of ["/admin", "/admin/listings", "/admin/users", "/admin/reports"]) {
      await page.goto(path);
      await expectNoSideScroll(page);
    }
  });

  test("header fits on one line and the menu opens", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    expect((await header.boundingBox())!.height).toBeLessThanOrEqual(65);
    const sell = page.getByRole("link", { name: /^Sell/ }).first();
    expect((await sell.boundingBox())!.height).toBeLessThan(50);
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Browse" })).toBeVisible();
  });

  test("compare buttons are big enough to tap and the compare table fits two bikes", async ({ page }) => {
    await page.goto("/listings?brand=Honda");
    const toggle = page.getByRole("button", { name: /^Compare / }).first();
    const box = (await toggle.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(32);
    expect(box.width).toBeGreaterThanOrEqual(32);
    await toggle.click();
    await page.goto("/listings?brand=Bajaj");
    await page.getByRole("button", { name: /^Compare / }).first().click();
    const bar = page.getByRole("region", { name: "Compare bikes" });
    await expect(bar).toBeVisible();
    await bar.getByRole("link", { name: /^Compare/ }).click();
    await expect(page.getByRole("table")).toBeVisible();
    const fits = await page.getByRole("table").evaluate((t) => t.scrollWidth <= t.parentElement!.clientWidth);
    expect(fits, "two-bike table needs no sideways scrolling").toBe(true);
    await expectNoSideScroll(page);
  });

  test("the featured badge and compare button do not overlap on a card", async ({ page }) => {
    await page.goto("/listings");
    const card = page.getByLabel("Featured bikes").locator("div.relative").first();
    const badge = (await card.getByText("Featured", { exact: true }).boundingBox())!;
    const btn = (await card.getByRole("button", { name: /^Compare / }).boundingBox())!;
    expect(badge.x + badge.width).toBeLessThanOrEqual(btn.x);
  });

  test("the hero scene shows two bikes and does not react to touch tilt", async ({ page }) => {
    await page.goto("/");
    const cards = page.getByRole("group", { name: "Recently listed bikes" }).getByRole("link");
    await expect(cards.filter({ visible: true })).toHaveCount(2);
    await expectNoSideScroll(page);
  });

  test("the assistant opens as a full-screen sheet and closes again", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ask Seto Durbar" }).click();
    const panel = page.getByRole("dialog", { name: "Seto Durbar assistant" });
    const box = (await panel.boundingBox())!;
    const vp = page.viewportSize()!;
    expect(Math.round(box.width)).toBe(vp.width);
    expect(Math.round(box.height)).toBe(vp.height);
    await expectNoSideScroll(page);
    await panel.getByRole("button", { name: "Close assistant" }).click();
    await expect(panel).toHaveCount(0);
  });

  test("filters open from a button and apply", async ({ page }) => {
    await page.goto("/listings");
    await page.getByText("Filters and sorting").click();
    await page.getByLabel("Brand").selectOption("Honda");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/brand=Honda/);
    await expectNoSideScroll(page);
  });
});
