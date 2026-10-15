import { expect, fx, test } from "./fixtures";

// Ads whose photo file is gone show a calm tile instead of a broken image.
test.describe("missing photos", () => {
  test("a card shows 'Photo unavailable' instead of a broken image", async ({ page, consoleErrors }) => {
    await page.goto("/listings?brand=Mahindra");
    const card = page.locator("a[href^='/listings/']").filter({ hasText: "Mahindra Mojo" });
    await expect(card.getByRole("img", { name: /photo unavailable/ })).toBeVisible();
    await expect(card.locator("img")).toHaveCount(0);
    void consoleErrors;
  });

  test("the listing page gallery falls back too, and the rest of the page works", async ({ page }) => {
    await page.goto(`/listings/${fx().listings.deadPhoto.id}`);
    await expect(page.getByRole("img", { name: /photo unavailable/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mahindra Mojo with a lost photo");
    await expect(page.getByRole("button", { name: "Message seller" })).toBeVisible();
  });

  test("working photos are unaffected", async ({ page }) => {
    await page.goto(`/listings/${fx().listings.pulsar.id}`);
    const img = page.locator("main img").first();
    await expect(img).toBeVisible();
    expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  });
});
