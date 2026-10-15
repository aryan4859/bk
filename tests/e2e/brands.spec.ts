import { expect, test } from "./fixtures";

test.describe("popular brands on the home page", () => {
  test("shows a tile per brand with its logo, and links to that brand's bikes", async ({ page, consoleErrors }) => {
    await page.goto("/");
    const grid = page.locator("section[aria-labelledby=brands]");
    await expect(grid.getByRole("heading", { name: "Popular brands" })).toBeVisible();
    await expect(grid.getByRole("list").first().getByRole("listitem")).toHaveCount(14);
    // every logo file loads
    const logos = grid.locator("img");
    await expect(logos).toHaveCount(12);
    for (const ok of await logos.evaluateAll((is) => is.map((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))) expect(ok).toBe(true);
    // brands without a reliable logo show their name instead of a wrong logo
    await expect(grid.getByRole("link", { name: /^TVS/ }).locator("img")).toHaveCount(0);
    // live counts, and the tile filters the listings
    await expect(grid.getByRole("link", { name: /^Bajaj logo Bajaj 1 for sale$/ })).toBeVisible();
    await grid.getByRole("link", { name: /^Bajaj logo/ }).click();
    await expect(page).toHaveURL(/\/listings\?brand=Bajaj/);
    await expect(page.getByText("Bajaj Pulsar NS200").first()).toBeVisible();
    void consoleErrors;
  });
});
