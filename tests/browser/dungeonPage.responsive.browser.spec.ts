import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "compact", width: 1024, height: 900 },
  { name: "desktop boundary", width: 1280, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`keeps Dungeon usable at ${viewport.name} ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/dungeon-harness.html");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    const progression = page.getByTestId("dungeon-progression-panel");
    const encounter = page.getByTestId("dungeon-current-encounter");
    const party = page.getByTestId("dungeon-party-panel");
    const history = page.getByTestId("dungeon-history-panel");
    const boxes = await Promise.all([progression, encounter, party, history].map((locator) => locator.boundingBox()));
    boxes.forEach((box) => expect(box).not.toBeNull());
    expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
    if (viewport.width >= 1280) {
      expect(boxes[1]!.x).toBeLessThan(boxes[2]!.x);
      expect(Math.abs(boxes[1]!.y - boxes[2]!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(boxes[1]!.height - boxes[2]!.height)).toBeLessThanOrEqual(2);
      expect(boxes[1]!.width).toBeLessThan(boxes[2]!.width);
      const slotBoxes = await page.getByTestId("dungeon-party-slot").evaluateAll((slots) => slots.map((slot) => slot.getBoundingClientRect().height));
      expect(new Set(slotBoxes.map((height) => Math.round(height))).size).toBe(1);
      expect(await page.getByTestId("dungeon-reserves-list").evaluate((element) => getComputedStyle(element).overflowY)).toBe("visible");
    } else {
      expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
    }
    expect(boxes[2]!.y).toBeLessThan(boxes[3]!.y);

    await history.locator("summary").click();
    expect(await history.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(false);
    await history.locator("summary").click();
    expect(await history.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(true);

    await page.getByRole("button", { name: "Déployer Borin" }).click();
    await expect(page.getByRole("button", { name: "Retirer Borin" })).toBeVisible();
    await expect(page.getByTestId("mutation-count")).toHaveText("1");
  });
}

test("keeps Dungeon consultation local in read-only mode", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/dungeon-harness.html?readonly=1");
  await page.getByRole("button", { name: /^Borin/ }).click();
  await expect(page.getByTestId("dungeon-party-panel")).toContainText("Fiche & équipement");
  await expect(page.getByRole("button", { name: "Déployer Borin" })).toBeDisabled();
  await expect(page.getByText("Récolte terminée")).toHaveCount(0);
  await expect(page.getByTestId("dungeon-history-panel").getByText("Donjon", { exact: true })).toBeVisible();
  await expect(page.getByTestId("mutation-count")).toHaveText("0");
});
