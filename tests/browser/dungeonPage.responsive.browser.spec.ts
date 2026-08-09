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
    const roster = page.getByTestId("dungeon-party-roster");
    const heroSheet = page.getByTestId("dungeon-hero-sheet");
    const history = page.getByTestId("dungeon-history-panel");
    const boxes = await Promise.all([progression, encounter, party, history].map((locator) => locator.boundingBox()));
    boxes.forEach((box) => expect(box).not.toBeNull());
    expect(Math.round(boxes[1]!.height)).toBe(675);
    expect(await page.getByTestId("dungeon-encounter-transcript").evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
    expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
    expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
    if (viewport.width >= 1280) {
      expect(Math.abs(boxes[1]!.x - boxes[2]!.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(boxes[1]!.width - boxes[2]!.width)).toBeLessThanOrEqual(2);
      const slotBoxes = await page.getByTestId("dungeon-party-slot").evaluateAll((slots) => slots.map((slot) => slot.getBoundingClientRect().height));
      expect(new Set(slotBoxes.map((height) => Math.round(height))).size).toBe(1);
      expect(await page.getByTestId("dungeon-reserves-list").evaluate((element) => getComputedStyle(element).overflowY)).toBe("visible");
      const [rosterBox, sheetBox] = await Promise.all([roster.boundingBox(), heroSheet.boundingBox()]);
      expect(rosterBox!.x).toBeLessThan(sheetBox!.x);
      expect(Math.abs(rosterBox!.y - sheetBox!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(rosterBox!.height - sheetBox!.height)).toBeLessThanOrEqual(2);
    } else {
      const [rosterBox, sheetBox] = await Promise.all([roster.boundingBox(), heroSheet.boundingBox()]);
      expect(rosterBox!.y).toBeLessThan(sheetBox!.y);
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
  const heroSheet = page.getByTestId("dungeon-hero-sheet");
  await expect(heroSheet).not.toContainText("Humain · Novice");
  await expect(heroSheet.locator('[id^="hero-portrait-"]')).toBeVisible();
  await expect(heroSheet).toContainText("Défense magique");
  await page.getByRole("button", { name: "Compétences" }).click();
  await expect(page.getByTestId("dungeon-hero-skills")).toBeVisible();
  await page.getByRole("button", { name: "Équipement" }).click();
  await expect(page.getByTestId("dungeon-hero-equipment")).toBeVisible();
  await expect(page.getByRole("button", { name: "Déployer Borin" })).toBeDisabled();
  await expect(page.getByText("Récolte terminée")).toHaveCount(0);
  await expect(page.getByTestId("dungeon-history-panel").getByRole("button", { name: "Effacer les notes" })).toBeVisible();
  await expect(page.getByTestId("mutation-count")).toHaveText("0");
});
