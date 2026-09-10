import { expect, test, type Page } from "@playwright/test";

async function expectSceneWithinViewport(page: Page) {
  const result = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("[data-testid='dungeon-scene-prototype-stage']");
    if (!stage) return { stageMissing: true, documentOverflow: 0, offenders: [] as string[] };
    const bounds = stage.getBoundingClientRect();
    const offenders = [...stage.querySelectorAll<HTMLElement>("[data-testid='dungeon-scene-actor']")]
      .filter((actor) => {
        const box = actor.getBoundingClientRect();
        return box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1;
      })
      .map((actor) => actor.dataset.actorId ?? "acteur-inconnu");
    return {
      stageMissing: false,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      offenders,
    };
  });

  expect(result.stageMissing).toBe(false);
  expect(result.documentOverflow).toBeLessThanOrEqual(0);
  expect(result.offenders).toEqual([]);
}

for (const width of [1024, 1280, 1440] as const) {
  test(`keeps the dungeon scene readable at ${width}px PC width`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?ui-catalog=1");
    const prototype = page.getByTestId("catalog-dungeon-scene-prototype");
    await prototype.scrollIntoViewIfNeeded();
    await expect(prototype).toBeVisible();
    await expect(page.getByTestId("dungeon-scene-actor")).toHaveCount(7);
    await expectSceneWithinViewport(page);

    await page.getByRole("button", { name: "Boss" }).click();
    await expect(page.getByTestId("dungeon-scene-actor")).toHaveCount(7);
    await expect(page.getByText("Roi des Rats", { exact: true })).toBeVisible();
    await expectSceneWithinViewport(page);
  });
}

test("keeps the PC scene composed at the 1024px / 200% zoom equivalent", async ({ page }) => {
  // Browser zoom divides the CSS viewport. A 512px CSS viewport exercises the
  // layout available to a 1024px desktop viewport at 200% without claiming
  // support for a standalone mobile viewport.
  await page.setViewportSize({ width: 512, height: 1000 });
  await page.goto("/?ui-catalog=1");
  const prototype = page.getByTestId("catalog-dungeon-scene-prototype");
  await prototype.scrollIntoViewIfNeeded();
  await expect(prototype).toBeVisible();
  await expectSceneWithinViewport(page);

  await page.getByRole("button", { name: "Repos / KO" }).click();
  await expect(page.getByText("Mage · KO")).toBeVisible();
  await expectSceneWithinViewport(page);
});
