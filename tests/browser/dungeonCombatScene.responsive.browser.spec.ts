import { expect, test, type Page } from "@playwright/test";

async function expectCombatSceneContained(page: Page) {
  const result = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("[data-testid='dungeon-combat-stage']");
    if (!stage) return { stageMissing: true, documentOverflow: 0, offenders: [] as string[], actionOverlap: true };
    const bounds = stage.getBoundingClientRect();
    const elements = stage.querySelectorAll<HTMLElement>(
      "[data-testid='dungeon-combat-actor'], [data-testid='dungeon-combat-effect']",
    );
    const offenders = [...elements].filter((element) => {
      const box = element.getBoundingClientRect();
      return box.left < bounds.left - 1
        || box.right > bounds.right + 1
        || box.top < bounds.top - 1
        || box.bottom > bounds.bottom + 1;
    }).map((element) => element.dataset.actorId ?? element.dataset.targetActorId ?? "élément-inconnu");
    const action = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.includes("Explorer la salle"));
    const actionBounds = action?.getBoundingClientRect();
    return {
      stageMissing: false,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      offenders,
      actionOverlap: !actionBounds || actionBounds.top < bounds.bottom - 1,
    };
  });

  expect(result.stageMissing).toBe(false);
  expect(result.documentOverflow).toBeLessThanOrEqual(0);
  expect(result.offenders).toEqual([]);
  expect(result.actionOverlap).toBe(false);
}

for (const width of [1024, 1280, 1440] as const) {
  test(`keeps the production combat scene readable at ${width}px PC width`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/tests/browser/fixtures/dungeon-harness.html?combat-scene=1");

    const scene = page.getByTestId("dungeon-combat-scene");
    await expect(scene).toBeVisible();
    await expect(scene).toHaveAttribute("data-action-mode", "melee");
    await expect(page.getByTestId("dungeon-combat-stage")).toHaveAttribute("data-asset-status", "ready");
    await expect(page.getByTestId("dungeon-combat-actor")).toHaveCount(7);
    await expect(scene.locator("img[src*='rat-pack-']")).toHaveCount(3);
    await expect(scene.locator("[data-team='heroes'] img")).toHaveCount(4);
    const heroPortraitSources = await scene.locator("[data-team='heroes'] img").evaluateAll((images) => (
      images.map((image) => (image as HTMLImageElement).currentSrc)
    ));
    expect(new Set(heroPortraitSources).size).toBe(4);

    const activeActor = scene.locator("[data-testid='dungeon-combat-actor'][data-active='true']");
    await expect(activeActor).toHaveAttribute("data-team", "heroes");
    await expect(activeActor.getByTestId("dungeon-combat-visual")).toHaveAttribute("data-asset-status", "ready");
    await expect(page.getByTestId("dungeon-combat-effect")).toHaveAttribute("data-target-actor-id", /:enemies:/);
    await expect(page.getByTestId("dungeon-combat-effect")).toHaveAttribute("data-visual-key", "effect:physical-impact");
    const effectOpacityAt500Ms = await page.getByTestId("dungeon-combat-effect").evaluate((element) => {
      const animation = element.getAnimations()[0];
      if (!animation) return null;
      animation.pause();
      animation.currentTime = 500;
      return getComputedStyle(element).opacity;
    });
    expect(effectOpacityAt500Ms).toBe("1");
    expect(await activeActor.locator("[data-idle-motion='true']").evaluate((element) => getComputedStyle(element).animationName)).toContain("actor-idle");

    const idleDurations = await scene.locator("[data-idle-motion='true']").evaluateAll((elements) => (
      elements.map((element) => getComputedStyle(element).animationDuration)
    ));
    const idleDelays = await scene.locator("[data-idle-motion='true']").evaluateAll((elements) => (
      elements.map((element) => getComputedStyle(element).animationDelay)
    ));
    expect(new Set(idleDurations).size).toBeGreaterThan(1);
    expect(new Set(idleDelays).size).toBeGreaterThan(1);

    const auraColor = await activeActor.evaluate((element) => (
      getComputedStyle(element).getPropertyValue("--actor-aura-solid").trim()
    ));
    expect(auraColor).toBe("#ffd36d");
    await expectCombatSceneContained(page);
  });
}

test("keeps the PC combat scene composed at the 1024px / 200% zoom equivalent", async ({ page }) => {
  // Browser zoom divides the CSS viewport. A 512px CSS viewport exercises the
  // layout available to a 1024px desktop viewport at 200% without claiming
  // support for a standalone mobile viewport.
  await page.setViewportSize({ width: 512, height: 1000 });
  await page.goto("/tests/browser/fixtures/dungeon-harness.html?combat-scene=1");
  await expect(page.getByTestId("dungeon-combat-scene")).toBeVisible();
  await expect(page.getByTestId("dungeon-combat-actor")).toHaveCount(7);
  await expectCombatSceneContained(page);
});

test("keeps dodge, critical, KO, result and reduced motion tied to the authoritative step", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });

  await page.goto("/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&step=3");
  const scene = page.getByTestId("dungeon-combat-scene");
  await expect(scene.locator("[data-testid='dungeon-combat-actor'][data-active='true']")).toHaveAttribute("data-team", "enemies");
  await expect(page.getByTestId("dungeon-combat-effect")).toHaveText("Esquive");
  expect(await scene.locator("[data-testid='dungeon-combat-actor'][data-active='true']").evaluate((element) => (
    getComputedStyle(element).getPropertyValue("--actor-aura-solid").trim()
  ))).toBe("#f05252");

  await page.goto("/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&step=4");
  await expect(page.getByTestId("dungeon-combat-effect")).toHaveAttribute("data-kind", "critical");
  await expect(page.getByTestId("dungeon-combat-effect")).toHaveText("−10");
  await expect(scene.locator("[data-testid='dungeon-combat-actor'][data-state='ko']")).toHaveAttribute("data-team", "enemies");

  await page.goto("/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&step=5");
  await expect(scene.locator("[data-testid='dungeon-combat-actor'][data-state='ko'][data-team='heroes']")).toHaveCount(1);
  await expect(scene.locator("[data-testid='dungeon-combat-actor'][data-active='true']")).toHaveAttribute("data-team", "enemies");

  await page.goto("/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&complete=1");
  await expect(page.getByTestId("dungeon-combat-result")).toHaveText("Victoire");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&step=4");
  expect(await scene.locator("[data-motion='melee']").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  await expectCombatSceneContained(page);
});
