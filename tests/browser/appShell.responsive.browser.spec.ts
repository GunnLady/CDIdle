import { expect, test } from "@playwright/test";

test("lets the complete top block leave the viewport while scrolling on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/app-shell-harness.html");
  const header = page.getByTestId("shell-resource-header");
  const navigation = page.getByTestId("persistent-page-navigation");
  expect((await header.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect((await header.boundingBox())!.y).toBeLessThan(0);
  expect((await navigation.boundingBox())!.y).toBeLessThan(0);
});

test("keeps the desktop shell and its navigation persistent", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tests/browser/fixtures/app-shell-harness.html");
  const header = page.getByTestId("shell-resource-header");
  const navigation = page.getByTestId("persistent-page-navigation");
  const main = page.getByRole("main");
  const initialHeaderTop = (await header.boundingBox())!.y;
  const initialNavigationTop = (await navigation.boundingBox())!.y;
  await main.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(Math.abs((await header.boundingBox())!.y - initialHeaderTop)).toBeLessThanOrEqual(1);
  expect(Math.abs((await navigation.boundingBox())!.y - initialNavigationTop)).toBeLessThanOrEqual(1);
});
