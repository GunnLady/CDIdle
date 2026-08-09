import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "compact", width: 1024, height: 900 },
  { name: "desktop boundary", width: 1280, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`keeps Heroes usable at ${viewport.name} ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/heroes-harness.html");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    const expedition = page.getByTestId("dungeon-party-manager");
    const roster = page.getByTestId("hero-roster-panel");
    const selected = page.getByTestId("selected-hero-panel");
    const equipment = page.getByTestId("hero-equipment-panel");
    const skills = page.getByTestId("hero-skills-panel");
    const boxes = await Promise.all([expedition, roster, selected, equipment, skills].map((locator) => locator.boundingBox()));
    boxes.forEach((box) => expect(box).not.toBeNull());
    if (viewport.width >= 1280) {
      const leftColumn = await page.getByTestId("heroes-left-column").boundingBox();
      const rightColumn = await page.getByTestId("heroes-right-column").boundingBox();
      expect(Math.abs(leftColumn!.height - boxes[2]!.height)).toBeLessThanOrEqual(2);
      expect(Math.abs(rightColumn!.height - boxes[2]!.height)).toBeLessThanOrEqual(2);
      expect(boxes[0]!.x).toBeLessThan(boxes[2]!.x);
      expect(boxes[2]!.x).toBeLessThan(boxes[3]!.x);
      expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
      expect(boxes[3]!.y).toBeLessThan(boxes[4]!.y);
    } else {
      expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
      expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
      expect(boxes[2]!.y).toBeLessThan(boxes[3]!.y);
      expect(boxes[3]!.y).toBeLessThan(boxes[4]!.y);
    }
    await page.getByTestId("hero-roster-borin").click();
    await expect(selected).toContainText("Borin");
    await expect(page.getByTestId("mutation-count")).toHaveText("0");
  });
}

test("keeps hero consultation local in read-only mode", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/heroes-harness.html?readonly=1");
  await page.getByTestId("hero-roster-borin").click();
  await expect(page.getByTestId("selected-hero-panel")).toContainText("Borin");
  await expect(page.getByRole("button", { name: "Déployer Borin" })).toBeDisabled();
  await expect(page.getByTestId("mutation-count")).toHaveText("0");
});
