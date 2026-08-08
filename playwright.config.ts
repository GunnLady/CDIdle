import { defineConfig, devices } from "@playwright/test";
import { requireLocalSupabaseRuntime } from "./scripts/local-supabase-test-runtime.mjs";

const localSupabase = requireLocalSupabaseRuntime();

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.browser.spec.ts",
  testIgnore: "**/*.responsive.browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "line",
  outputDir: "test-results/browser",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3000",
    screenshot: "only-on-failure",
    // Traces can retain Authorization headers. The sanitized diagnostic
    // attachment and failure screenshot deliberately replace them here.
    trace: "off",
  },
  webServer: {
    command: "npm run dev:browser",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      VITE_SUPABASE_URL: localSupabase.apiUrl,
      VITE_SUPABASE_ANON_KEY: localSupabase.anonKey,
      DISABLE_HMR: "true",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
