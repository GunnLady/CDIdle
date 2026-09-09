import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "compact", width: 1024, height: 900 },
  { name: "desktop boundary", width: 1280, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`keeps Storage usable at ${viewport.name} ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tests/browser/fixtures/storage-harness.html");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    const summary = page.getByTestId("storage-summary");
    const toolbar = page.getByTestId("storage-toolbar");
    const inventory = page.getByTestId("item-inventory-panel");
    const decision = page.getByTestId("storage-equipment-decision");
    const boxes = await Promise.all([summary, toolbar, inventory, decision].map((locator) => locator.boundingBox()));
    boxes.forEach((box) => expect(box).not.toBeNull());
    expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
    expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
    if (viewport.width >= 1280) {
      const master = await page.getByTestId("storage-master-column").boundingBox();
      expect(master!.x).toBeLessThan(boxes[3]!.x);
      expect(Math.abs(master!.y - boxes[3]!.y)).toBeLessThanOrEqual(2);
      expect(boxes[1]!.x + boxes[1]!.width).toBeLessThanOrEqual(master!.x + master!.width + 1);
      const controlOverflow = await toolbar.locator("input, select, button").evaluateAll((controls, rightEdge) => controls
        .filter((control) => getComputedStyle(control).display !== "none")
        .some((control) => control.getBoundingClientRect().right > Number(rightEdge) + 1), master!.x + master!.width);
      expect(controlOverflow).toBe(false);
    } else {
      expect(boxes[2]!.y).toBeLessThan(boxes[3]!.y);
      const advancedFilters = page.locator("#storage-advanced-filters");
      await expect(advancedFilters).toBeHidden();
      await toolbar.getByRole("button", { name: /^Filtres/ }).click();
      await expect(advancedFilters).toBeVisible();
    }

    await page.getByTestId("storage-item-lute").getByRole("button", { name: /Luth/ }).click();
    await decision.getByRole("button", { name: /Ariane/ }).click();
    await expect(decision).toContainText("Luth");
    const itemCard = page.getByTestId("storage-item-lute");
    if (viewport.width >= 1280) {
      const firstCard = await page.getByTestId("storage-item-sword").boundingBox();
      expect(firstCard).not.toBeNull();
      expect(firstCard!.y).toBeLessThan(viewport.height);
      const inventoryViewport = page.getByTestId("item-inventory-scroll-region");
      const thirdRowLastCard = await page.getByTestId("storage-item-leather").boundingBox();
      const inventoryViewportBox = await inventoryViewport.boundingBox();
      expect(thirdRowLastCard).not.toBeNull();
      expect(inventoryViewportBox).not.toBeNull();
      expect(thirdRowLastCard!.y + thirdRowLastCard!.height)
        .toBeLessThanOrEqual(inventoryViewportBox!.y + inventoryViewportBox!.height + 1);
      expect(await inventoryViewport.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    }
    const actionsOverflow = () => itemCard.evaluate((card) => {
      const bounds = card.getBoundingClientRect();
      return [...card.querySelectorAll("button")].some((button) => {
        const box = button.getBoundingClientRect();
        return box.left < bounds.left - 1 || box.right > bounds.right + 1;
      });
    });
    expect(await actionsOverflow()).toBe(false);
    await itemCard.getByRole("button", { name: "Recycler" }).click();
    expect(await actionsOverflow()).toBe(false);
    await itemCard.getByRole("button", { name: "Non" }).click();
    await expect(page.getByTestId("mutation-count")).toHaveText("0");
  });
}

test("keeps Storage consultation local in read-only mode", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tests/browser/fixtures/storage-harness.html?readonly=1");
  await page.getByTestId("storage-item-sword").getByRole("button", { name: /Épée de départ/ }).click();
  await page.getByTestId("storage-equipment-decision").getByRole("button", { name: /Ariane/ }).click();
  await expect(page.getByTestId("storage-equipment-decision")).toContainText("Ariane");
  await expect(page.getByTestId("storage-equipment-decision").getByRole("button", { name: "Équiper" })).toBeDisabled();
  await expect(page.getByTestId("storage-item-sword").getByRole("button", { name: "Recycler" })).toBeDisabled();
  await expect(page.getByTestId("mutation-count")).toHaveText("0");
});

test("supports hero-first equipment inside Storage with one hero per row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/tests/browser/fixtures/storage-harness.html");
  const decision = page.getByTestId("storage-equipment-decision");
  await expect(decision.getByRole("heading", { name: "Équipement des héros" })).toBeVisible();
  const heroCards = decision.getByTestId("storage-hero-list").getByRole("button");
  const firstHeroBox = await heroCards.nth(0).boundingBox();
  const secondHeroBox = await heroCards.nth(1).boundingBox();
  expect(firstHeroBox).not.toBeNull();
  expect(secondHeroBox).not.toBeNull();
  expect(secondHeroBox!.y).toBeGreaterThanOrEqual(firstHeroBox!.y + firstHeroBox!.height);
  await heroCards.nth(0).click();
  const picker = page.getByTestId("storage-hero-item-picker");
  await picker.getByRole("button", { name: /Épée de départ/ }).click();
  await expect(decision).toContainText("Équipement actuel");
  await expect(decision).toContainText("Équipement sélectionné");
  await expect(decision).toContainText("Gains et pertes");
  await decision.getByRole("button", { name: "Équiper" }).click();
  await expect(page.getByTestId("mutation-count")).toHaveText("1");
});
