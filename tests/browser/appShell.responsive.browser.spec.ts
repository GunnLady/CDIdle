import { expect, test } from "@playwright/test";

test("lets the complete top block leave the viewport while scrolling on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/app-shell-harness.html");
  const shell = page.getByTestId("app-shell");
  const header = page.getByTestId("shell-resource-header");
  const mobilePanel = page.getByTestId("resource-header-mobile-panel");
  const woodRail = page.getByTestId("resource-header-wood-rail");
  const leftOrnament = page.getByTestId("resource-header-ornament-left");
  const rightOrnament = page.getByTestId("resource-header-ornament-right");
  const navigation = page.getByTestId("persistent-page-navigation");
  expect(await shell.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toContain("app-shell-background-v3-main-safe");
  await expect(mobilePanel).toBeVisible();
  await expect(woodRail).toBeHidden();
  await expect(leftOrnament).toBeHidden();
  await expect(rightOrnament).toBeHidden();
  expect((await header.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect((await header.boundingBox())!.y).toBeLessThan(0);
  expect((await navigation.boundingBox())!.y).toBeLessThan(0);
});

test("keeps the desktop shell and its navigation persistent", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tests/browser/fixtures/app-shell-harness.html");
  const shell = page.getByTestId("app-shell");
  const header = page.getByTestId("shell-resource-header");
  const mobilePanel = page.getByTestId("resource-header-mobile-panel");
  const woodRail = page.getByTestId("resource-header-wood-rail");
  const leftOrnament = page.getByTestId("resource-header-ornament-left");
  const rightOrnament = page.getByTestId("resource-header-ornament-right");
  const navigation = page.getByTestId("persistent-page-navigation");
  const main = page.getByRole("main");
  const shellBackground = await shell.evaluate((element) => {
    const style = getComputedStyle(element);
    return { image: style.backgroundImage, position: style.backgroundPosition };
  });
  expect(shellBackground.image).toContain("app-shell-background-v3-main-safe");
  expect(shellBackground.position).toBe("50% 0%");
  expect(await shell.evaluate((element) => getComputedStyle(element).backgroundSize)).toBe("cover");
  await expect(mobilePanel).toBeHidden();
  await expect(woodRail).toBeVisible();
  await expect(leftOrnament).toBeVisible();
  await expect(rightOrnament).toBeVisible();
  const initialHeaderTop = (await header.boundingBox())!.y;
  const initialNavigationTop = (await navigation.boundingBox())!.y;
  await main.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(Math.abs((await header.boundingBox())!.y - initialHeaderTop)).toBeLessThanOrEqual(1);
  expect(Math.abs((await navigation.boundingBox())!.y - initialNavigationTop)).toBeLessThanOrEqual(1);
});
