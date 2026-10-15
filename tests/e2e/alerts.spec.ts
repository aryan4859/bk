import { expect, fx, loginAs, test } from "./fixtures";

test.describe.serial("saved-search alerts", () => {
  test("the save button only appears when filters are set", async ({ page }) => {
    await page.goto("/listings");
    await expect(page.getByRole("button", { name: /Email me new matches|Log in to get alerts/ })).toHaveCount(0);
    await page.goto("/listings?brand=Yamaha");
    await expect(page.getByRole("button", { name: "Log in to get alerts" })).toBeVisible();
  });

  test("anonymous visitors are sent to log in", async ({ page }) => {
    await page.goto("/listings?brand=Yamaha");
    await page.getByRole("button", { name: "Log in to get alerts" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("a logged-in buyer can save, list and remove a search", async ({ page, context, consoleErrors }) => {
    await loginAs(context, fx().users.buyer.id);
    await page.goto("/listings?brand=Yamaha&city=Pokhara&maxPrice=300000&sort=price_asc&page=1");
    await page.getByRole("button", { name: "Email me new matches" }).click();
    await expect(page.getByText("Search saved.")).toBeVisible();
    await expect(page).toHaveURL(/brand=Yamaha/);

    await page.goto("/saved");
    const alerts = page.locator("section[aria-labelledby=alerts]");
    await expect(alerts.getByRole("link", { name: "Yamaha, Pokhara, under Rs. 300000" })).toBeVisible();
    await alerts.getByRole("link", { name: /Yamaha, Pokhara/ }).click();
    await expect(page).toHaveURL(/brand=Yamaha&city=Pokhara&maxPrice=300000/);

    // saving the same filters twice does not duplicate
    await page.getByRole("button", { name: "Email me new matches" }).click();
    await page.goto("/saved");
    await expect(alerts.getByRole("link", { name: /Yamaha, Pokhara/ })).toHaveCount(1);

    page.once("dialog", (d) => d.accept());
    await alerts.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText(/No saved searches/)).toBeVisible();
    void consoleErrors;
  });

  test("saving a bike appears under Saved with its price remembered", async ({ page, context }) => {
    const { pulsar } = fx().listings;
    await loginAs(context, fx().users.buyer.id);
    await page.goto(`/listings/${pulsar.id}`);
    await page.getByRole("button", { name: "Save this bike" }).click();
    await expect(page.getByRole("button", { name: "Remove from saved" })).toBeVisible();
    await page.goto("/saved");
    await expect(page.getByText("Bajaj Pulsar NS200")).toBeVisible();
    await page.goto(`/listings/${pulsar.id}`);
    await page.getByRole("button", { name: "Remove from saved" }).click();
    await expect(page.getByRole("button", { name: "Save this bike" })).toBeVisible();
  });
});
