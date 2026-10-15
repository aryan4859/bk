import { expect, fx, loginAs, test } from "./fixtures";

test.describe.serial("seller reviews", () => {
  test("visitors see the reviews area and are asked to log in to write one", async ({ page }) => {
    const { seller } = fx().users;
    await page.goto(`/sellers/${seller.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sam Seller");
    await expect(page.getByText("No reviews yet")).toBeVisible();
    await expect(page.getByText("Nobody has reviewed this seller yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in to leave a review" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bikes for sale" })).toBeVisible();
  });

  test("a user who never contacted the seller cannot review", async ({ page, context }) => {
    const { seller, stranger } = fx().users;
    await loginAs(context, stranger.id);
    await page.goto(`/sellers/${seller.id}`);
    await expect(page.getByText("Message this seller about a bike first")).toBeVisible();
    await expect(page.getByRole("button", { name: "Post review" })).toHaveCount(0);
  });

  test("sellers cannot review themselves", async ({ page, context }) => {
    const { seller } = fx().users;
    await loginAs(context, seller.id);
    await page.goto(`/sellers/${seller.id}`);
    await expect(page.getByText("This is your own profile.")).toBeVisible();
  });

  test("after messaging the seller a buyer can post, see and edit a review", async ({ page, context, consoleErrors }) => {
    const { seller, buyer } = fx().users;
    const { pulsar } = fx().listings;
    await loginAs(context, buyer.id);

    await page.goto(`/listings/${pulsar.id}`);
    await page.getByRole("button", { name: "Message seller" }).click();
    await expect(page).toHaveURL(/\/inbox\//);
    await page.getByLabel("Your message").fill("Hi, can I test ride tomorrow?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("log")).toContainText("Hi, can I test ride tomorrow?");

    await page.goto(`/sellers/${seller.id}`);
    await page.locator("label", { has: page.getByLabel("4 stars", { exact: true }) }).click();
    await page.getByLabel("Comment (optional)").fill("Honest seller. <b>Bike</b> was as described.");
    await page.getByRole("button", { name: "Post review" }).click();
    await expect(page.getByText("Thanks, your review is saved.")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Rated 4.0 out of 5 from 1 review").first()).toBeVisible();
    const list = page.getByRole("region", { name: "Reviews" }).or(page.locator("section[aria-labelledby=reviews]"));
    await expect(list).toContainText("Bea Buyer");
    await expect(list).toContainText("Honest seller. <b>Bike</b> was as described."); // shown as text, not markup
    await expect(list.locator("b")).toHaveCount(0);

    // reviewing again updates instead of duplicating
    await expect(page.getByRole("heading", { name: "Your review" })).toBeVisible();
    await page.locator("label", { has: page.getByLabel("5 stars", { exact: true }) }).click();
    await page.getByRole("button", { name: "Update review" }).click();
    await expect(page.getByText("Thanks, your review is saved.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Rated 5.0 out of 5 from 1 review").first()).toBeVisible();
    void consoleErrors;
  });

  test("the rating shows on the listing page, listing cards and compare table", async ({ page }) => {
    const { pulsar } = fx().listings;
    await page.goto(`/listings/${pulsar.id}`);
    await expect(page.getByLabel("Rated 5.0 out of 5 from 1 review")).toBeVisible();
    await page.goto("/listings?brand=Bajaj");
    await expect(page.getByLabel("Rated 5.0 out of 5 from 1 review")).toBeVisible();
    await page.goto("/");
    await expect(page.getByLabel("Rated 5.0 out of 5 from 1 review").first()).toBeVisible();
  });

  test("an unrelated user cannot delete it, the author can", async ({ page, context, browser }) => {
    const { seller, buyer, stranger } = fx().users;
    const other = await browser.newContext();
    await loginAs(other, stranger.id);
    const p2 = await other.newPage();
    await p2.goto(`/sellers/${seller.id}`);
    await expect(p2.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await other.close();

    await loginAs(context, buyer.id);
    await page.goto(`/sellers/${seller.id}`);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Nobody has reviewed this seller yet.")).toBeVisible();
  });

  test("admins can remove any review", async ({ page, context, browser }) => {
    const { seller, buyer, admin } = fx().users;
    const b = await browser.newContext();
    await loginAs(b, buyer.id);
    const bp = await b.newPage();
    await bp.goto(`/sellers/${seller.id}`);
    await bp.locator("label", { has: bp.getByLabel("1 star", { exact: true }) }).click();
    await bp.getByRole("button", { name: "Post review" }).click();
    await expect(bp.getByText("Thanks, your review is saved.")).toBeVisible();
    await b.close();

    await loginAs(context, admin.id);
    await page.goto(`/sellers/${seller.id}`);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Nobody has reviewed this seller yet.")).toBeVisible();
  });

  test("a review needs a star rating", async ({ page, context }) => {
    const { seller, buyer } = fx().users;
    await loginAs(context, buyer.id);
    await page.goto(`/sellers/${seller.id}`);
    await page.getByRole("button", { name: "Post review" }).click(); // blocked by the required radio group
    await expect(page.getByText("Thanks, your review is saved.")).toHaveCount(0);
    expect(await page.locator("input[name=rating]").first().evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  });
});
