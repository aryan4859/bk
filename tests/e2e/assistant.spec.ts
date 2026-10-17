import { expect, fx, test } from "./fixtures";

test.describe("Ask Seto Durbar assistant", () => {
  test("opens, answers a site question and closes with Escape", async ({ page, consoleErrors }) => {
    await page.goto("/");
    const open = page.getByRole("button", { name: "Ask Seto Durbar" });
    await open.click();
    const panel = page.getByRole("dialog", { name: "Seto Durbar assistant" });
    await expect(panel).toBeVisible();
    await expect(panel.getByLabel("Your message")).toBeFocused();
    await panel.getByRole("button", { name: "How do I sell my bike here?" }).click();
    await expect(panel.getByRole("log")).toContainText("Posting is free");
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ask Seto Durbar" })).toBeFocused();
    void consoleErrors;
  });

  test("searches real listings and shows them as cards that open the ad", async ({ page }) => {
    const { dio } = fx().listings;
    await page.goto("/listings");
    await page.getByRole("button", { name: "Ask Seto Durbar" }).click();
    const panel = page.getByRole("dialog", { name: "Seto Durbar assistant" });
    await panel.getByLabel("Your message").fill("Any Honda scooters?");
    await panel.getByLabel("Your message").press("Enter");
    await expect(panel.getByRole("log")).toContainText("Honda Dio for Rs. 2,15,000");
    const card = panel.getByRole("list", { name: "Matching bikes" }).getByRole("link").first();
    await expect(card).toContainText("Honda Dio");
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/listings/${dio.id}$`));
  });

  test("keeps the conversation while moving between pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ask Seto Durbar" }).click();
    let panel = page.getByRole("dialog", { name: "Seto Durbar assistant" });
    await panel.getByLabel("Your message").fill("Show me KTM bikes");
    await panel.getByRole("button", { name: "Send" }).click();
    await expect(panel.getByRole("log")).toContainText("KTM Duke 250");
    await page.goto("/listings");
    await page.getByRole("button", { name: "Ask Seto Durbar" }).click();
    panel = page.getByRole("dialog", { name: "Seto Durbar assistant" });
    await expect(panel.getByRole("log")).toContainText("Show me KTM bikes");
  });

  test("shows a friendly error when the model service fails", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ask Seto Durbar" }).click();
    const panel = page.getByRole("dialog", { name: "Seto Durbar assistant" });
    await panel.getByLabel("Your message").fill("please fail");
    await panel.getByRole("button", { name: "Send" }).click();
    await expect(panel.getByRole("log")).toContainText("unavailable right now");
  });

  test.describe("greeting from the chat head", () => {
    test.use({ greet: true });

    test("says hello in Nepali after a few seconds, and opens the chat when tapped", async ({ page }) => {
      await page.clock.install();
      await page.goto("/");
      const hello = page.getByRole("status").filter({ hasText: "नमस्ते! म बाइक दाइ, तपाईंको AI सहायक।" });
      await page.clock.runFor(4000);
      await expect(hello).toHaveCount(0); // not straight away
      await page.clock.runFor(2000);
      await expect(hello).toBeVisible();
      await expect(hello).toContainText("कस्तो बाइक खोज्दै हुनुहुन्छ?");
      await expect(hello).toContainText("बाइक दाइ · AI सहायक");
      await hello.getByRole("button", { name: /नमस्ते/ }).click();
      await expect(page.getByRole("dialog", { name: "Seto Durbar assistant" })).toBeVisible();
      await expect(hello).toHaveCount(0);
    });

    test("can be dismissed, and only greets once per visit", async ({ page }) => {
      await page.clock.install();
      await page.goto("/");
      await page.clock.runFor(6000);
      const hello = page.getByRole("status").filter({ hasText: "नमस्ते" });
      await expect(hello).toBeVisible();
      await hello.getByRole("button", { name: "Dismiss greeting" }).click();
      await expect(hello).toHaveCount(0);
      await page.goto("/listings");
      await page.clock.runFor(8000);
      await expect(page.getByRole("status").filter({ hasText: "नमस्ते" })).toHaveCount(0);
    });

    test("goes away by itself after a while", async ({ page }) => {
      await page.clock.install();
      await page.goto("/");
      await page.clock.runFor(6000);
      await expect(page.getByRole("status").filter({ hasText: "नमस्ते" })).toBeVisible();
      await page.clock.runFor(16000);
      await expect(page.getByRole("status").filter({ hasText: "नमस्ते" })).toHaveCount(0);
    });
  });
});
