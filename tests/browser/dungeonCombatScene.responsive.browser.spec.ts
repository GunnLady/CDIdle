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

async function expectNonCombatSceneComposed(
  page: Page,
  assetName: string,
  expectedActorRatio: readonly [minimum: number, maximum: number],
) {
  const result = await page.evaluate((requestedAsset) => {
    const stage = document.querySelector<HTMLElement>("[data-testid='dungeon-combat-stage']");
    const image = stage?.querySelector<HTMLImageElement>(`img[src*='${requestedAsset}']`);
    const accessory = image?.parentElement;
    const summary = stage?.querySelector<HTMLElement>("[aria-label='Trésor'], [aria-label='Repos']");
    if (!stage || !image || !accessory || !summary) {
      return { missing: true, documentOverflow: 0, accessoryVisibleRatio: 0, actorRatio: 0, summaryContained: false };
    }
    const stageBounds = stage.getBoundingClientRect();
    const accessoryBounds = accessory.getBoundingClientRect();
    const summaryBounds = summary.getBoundingClientRect();
    const visibleWidth = Math.max(0, Math.min(stageBounds.right, accessoryBounds.right) - Math.max(stageBounds.left, accessoryBounds.left));
    const visibleHeight = Math.max(0, Math.min(stageBounds.bottom, accessoryBounds.bottom) - Math.max(stageBounds.top, accessoryBounds.top));
    const visibleArea = visibleWidth * visibleHeight;
    const accessoryArea = accessoryBounds.width * accessoryBounds.height;
    const actor = stage.querySelector<HTMLElement>("[data-testid='dungeon-combat-actor']");
    const actorWidth = actor?.getBoundingClientRect().width ?? 0;
    return {
      missing: false,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      accessoryVisibleRatio: accessoryArea > 0 ? visibleArea / accessoryArea : 0,
      actorRatio: actorWidth > 0 ? accessoryBounds.width / actorWidth : 0,
      summaryContained: summaryBounds.left >= stageBounds.left - 1
        && summaryBounds.right <= stageBounds.right + 1
        && summaryBounds.top >= stageBounds.top - 1
        && summaryBounds.bottom <= stageBounds.bottom + 1,
    };
  }, assetName);

  expect(result.missing).toBe(false);
  expect(result.documentOverflow).toBeLessThanOrEqual(0);
  expect(result.accessoryVisibleRatio).toBeGreaterThan(0.9);
  expect(result.actorRatio).toBeGreaterThanOrEqual(expectedActorRatio[0]);
  expect(result.actorRatio).toBeLessThanOrEqual(expectedActorRatio[1]);
  expect(result.summaryContained).toBe(true);
  await expectCombatSceneContained(page);
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
    await expect(scene.getByRole("progressbar", { name: /^PM de / })).toHaveCount(4);
    await expect(scene.locator("[data-team='enemies'] [data-resource='mana']")).toHaveCount(0);
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

test("loads all twenty CDI-137 Warrior sprites across the five PC cinema review pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (let reviewPage = 1; reviewPage <= 5; reviewPage += 1) {
    await page.goto(`/tests/browser/fixtures/dungeon-harness.html?warrior-cinema=${reviewPage}`);
    const scene = page.getByTestId("dungeon-combat-scene");
    const heroes = scene.locator("[data-testid='dungeon-combat-actor'][data-team='heroes']");
    await expect(scene).toBeVisible();
    await expect(heroes).toHaveCount(4);
    await expect(heroes.locator("[data-testid='dungeon-combat-visual'][data-asset-status='ready']"))
      .toHaveCount(4);
    await expect(scene.locator("[data-team='heroes'][data-visual-pose='combat_idle']")).toHaveCount(4);

    const sources = await heroes.locator("img").evaluateAll((images) => images.map((image) => {
      const sprite = image as HTMLImageElement;
      return {
        naturalWidth: sprite.naturalWidth,
        naturalHeight: sprite.naturalHeight,
        source: sprite.currentSrc,
      };
    }));
    const firstVariant = (reviewPage - 1) * 2 + 1;
    const expectedNames = (["female", "male"] as const).flatMap((gender) => (
      [firstVariant, firstVariant + 1].map((variant) => (
        `warrior-${gender}-${String(variant).padStart(2, "0")}-v1`
      ))
    ));
    expect(sources).toHaveLength(4);
    expect(sources.every(({ naturalWidth, naturalHeight }) => (
      naturalWidth === 341 && naturalHeight === 692
    ))).toBe(true);
    for (const expectedName of expectedNames) {
      expect(sources.some(({ source }) => source.includes(expectedName))).toBe(true);
    }
    await expectCombatSceneContained(page);
  }
});

