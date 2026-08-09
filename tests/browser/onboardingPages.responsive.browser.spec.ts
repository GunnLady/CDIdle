import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "desktop-wide", width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`keeps Authentication usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/onboarding-harness.html?step=auth");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: /Google/i }).click();
    await expect(page.getByTestId("mutation-count")).toHaveText("1");
  });

  test(`keeps City creation usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/onboarding-harness.html?step=city");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.getByLabel("Nom de la Cité ralliée").fill("Valbois");
    await page.getByRole("button", { name: "Fonder la Cité" }).click();
    await expect(page.getByTestId("mutation-count")).toHaveText("1");
  });

  test(`keeps founder selection usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/onboarding-harness.html?step=founders");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await expect(page.getByRole("button", { name: /^Sélectionner / })).toHaveCount(5);
    await page.getByRole("button", { name: "Sélectionner Novice 1" }).click();
    await page.getByRole("button", { name: "Sélectionner Novice 2" }).click();
    await page.getByLabel("Nom de Novice 1").click();
    await page.getByLabel("Nom de Novice 1").fill("Ariane");
    await expect(page.getByText("Sélectionné : 2 / 2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Désélectionner Ariane" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Fonder la Cité et commencer/i }).click();
    await expect(page.getByTestId("mutation-count")).toHaveText("1");
  });

  test(`keeps recruitment usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/onboarding-harness.html?step=recruit");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.getByLabel("Prénom de l'aventurier").fill("Ariane");
    await page.getByRole("button", { name: /SCELLER/ }).click();
    await expect(page.getByTestId("mutation-count")).toHaveText("1");
  });
}

test("keeps local onboarding fields usable while canonical commands are read-only", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/onboarding-harness.html?step=city&readonly=1");
  await page.getByLabel("Nom de la Cité ralliée").fill("Valbois");
  await expect(page.getByLabel("Nom de la Cité ralliée")).toHaveValue("Valbois");
  await expect(page.getByRole("button", { name: "Fonder la Cité" })).toBeDisabled();
  await expect(page.getByTestId("mutation-count")).toHaveText("0");
});

test("keeps founder fields local while canonical confirmation is read-only", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/onboarding-harness.html?step=founders&readonly=1");
  await page.getByRole("button", { name: "Sélectionner Novice 1" }).click();
  await page.getByRole("button", { name: "Sélectionner Novice 2" }).click();
  await page.getByLabel("Nom de Novice 1").fill("Ariane");
  await expect(page.getByText("Sélectionné : 2 / 2")).toBeVisible();
  await expect(page.getByRole("button", { name: /Fonder la Cité et commencer/i })).toBeDisabled();
  await expect(page.getByTestId("mutation-count")).toHaveText("0");
});

test("keeps recruitment actions reachable on a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 568 });
  await page.goto("/tests/browser/fixtures/onboarding-harness.html?step=recruit");
  await page.getByRole("button", { name: /SCELLER/ }).click();
  await expect(page.getByTestId("mutation-count")).toHaveText("1");
});
