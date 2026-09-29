import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.responsive.browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? "github" : "line",
  outputDir: "test-results/layout-browser",
  timeout: 20_000,
  expect: { timeout: 5_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3001",
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: "npm run dev:layout-browser",
    url: "http://127.0.0.1:3001/tests/browser/fixtures/city-harness.html",
    // Explicit local opt-in keeps CI isolated while preserving a manual review harness.
    reuseExistingServer: !process.env.CI && process.env.CDIDLE_REUSE_LAYOUT_SERVER === "1",
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
