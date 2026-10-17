import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { expect, fx, loginAs, test } from "./fixtures";

test.describe.serial("selling and chatting", () => {
  let photo: string;
  test.beforeAll(async ({}, info) => {
    mkdirSync(info.project.outputDir, { recursive: true });
    photo = path.join(info.project.outputDir, "bike.jpg");
    await sharp({ create: { width: 800, height: 600, channels: 3, background: "#2a6" } }).jpeg().toFile(photo);
  });

  test("a seller can post an ad, which then waits for review", async ({ page, context, consoleErrors }) => {
    await loginAs(context, fx().users.stranger.id);
    await page.goto("/sell");
    await page.locator("input[type=file]").setInputFiles(photo);
    await page.getByLabel("Brand").selectOption("TVS");
    await page.getByLabel("Model", { exact: true }).selectOption("Apache RTR 160");
    await page.getByLabel("Year (AD)").fill("2020");
    await page.getByLabel("Kilometres driven").fill("15000");
    await page.getByLabel("Lot number").fill("87");
    await page.getByRole("radio", { name: /^Good/ }).check();
    await page.getByLabel("Asking price (Rs.)").fill("240000");
    await page.getByLabel("City").selectOption("Butwal");
    await page.getByLabel("Mobile number buyers can call").fill("9841234567");
    await page.getByLabel("Details", { exact: true }).fill("Single owner, regular servicing, new tyres fitted last month.");
    await page.getByLabel(/I own this bike/).check();
    await page.getByRole("button", { name: /Post|Submit|Publish/ }).click();
    await expect(page).toHaveURL(/\/listings\/.+\?posted=1/);
    await expect(page.getByText("Your ad is posted and waiting for review")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("TVS Apache RTR 160 2020");
    await expect(page.getByText("Good", { exact: true })).toBeVisible();
    await expect(page.getByText("87", { exact: true })).toBeVisible();
    void consoleErrors;
  });

  test("the form shows field errors and keeps what was typed", async ({ page, context }) => {
    await loginAs(context, fx().users.stranger.id);
    await page.goto("/sell");
    await page.locator("input[type=file]").setInputFiles(photo);
    await page.getByLabel("Brand").selectOption("Honda");
    await page.getByLabel("Model", { exact: true }).selectOption("Shine 125");
    await page.getByRole("radio", { name: /^Fair/ }).check();
    await page.getByLabel("City").selectOption("Pokhara");
    await page.getByLabel("Details", { exact: true }).fill("Too short");
    await page.getByLabel(/I own this bike/).check();
    await page.getByRole("button", { name: /Post|Submit|Publish/ }).click();
    await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
    await expect(page.getByText(/at least 20 characters/)).toBeVisible();
    await expect(page.getByLabel("Model", { exact: true })).toHaveValue("Shine 125");
  });

  test("a non-image upload is refused", async ({ page, context }) => {
    await loginAs(context, fx().users.stranger.id);
    await page.goto("/sell");
    await page.locator("input[type=file]").setInputFiles({ name: "evil.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<?php system($_GET['c']); ?>") });
    await page.getByLabel("Brand").selectOption("Honda");
    await page.getByLabel("Model", { exact: true }).selectOption("Shine 125");
    await page.getByLabel("Year (AD)").fill("2020");
    await page.getByLabel("Kilometres driven").fill("1000");
    await page.getByRole("radio", { name: /^Excellent/ }).check();
    await page.getByLabel("Asking price (Rs.)").fill("150000");
    await page.getByLabel("City").selectOption("Pokhara");
    await page.getByLabel("Mobile number buyers can call").fill("9841234567");
    await page.getByLabel("Details", { exact: true }).fill("Runs well, all papers are clear, no accidents.");
    await page.getByLabel(/I own this bike/).check();
    await page.getByRole("button", { name: /Post|Submit|Publish/ }).click();
    await expect(page.getByText(/JPEG, PNG or WebP|could not be read/)).toBeVisible();
  });

  test("buyer and seller can chat and the seller sees an unread badge", async ({ page, context, browser }) => {
    const { seller, buyer } = fx().users;
    const { dio } = fx().listings;
    await loginAs(context, buyer.id);
    await page.goto(`/listings/${dio.id}`);
    await page.getByRole("button", { name: "Message seller" }).click();
    await page.getByLabel("Your message").fill("Is the price negotiable?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("log")).toContainText("Is the price negotiable?");

    const sctx = await browser.newContext();
    await loginAs(sctx, seller.id);
    const sp = await sctx.newPage();
    await sp.goto("/inbox");
    await expect(sp.getByRole("navigation", { name: "Main" }).getByText(/^\d+$/).first()).toBeVisible();
    await sp.getByText("Is the price negotiable?").click();
    await sp.getByLabel("Your message").fill("A little, yes.");
    await sp.getByRole("button", { name: "Send message" }).click();
    await expect(sp.getByRole("log")).toContainText("A little, yes.");
    await sctx.close();
  });

  test("owners can mark an ad sold and it shows as sold", async ({ page, context }) => {
    const { seller } = fx().users;
    const { pulsar } = fx().listings;
    await loginAs(context, seller.id);
    await page.goto(`/listings/${pulsar.id}`);
    await page.getByRole("button", { name: "Mark as sold" }).click();
    await expect(page.getByText("This bike has been sold.")).toBeVisible();
    await page.getByRole("button", { name: "Mark as available" }).click();
    await expect(page.getByText("This bike has been sold.")).toHaveCount(0);
  });

  test("other users cannot edit or delete someone else's ad", async ({ page, context }) => {
    const { dio } = fx().listings;
    await loginAs(context, fx().users.stranger.id);
    await page.goto(`/listings/${dio.id}`);
    await expect(page.getByRole("link", { name: "Edit ad" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete ad" })).toHaveCount(0);
    await page.goto(`/listings/${dio.id}/edit`);
    await expect(page.getByRole("button", { name: /Save/ })).toHaveCount(0);
  });
});
