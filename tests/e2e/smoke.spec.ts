import { expect, fx, loginAs, test } from "./fixtures";

test.describe("public pages", () => {
  for (const path of ["/", "/listings", "/login", "/privacy", "/terms", "/refunds", "/cookies", "/contact", "/compare"]) {
    test(`${path} renders without console errors`, async ({ page, consoleErrors }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("main")).toBeVisible();
      void consoleErrors;
    });
  }

  test("an unknown page gives a 404", async ({ page }) => {
    expect((await page.goto("/no-such-page"))?.status()).toBe(404);
    expect((await page.goto("/listings/does-not-exist"))?.status()).toBe(404);
    expect((await page.goto("/sellers/does-not-exist"))?.status()).toBe(404);
  });

  test("sends security headers", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["strict-transport-security"]).toContain("max-age");
    expect(h["referrer-policy"]).toBeTruthy();
  });

  test("home shows the hero search and live count", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your next bike");
    await expect(page.getByText(/\d+ bikes for sale in \d+ cit(y|ies)/)).toBeVisible();
  });

  test("home search panel: type, brand, model and budget lead to filtered results", async ({ page }) => {
    await page.goto("/");
    const brands = page.locator("#hs-brand");
    const models = page.locator("#hs-model");
    // scooters and motorcycles have their own lists: KTM makes no scooters, Bajaj only the Chetak
    await page.locator("label", { hasText: "Scooters" }).click();
    await expect(brands.locator("option", { hasText: "KTM" })).toHaveCount(0);
    await brands.selectOption("Bajaj");
    await expect(models.locator("option")).toHaveText(["Any scooter", "Chetak"]);
    // motorcycles: the whole range, live ads marked with their count
    await page.locator("label", { hasText: "Motorcycles" }).click();
    await expect(brands).toHaveValue("Bajaj"); // still a motorcycle brand, so it is kept
    await expect(models.locator("option", { hasText: "Dominar 400" })).toHaveCount(1);
    await expect(models.locator("option", { hasText: "Chetak" })).toHaveCount(0);
    await expect(models.locator("option[value='Pulsar NS200']")).toHaveText("Pulsar NS200 (1 for sale)");
    await models.selectOption("Pulsar NS200");
    await page.locator("#hs-budget").selectOption("3l-5l");
    await page.getByRole("button", { name: "Search motorcycles" }).click();
    // empty fields (year) are left out of the address
    await expect(page).toHaveURL(/\/listings\?type=MOTORCYCLE&brand=Bajaj&model=Pulsar\+NS200&budget=3l-5l$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("1 Bajaj bike");
    await expect(page.getByText("Bajaj Pulsar NS200").first()).toBeVisible();
  });

  test("explore by budget shows live counts and opens the matching band", async ({ page }) => {
    await page.goto("/");
    const band = page.locator("section[aria-labelledby=budget]");
    await expect(band.getByRole("listitem")).toHaveCount(5);
    const under1 = band.getByRole("link", { name: /Under Rs 1 lakh/ });
    await expect(under1).toContainText(/1 bike|None right now/); // the Hero Splendor fixture is Rs 90,000 but pending
    await band.getByRole("link", { name: /Rs 2 to 3 lakh/ }).click();
    await expect(page).toHaveURL(/budget=2l-3l/);
    const prices = await page.locator("a[href^='/listings/'] >> text=/^Rs\\./").allTextContents();
    for (const p of prices) { const n = Number(p.replace(/\D/g, "")); expect(n).toBeGreaterThanOrEqual(200000); expect(n).toBeLessThanOrEqual(299999); }
  });
});

test.describe("access control", () => {
  test("anonymous visitors are sent to log in", async ({ page }) => {
    for (const p of ["/saved", "/inbox", "/my", "/sell"]) {
      await page.goto(p);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(p)}`));
    }
  });
  test("anonymous visitors cannot open the admin area", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/);
  });
  test("normal users cannot open the admin area", async ({ page, context }) => {
    await loginAs(context, fx().users.buyer.id);
    for (const p of ["/admin", "/admin/listings", "/admin/users", "/admin/reports"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/$/);
    }
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  });
  test("a pending ad is hidden from the public but visible to its owner", async ({ page, context }) => {
    const { listings, users } = fx();
    expect((await page.goto(`/listings/${listings.pendingHidden.id}`))?.status()).toBe(404);
    await loginAs(context, users.seller.id);
    expect((await page.goto(`/listings/${listings.pendingHidden.id}`))?.status()).toBe(200);
    await expect(page.getByText(/waiting for review/)).toBeVisible();
  });
  test("a tampered session cookie is ignored", async ({ page, context }) => {
    await context.addCookies([{ name: "session", value: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.bad", url: "http://localhost:3100" }]);
    await page.goto("/saved");
    await expect(page).toHaveURL(/\/login/);
  });
});
