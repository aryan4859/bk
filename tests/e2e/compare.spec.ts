import { expect, fx, test } from "./fixtures";

test.describe("compare bikes", () => {
  test("select two bikes, open the table and see the best values highlighted", async ({ page, consoleErrors }) => {
    await page.goto("/listings?brand=Bajaj");
    await page.getByRole("button", { name: /^Compare / }).first().click();
    const bar = page.getByRole("region", { name: "Compare bikes" });
    await expect(bar).toContainText("1 bike selected");
    await expect(bar.locator("[aria-disabled=true]")).toContainText("Compare now");

    await page.goto("/listings?brand=Honda");
    await page.getByRole("button", { name: /^Compare / }).first().click(); // selection survives navigation
    await expect(bar).toContainText("2 bikes selected");
    await bar.getByRole("link", { name: "Compare now" }).click();

    await expect(page).toHaveURL(/\/compare\?ids=/);
    const table = page.getByRole("table");
    await expect(table).toContainText("Bajaj Pulsar NS200");
    await expect(table).toContainText("Honda Dio");
    const priceRow = table.getByRole("row", { name: /^Price/ });
    await expect(priceRow.getByRole("cell").filter({ hasText: "Rs. 2,15,000" })).toContainText("(best)"); // Dio is cheaper
    await expect(priceRow.getByRole("cell").filter({ hasText: "Rs. 3,10,000" })).not.toContainText("(best)");
    await expect(table.getByRole("row", { name: /^Driven/ }).getByRole("cell").filter({ hasText: "4,000 km" })).toContainText("(best)");
    void consoleErrors;
  });

  test("a third bike is allowed, a fourth is blocked, and clear empties the bar", async ({ page }) => {
    await page.goto("/listings");
    const toggles = page.getByRole("button", { name: /^Compare / });
    for (let i = 0; i < 3; i++) await toggles.nth(i).click();
    const bar = page.getByRole("region", { name: "Compare bikes" });
    await expect(bar).toContainText("3 bikes selected");
    await expect(page.locator("button[aria-pressed=false]").first()).toBeDisabled();
    await bar.getByRole("button", { name: "Clear" }).click();
    await expect(bar).toHaveCount(0);
  });

  test("toggling off removes a bike and the listing page has its own toggle", async ({ page }) => {
    const { pulsar } = fx().listings;
    await page.goto(`/listings/${pulsar.id}`);
    const toggle = page.getByRole("button", { name: /^Compare / });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("region", { name: "Compare bikes" })).toContainText("1 bike selected");
    await toggle.click();
    await expect(page.getByRole("region", { name: "Compare bikes" })).toHaveCount(0);
  });

  test("the compare page handles missing, junk and non-public ids", async ({ page }) => {
    const { pendingHidden: pending, pulsar } = fx().listings;
    await page.goto("/compare");
    await expect(page.getByText("Pick at least two bikes")).toBeVisible();
    await page.goto("/compare?ids=../../etc/passwd,<script>alert(1)</script>");
    await expect(page.getByText("Pick at least two bikes")).toBeVisible();
    await page.goto(`/compare?ids=${pending.id},${pulsar.id}`); // pending ad is not shown
    await expect(page.getByText("Pick at least two bikes")).toBeVisible();
    await expect(page.getByText("Suzuki Gixxer")).toHaveCount(0);
  });
});
