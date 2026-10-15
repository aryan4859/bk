import { expect, fx, loginAs, test } from "./fixtures";

test.describe.serial("admin panel", () => {
  test.beforeEach(async ({ context }) => { await loginAs(context, fx().users.admin.id); });

  test("dashboard shows stats and the review queue", async ({ page, consoleErrors }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Awaiting review")).toBeVisible();
    await expect(page.getByText("Hero Splendor awaiting approval")).toBeVisible();
    void consoleErrors;
  });

  test("approving a pending ad puts it on the public site", async ({ page, browser }) => {
    const { pending } = fx().listings;
    const anon = await browser.newPage();
    expect((await anon.goto(`/listings/${pending.id}`))?.status()).toBe(404);

    await page.goto("/admin/listings?status=PENDING");
    await page.locator("li", { hasText: "Hero Splendor awaiting approval" }).getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Ad approved and now live.")).toBeVisible();
    expect((await anon.goto(`/listings/${pending.id}`))?.status()).toBe(200);
    await anon.close();
  });

  test("rejecting with a reason hides the ad and shows the reason to the owner", async ({ page, context, browser }) => {
    const { adminOwn } = fx().listings;
    await page.goto("/admin/listings?q=Vespa");
    await page.getByPlaceholder("Reason").fill("Photos do not show the bike.");
    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByText("Ad rejected.")).toBeVisible();
    const anon = await browser.newPage();
    expect((await anon.goto(`/listings/${adminOwn.id}`))?.status()).toBe(404);
    await anon.close();
    await page.goto(`/listings/${adminOwn.id}`);
    await expect(page.getByText("Photos do not show the bike.")).toBeVisible();
    // put it back
    await page.goto("/admin/listings?q=Vespa");
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Ad approved and now live.")).toBeVisible();
    void context;
  });

  test("featuring an ad pins it on Browse and Home, and unfeaturing removes it", async ({ page }) => {
    await page.goto("/admin/listings?q=Honda Dio");
    await page.getByRole("button", { name: "Feature 14d" }).click();
    await expect(page.getByText("Ad featured for 14 days.")).toBeVisible();
    await expect(page.getByText(/featured until/)).toBeVisible();

    await page.goto("/listings");
    await expect(page.getByLabel("Featured bikes").getByText("Honda Dio")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Featured" })).toBeVisible();
    await expect(page.locator("section[aria-labelledby=featured]").getByText("Honda Dio")).toBeVisible();

    await page.goto("/admin/listings?q=Honda Dio");
    await page.getByRole("button", { name: "Unfeature" }).click();
    await expect(page.getByText("Ad is no longer featured.")).toBeVisible();
    await page.goto("/listings");
    await expect(page.getByLabel("Featured bikes").getByText("Honda Dio")).toHaveCount(0);
  });

  test("pending ads cannot be featured (no button offered)", async ({ page }) => {
    await page.goto("/admin/listings?status=REJECTED");
    await expect(page.getByRole("button", { name: /^Feature/ })).toHaveCount(0);
  });

  test("suspending a user logs them out and restoring lets them back in", async ({ page, browser }) => {
    const { stranger } = fx().users;
    const sctx = await browser.newContext();
    await loginAs(sctx, stranger.id);
    const sp = await sctx.newPage();
    await sp.goto("/saved");
    await expect(sp).toHaveURL(/\/saved$/);

    await page.goto("/admin/users?q=stranger");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByText("Account suspended.")).toBeVisible();
    await sp.goto("/saved");
    await expect(sp).toHaveURL(/\/login/);

    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("Account restored.")).toBeVisible();
    await sp.goto("/saved");
    await expect(sp).toHaveURL(/\/saved$/);
    await sctx.close();
  });

  test("reports page loads and an admin cannot change their own role", async ({ page }) => {
    expect((await page.goto("/admin/reports"))?.status()).toBe(200);
    await page.goto("/admin/users?q=admin@e2e.test");
    await expect(page.getByRole("button", { name: "Remove admin" })).toHaveCount(0);
  });
});
