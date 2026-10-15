import { defineConfig, devices } from "@playwright/test";
import { projectEnv, testDatabaseUrl } from "./tests/helpers/env";

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  workers: 1, // the specs share one database and mutate it
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  // artifacts go in their own folder: Playwright empties it on every run, and test-results/ also holds the vitest and perf JSON
  outputDir: "test-results/playwright-artifacts",
  reporter: [["list"], ["json", { outputFile: "test-results/playwright.json" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    // phone-sized Chromium for the responsive checks
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  // Production build against the test database, with mail forced to the console so no real email is ever sent.
  webServer: [{
    // scripted stand-in for OpenRouter so the assistant can be tested without a key or cost
    command: "node tests/e2e/mock-openrouter.mjs",
    url: "http://localhost:3199/",
    reuseExistingServer: !process.env.CI,
  }, {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/cookies`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATABASE_URL: testDatabaseUrl(),
      AUTH_SECRET: process.env.AUTH_SECRET ?? projectEnv().AUTH_SECRET ?? "",
      GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", GOOGLE_REFRESH_TOKEN: "", GMAIL_SENDER: "",
      // photos go to the local disk, never to the real R2 bucket
      R2_ACCOUNT_ID: "", R2_ACCESS_KEY_ID: "", R2_SECRET_ACCESS_KEY: "", R2_BUCKET: "", R2_PUBLIC_URL: "",
      OPENROUTER_API_KEY: "e2e-test", OPENROUTER_BASE_URL: "http://localhost:3199/api/v1",
      SITE_URL: `http://localhost:${PORT}`,
    },
  }],
});