test("loads all twenty CDI-138 Rogue sprites across the five PC cinema review pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (let reviewPage = 1; reviewPage <= 5; reviewPage += 1) {
    await page.goto(`/tests/browser/fixtures/dungeon-harness.html?rogue-cinema=${reviewPage}`);
    const scene = page.getByTestId("dungeon-combat-scene");
    const heroes = scene.locator("[data-testid='dungeon-combat-actor'][data-team='heroes']");
    await expect(scene).toBeVisible();
    await expect(heroes).toHaveCount(4);
    await expect(heroes.locator("[data-testid='dungeon-combat-visual'][data-asset-status='ready']"))
      .toHaveCount(4);
    await expect(scene.locator("[data-team='heroes'][data-visual-pose='combat_idle']")).toHaveCount(4);

    const sources = await heroes.locator("img").evaluateAll((images) => images.map((image) => {
      const sprite = image as HTMLImageElement;
      return {
        naturalWidth: sprite.naturalWidth,
        naturalHeight: sprite.naturalHeight,
        source: sprite.currentSrc,
      };
    }));
    const firstVariant = (reviewPage - 1) * 2 + 1;
    const expectedNames = (["female", "male"] as const).flatMap((gender) => (
      [firstVariant, firstVariant + 1].map((variant) => (
        `rogue-${gender}-${String(variant).padStart(2, "0")}-v1`
      ))
    ));
    expect(sources).toHaveLength(4);
    expect(sources.every(({ naturalWidth, naturalHeight }) => (
      naturalWidth === 341 && naturalHeight === 692
    ))).toBe(true);
    for (const expectedName of expectedNames) {
      expect(sources.some(({ source }) => source.includes(expectedName))).toBe(true);
    }
    await expectCombatSceneContained(page);
  }
});

test("loads all twenty CDI-139 Archer sprites across the five PC cinema review pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (let reviewPage = 1; reviewPage <= 5; reviewPage += 1) {
    await page.goto(`/tests/browser/fixtures/dungeon-harness.html?archer-cinema=${reviewPage}`);
    const scene = page.getByTestId("dungeon-combat-scene");
    const heroes = scene.locator("[data-testid='dungeon-combat-actor'][data-team='heroes']");
    await expect(scene).toBeVisible();
    await expect(heroes).toHaveCount(4);
    await expect(heroes.locator("[data-testid='dungeon-combat-visual'][data-asset-status='ready']"))
      .toHaveCount(4);
    await expect(scene.locator("[data-team='heroes'][data-visual-pose='combat_idle']")).toHaveCount(4);

    const sources = await heroes.locator("img").evaluateAll((images) => images.map((image) => {
      const sprite = image as HTMLImageElement;
      return {
        naturalWidth: sprite.naturalWidth,
        naturalHeight: sprite.naturalHeight,
        source: sprite.currentSrc,
      };
    }));
    const firstVariant = (reviewPage - 1) * 2 + 1;
    const expectedNames = (["female", "male"] as const).flatMap((gender) => (
      [firstVariant, firstVariant + 1].map((variant) => (
        `archer-${gender}-${String(variant).padStart(2, "0")}-v1`
      ))
    ));
    expect(sources).toHaveLength(4);
    expect(sources.every(({ naturalWidth, naturalHeight }) => (
      naturalWidth === 341 && naturalHeight === 692
    ))).toBe(true);
    for (const expectedName of expectedNames) {
      expect(sources.some(({ source }) => source.includes(expectedName))).toBe(true);
    }
    await expectCombatSceneContained(page);
  }
});

test("loads all twenty CDI-140 Mage sprites across the five PC cinema review pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (let reviewPage = 1; reviewPage <= 5; reviewPage += 1) {
    await page.goto(`/tests/browser/fixtures/dungeon-harness.html?mage-cinema=${reviewPage}`);
    const scene = page.getByTestId("dungeon-combat-scene");
    const heroes = scene.locator("[data-testid='dungeon-combat-actor'][data-team='heroes']");
    await expect(scene).toBeVisible();
    await expect(heroes).toHaveCount(4);
    await expect(heroes.locator("[data-testid='dungeon-combat-visual'][data-asset-status='ready']"))
      .toHaveCount(4);
    await expect(scene.locator("[data-team='heroes'][data-visual-pose='combat_idle']")).toHaveCount(4);

    const sources = await heroes.locator("img").evaluateAll((images) => images.map((image) => {
      const sprite = image as HTMLImageElement;
      return {
        naturalWidth: sprite.naturalWidth,
        naturalHeight: sprite.naturalHeight,
        source: sprite.currentSrc,
      };
    }));
    const firstVariant = (reviewPage - 1) * 2 + 1;
    const expectedNames = (["female", "male"] as const).flatMap((gender) => (
      [firstVariant, firstVariant + 1].map((variant) => (
        `mage-${gender}-${String(variant).padStart(2, "0")}-v1`
      ))
    ));
    expect(sources).toHaveLength(4);
    expect(sources.every(({ naturalWidth, naturalHeight }) => (
      naturalWidth === 341 && naturalHeight === 692
    ))).toBe(true);
    for (const expectedName of expectedNames) {
      expect(sources.some(({ source }) => source.includes(expectedName))).toBe(true);
    }
    await expectCombatSceneContained(page);
  }
});

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

