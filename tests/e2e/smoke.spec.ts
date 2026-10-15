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
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Used bikes and scooters");
    await expect(page.getByText(/\d+ for sale right now/)).toBeVisible();
  });

  test("home search leads to filtered results", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search").first().fill("pulsar");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/listings\?q=pulsar/);
    await expect(page.getByText("Bajaj Pulsar NS200").first()).toBeVisible();
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
