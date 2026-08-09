import { expect, test, type Page } from "@playwright/test";
import {
  createLocalTestToken,
  requireLocalSupabaseRuntime,
} from "../../scripts/local-supabase-test-runtime.mjs";

const localSupabase = requireLocalSupabaseRuntime();
const gameApiBaseUrl = `${localSupabase.apiUrl}/functions/v1/game-api`;
const browserTestEmail = "local@example.test";
let accessToken = "";

function sanitizeDiagnostic(value: string): string {
  return [accessToken, localSupabase.anonKey, localSupabase.serviceRoleKey, localSupabase.jwtSecret]
    .filter(Boolean)
    .reduce((sanitized, secret) => sanitized.replaceAll(secret, "[redacted]"), value)
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]")
    .slice(0, 500);
}

function localAdminHeaders(): Record<string, string> {
  return {
    apikey: localSupabase.serviceRoleKey,
    authorization: `Bearer ${localSupabase.serviceRoleKey}`,
    "content-type": "application/json",
  };
}

async function provisionBrowserIdentity(): Promise<string> {
  const response = await fetch(`${localSupabase.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: localAdminHeaders(),
    body: JSON.stringify({
      email: browserTestEmail,
      email_confirm: true,
      app_metadata: { provider: "google", providers: ["google"] },
    }),
  });
  const user = await response.json().catch(() => null) as { id?: unknown } | null;
  if (!response.ok || typeof user?.id !== "string") {
    throw new Error(`local browser identity creation failed: HTTP ${response.status}`);
  }
  return user.id;
}

async function deleteBrowserIdentity(userId: string): Promise<void> {
  const userDeletion = await fetch(
    `${localSupabase.apiUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE", headers: localAdminHeaders() },
  );
  if (!userDeletion.ok && userDeletion.status !== 404) {
    throw new Error(`local browser identity cleanup failed: HTTP ${userDeletion.status}`);
  }
}

async function resetTechnicalGame(token: string): Promise<void> {
  const bootstrap = await fetch(`${gameApiBaseUrl}/bootstrap`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  if (!bootstrap.ok) {
    const body = await bootstrap.json().catch(() => null);
    throw new Error(`local game-api bootstrap failed: HTTP ${bootstrap.status} ${JSON.stringify(body)}`);
  }
  const response = await fetch(`${gameApiBaseUrl}/reset`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(`local game-api reset failed: HTTP ${response.status} ${JSON.stringify(body)}`);
  }
}

async function executeCommandThroughUi(page: Page, action: () => Promise<void>): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => candidate.url().endsWith("/game-api/commands")
      && candidate.request().method() === "POST", { timeout: 15_000 }),
    action(),
  ]);
  expect(response.status(), `command failed with HTTP ${response.status()}`).toBe(200);
}

test("persists one real browser command and restores state after a visible backend failure", async ({ page }, testInfo) => {
  const diagnostics: string[] = [];
  const unexpectedConsole: string[] = [];
  const unexpectedResponses: string[] = [];
  let expectedBackendFailure = false;
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const entry = `console:error ${sanitizeDiagnostic(message.text())}`;
    diagnostics.push(entry);
    if (!(expectedBackendFailure
      && message.text().startsWith("Failed to load resource: the server responded with a status of 503"))) {
      unexpectedConsole.push(entry);
    }
  });
  page.on("pageerror", (error) => {
    const entry = `page:error ${sanitizeDiagnostic(error.message)}`;
    diagnostics.push(entry);
    unexpectedConsole.push(entry);
  });
  page.on("requestfailed", (request) => {
    diagnostics.push(`request:failed ${request.method()} ${new URL(request.url()).pathname}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const entry = `response:${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`;
    diagnostics.push(entry);
    if (!(response.status() === 503 && response.url().endsWith("/game-api/commands"))) {
      unexpectedResponses.push(entry);
    }
  });

  let browserUserId: string | undefined;
  let scenarioError: unknown;
  let cleanupError: unknown;
  try {
    browserUserId = await provisionBrowserIdentity();
    accessToken = createLocalTestToken(
      localSupabase.jwtSecret,
      localSupabase.expectedIssuer,
      browserUserId,
    );
    await resetTechnicalGame(accessToken);
    await page.goto("/");
    await page.evaluate(async ({ token }) => {
      const modulePath = "/src/lib/supabase.ts";
      const { supabase } = await import(/* @vite-ignore */ modulePath);
      const { error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: "local-browser-smoke-no-refresh",
      });
      if (error) throw new Error(error.message);
    }, { token: accessToken });
    await page.reload();

    await expect(page.getByTestId("onboarding-stage")).toBeVisible({ timeout: 15_000 });
    const cityNameInput = page.getByLabel("Nom de la Cité ralliée");
    await cityNameInput.fill("Cité Smoke CDI-084");
    const foundCityButton = page.getByRole("button", { name: "Fonder la Cité", exact: true });
    await expect(foundCityButton).toBeEnabled({ timeout: 15_000 });
    await executeCommandThroughUi(
      page,
      () => foundCityButton.click(),
    );
    await expect(page.getByText("Choisissez vos Fondateurs")).toBeVisible();
    await expect(page.getByTestId("onboarding-stage").locator('[id^="hero-portrait-"]')).toHaveCount(5);
    const candidates = page.getByRole("button", { name: /^Sélectionner / });
    await expect(candidates).toHaveCount(5);
    await candidates.nth(0).click();
    await candidates.nth(1).click();
    await executeCommandThroughUi(
      page,
      () => page.getByRole("button", { name: /Fonder la Cité et commencer/i }).click({ timeout: 8_000 }),
    );

    await page.getByRole("button", { name: /Cité$/ }).click();
    let farm = page.getByTestId("building-ferme");
    await expect(farm.getByText("Non bâti")).toBeVisible();
    await farm.click();
    await executeCommandThroughUi(page, () => page.getByTestId("selected-building-panel").getByRole("button", { name: "Bâtir" }).click());
    await expect(farm.getByText(/Niv\. 1\//)).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: /Cité$/ }).click();
    farm = page.getByTestId("building-ferme");
    await expect(farm.getByText(/Niv\. 1\//)).toBeVisible();

    await page.route("**/functions/v1/game-api/commands", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "SERVICE_UNAVAILABLE", message: "service unavailable", requestId: "browser-smoke" },
        }),
      });
    }, { times: 1 });
    expectedBackendFailure = true;
    await farm.click();
    await page.getByTestId("selected-building-panel").getByRole("button", { name: "Améliorer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Service indisponible" })).toContainText(
      "l’action a été annulée et le dernier état confirmé a été restauré.",
    );
    await expect(farm.getByText(/Niv\. 1\//)).toBeVisible();

    expect(unexpectedConsole).toEqual([]);
    expect(unexpectedResponses).toEqual([]);
  } catch (error) {
    scenarioError = error;
  } finally {
    if (browserUserId) {
      try {
        await deleteBrowserIdentity(browserUserId);
      } catch (error) {
        diagnostics.push(`cleanup:error ${sanitizeDiagnostic(error instanceof Error ? error.message : String(error))}`);
        cleanupError = error;
      }
    }
    await testInfo.attach("sanitized-browser-diagnostics", {
      body: Buffer.from(diagnostics.length > 0 ? diagnostics.join("\n") : "No browser diagnostics."),
      contentType: "text/plain",
    });
  }
  if (scenarioError) throw scenarioError;
  if (cleanupError) throw cleanupError;
});