for (const width of [1024, 1280, 1440] as const) {
  test(`keeps treasure and rest scenes composed at ${width}px PC width`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });

    await page.goto("/tests/browser/fixtures/dungeon-harness.html?non-combat-scene=treasure");
    const treasureScene = page.getByTestId("dungeon-combat-scene");
    await expect(treasureScene).toBeVisible();
    await expect(page.getByTestId("dungeon-combat-stage")).toHaveAttribute("data-asset-status", "ready");
    await expect(page.getByTestId("dungeon-combat-stage")).toHaveCSS("background-image", /treasure-vault-background-v2/);
    await expect(treasureScene.locator("img[src*='treasure-chest-open-v3']").locator("..")).toHaveAttribute("data-asset-status", "ready");
    await expect(page.getByTestId("dungeon-non-combat-summary-item")).toHaveCount(2);
    await expect(page.getByTestId("dungeon-non-combat-summary-item").nth(0)).toHaveText("+17 or");
    await expect(page.getByTestId("dungeon-non-combat-summary-item").nth(1)).toHaveText("Débris métalliques ×2");
    await expect(treasureScene.getByTestId("dungeon-combat-actor")).toHaveCount(4);
    await expect(treasureScene.getByTestId("dungeon-combat-effect")).toHaveCount(0);
    await expectNonCombatSceneComposed(page, "treasure-chest-open-v3", [0.85, 1.25]);

    await page.goto("/tests/browser/fixtures/dungeon-harness.html?non-combat-scene=rest");
    const restScene = page.getByTestId("dungeon-combat-scene");
    await expect(restScene).toBeVisible();
    await expect(page.getByTestId("dungeon-combat-stage")).toHaveCSS("background-image", /rest-chamber-background-v1/);
    await expect(restScene.locator("img[src*='rest-camp-v2']").locator("..")).toHaveAttribute("data-asset-status", "ready");
    await expect(page.getByLabel("Repos")).toHaveText("Repos terminé");
    await expect(restScene.getByTestId("dungeon-combat-actor")).toHaveCount(4);
    await expect(restScene.getByTestId("dungeon-combat-effect")).toHaveCount(10);
    await expect(restScene.getByText("Réanimé", { exact: true })).toHaveCount(2);
    await expect(restScene.getByText("PV +16 · 16/80", { exact: true })).toHaveAttribute("data-kind", "recovery-health");
    await expect(restScene.getByText("PM +4 · 4/20", { exact: true })).toHaveAttribute("data-kind", "recovery-mana");
    await expect(restScene.getByText("PV +18 · 18/90", { exact: true })).toHaveAttribute("data-kind", "recovery-health");
    await expect(restScene.getByText("PM +4 · 6/18", { exact: true })).toHaveAttribute("data-kind", "recovery-mana");
    const restoredTarget = await restScene.getByText("PV +16 · 16/80", { exact: true }).getAttribute("data-target-actor-id");
    expect(restoredTarget).not.toBeNull();
    const sequentialEffects = restScene.locator(`[data-target-actor-id='${restoredTarget}']`);
    await expect(sequentialEffects).toHaveCount(3);
    expect(await sequentialEffects.evaluateAll((effects) => effects.map((effect) => getComputedStyle(effect).animationDelay))).toEqual([
      "0s",
      "0.6s",
      "1.2s",
    ]);
    expect(new Set(await sequentialEffects.evaluateAll((effects) => effects.map((effect) => getComputedStyle(effect).whiteSpace)))).toEqual(new Set(["nowrap"]));
    const cascade = await sequentialEffects.evaluateAll((effects) => {
      for (const effect of effects.slice(0, 2)) {
        const animation = effect.getAnimations()[0];
        animation?.pause();
        if (animation) animation.currentTime = 750;
      }
      const first = effects[0]?.getBoundingClientRect();
      const second = effects[1]?.getBoundingClientRect();
      return {
        firstBottom: first?.bottom ?? 0,
        firstHeight: first?.height ?? 0,
        firstOpacity: Number(getComputedStyle(effects[0]!).opacity),
        secondOpacity: Number(getComputedStyle(effects[1]!).opacity),
        secondTop: second?.top ?? 0,
      };
    });
    expect(cascade.firstOpacity).toBeGreaterThan(0.4);
    expect(cascade.secondOpacity).toBeGreaterThan(0.4);
    expect(cascade.firstBottom - cascade.secondTop).toBeLessThanOrEqual(cascade.firstHeight * 0.25);
    await expectNonCombatSceneComposed(page, "rest-camp-v2", [1.6, 2.1]);
  });
}

test("disables treasure and rest arrival motion when reduced motion is requested", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const kind of ["treasure", "rest"] as const) {
    const assetName = kind === "treasure" ? "treasure-chest-open-v3" : "rest-camp-v2";
    const label = kind === "treasure" ? "Trésor" : "Repos";
    await page.goto(`/tests/browser/fixtures/dungeon-harness.html?non-combat-scene=${kind}`);
    const scene = page.getByTestId("dungeon-combat-scene");
    const accessory = scene.locator(`img[src*='${assetName}']`).locator("..");
    await expect(accessory).toHaveAttribute("data-asset-status", "ready");
    expect(await accessory.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    expect(await page.getByLabel(label).evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  }
});
