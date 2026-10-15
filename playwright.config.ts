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
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/cookies`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATABASE_URL: testDatabaseUrl(),
      AUTH_SECRET: process.env.AUTH_SECRET ?? projectEnv().AUTH_SECRET ?? "",
      GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", GOOGLE_REFRESH_TOKEN: "", GMAIL_SENDER: "",
      SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
