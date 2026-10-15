import { expect, fx, test } from "./fixtures";

test.describe("browse and filters", () => {
  test("featured ads are pinned above the results on page one only", async ({ page, consoleErrors }) => {
    await page.goto("/listings");
    const featured = page.getByLabel("Featured bikes");
    await expect(featured).toBeVisible();
    await expect(featured.getByText("KTM Duke 250")).toBeVisible();
    await expect(featured.getByText("Featured", { exact: true }).first()).toBeVisible();
    // the same ad is not repeated in the main grid
    await expect(page.getByRole("link", { name: /KTM Duke 250/ })).toHaveCount(1);
    await page.goto("/listings?page=2");
    await expect(page.getByLabel("Featured bikes")).toHaveCount(0);
    void consoleErrors;
  });

  test("filtering by brand, city and price narrows results", async ({ page }) => {
    await page.goto("/listings");
    await page.getByLabel("Brand").selectOption("Honda");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/brand=Honda/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("1 Honda bike");
    await expect(page.getByText("Honda Dio")).toBeVisible();

    await page.goto("/listings?city=Pokhara&maxPrice=215000&type=SCOOTER");
    await expect(page.getByText("Honda Dio")).toBeVisible();
    await expect(page.getByText("Yamaha FZ")).toHaveCount(0);
  });

  test("an empty result shows a helpful message", async ({ page }) => {
    await page.goto("/listings?q=zzzz-nothing-matches");
    await expect(page.getByText("No bikes match these filters")).toBeVisible();
  });

  test("sorting by price works", async ({ page }) => {
    await page.goto("/listings?sort=price_asc&brand=Yamaha");
    const prices = await page.locator("a[href^='/listings/'] >> text=/^Rs\\./").allTextContents();
    const nums = prices.map((p) => Number(p.replace(/\D/g, "")));
    expect(nums.length).toBeGreaterThan(3);
    expect([...nums].sort((a, b) => a - b)).toEqual(nums);
  });

  test("pagination moves between pages without repeating ads", async ({ page }) => {
    await page.goto("/listings");
    const first = await page.locator("a[href^='/listings/']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")));
    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);
    const second = await page.locator("a[href^='/listings/']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")));
    expect(second.length).toBeGreaterThan(0);
    expect(first.filter((h) => second.includes(h) && !h!.includes("page"))).toEqual([]);
    await page.getByRole("link", { name: "Previous" }).click();
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("a listing page shows specs, price and contact options", async ({ page, consoleErrors }) => {
    const { pulsar } = fx().listings;
    await page.goto(`/listings/${pulsar.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(pulsar.title);
    await expect(page.getByText("Rs. 3,10,000")).toBeVisible();
    await expect(page.getByRole("button", { name: "Message seller" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in to see phone number" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sam Seller" })).toBeVisible();
    void consoleErrors;
  });
});
