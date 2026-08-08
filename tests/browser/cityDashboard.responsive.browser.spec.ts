import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "compact", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`keeps the City usable at ${viewport.name} ${viewport.width}px`, async ({ page }) => {
    const commandRequests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/game-api/")) commandRequests.push(request.url());
    });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/city-harness.html?readonly=1&forge=1");

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(horizontalOverflow).toBeLessThanOrEqual(0);

    const selected = page.getByTestId("selected-building-panel");
    const buildings = page.getByTestId("building-list-panel");
    const assignments = page.getByTestId("assignment-panel");
    await expect(page.locator('button[data-testid^="building-"]')).toHaveCount(14);
    const [selectedBox, buildingsBox, assignmentsBox] = await Promise.all([
      selected.boundingBox(), buildings.boundingBox(), assignments.boundingBox(),
    ]);
    expect(selectedBox).not.toBeNull();
    expect(buildingsBox).not.toBeNull();
    expect(assignmentsBox).not.toBeNull();
    if (viewport.width >= 1280) {
      expect(Math.abs(selectedBox!.y - buildingsBox!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(selectedBox!.y - assignmentsBox!.y)).toBeLessThanOrEqual(2);
      expect(selectedBox!.x).toBeLessThan(buildingsBox!.x);
      expect(buildingsBox!.x).toBeLessThan(assignmentsBox!.x);
      expect(selectedBox!.width).toBeGreaterThan(buildingsBox!.width);
      expect(Math.abs(buildingsBox!.width - assignmentsBox!.width)).toBeLessThanOrEqual(2);
      expect(Math.abs(selectedBox!.height - buildingsBox!.height)).toBeLessThanOrEqual(2);
      expect(Math.abs(selectedBox!.height - assignmentsBox!.height)).toBeLessThanOrEqual(2);
    } else {
      expect(selectedBox!.y).toBeLessThan(buildingsBox!.y);
      expect(buildingsBox!.y).toBeLessThan(assignmentsBox!.y);
    }

    if (viewport.width >= 1280) {
      const listScroll = page.getByTestId("building-list-scroll");
      expect(await listScroll.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
      const selectedTop = (await selected.boundingBox())!.y;
      await listScroll.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      expect(Math.abs((await selected.boundingBox())!.y - selectedTop)).toBeLessThanOrEqual(1);
    }

    await page.getByTestId("building-forge").click();
    await expect(selected).toContainText("Forge rustique");
    await expect(selected.getByRole("button", { name: "Forger" })).toBeDisabled();
    await expect(page.getByTestId("mutation-count")).toHaveText("0");
    expect(commandRequests).toEqual([]);
  });
}

test("exposes Forge construction only after its prerequisites are met", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/tests/browser/fixtures/city-harness.html?forge=0");
  await page.getByTestId("building-list-scroll").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await page.getByTestId("building-forge").click();

  const selected = page.getByTestId("selected-building-panel");
  const build = selected.getByRole("button", { name: "Bâtir" });
  await expect(build).toBeEnabled();
  await build.click();
  await expect(page.getByTestId("mutation-count")).toHaveText("1");
});
