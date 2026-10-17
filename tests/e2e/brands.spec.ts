import { expect, test } from "./fixtures";

test.describe("popular brands on the home page", () => {
  test("shows a tile per brand with its logo, and links to that brand's bikes", async ({ page, consoleErrors }) => {
    await page.goto("/");
    const grid = page.locator("section[aria-labelledby=brands]");
    await expect(grid.getByRole("heading", { name: "Popular brands" })).toBeVisible();
    const popular = grid.getByRole("list").first();
    await expect(popular.getByRole("listitem")).toHaveCount(14);
    // every logo file loads
    const logos = popular.locator("img");
    await expect(logos).toHaveCount(14);
    for (const ok of await logos.evaluateAll((is) => is.map((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))) expect(ok).toBe(true);
    // brands without a logo file show their name instead
    await grid.getByText(/All \d+ brands/).click();
    await expect(grid.getByRole("link", { name: /^Keren/ }).locator("img")).toHaveCount(0);
    await expect(grid.getByRole("link", { name: /^MV Agusta logo MV Agusta/ })).toBeVisible();
    // live counts, and the tile filters the listings
    await expect(grid.getByRole("link", { name: /^Bajaj logo Bajaj 1 for sale$/ })).toBeVisible();
    await grid.getByRole("link", { name: /^Bajaj logo/ }).click();
    await expect(page).toHaveURL(/\/listings\?brand=Bajaj/);
    await expect(page.getByText("Bajaj Pulsar NS200").first()).toBeVisible();
    void consoleErrors;
  });
});
