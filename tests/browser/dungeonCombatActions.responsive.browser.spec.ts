import { expect, test, type Page } from "@playwright/test";

async function openAdvancedStep(page: Page, step: number, animations = false) {
  await page.goto(
    `/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&integrated=1&advanced-combat=1&step=${step}${animations ? "" : "&animations=0"}`,
  );
  const scene = page.getByTestId("dungeon-combat-scene");
  await expect(scene).toBeVisible();
  await expect(scene.getByTestId("dungeon-combat-actor")).toHaveCount(7);
  await expect(page.getByRole("button", { name: "Explorer la salle" })).toBeVisible();
  return scene;
}

test("maps projectile, magic, healing and enemy support onto their exact actors", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });

  const projectile = await openAdvancedStep(page, 2);
  await expect(projectile).toHaveAttribute("data-action-mode", "projectile");
  await expect(projectile.getByTestId("dungeon-combat-action-effect")).toHaveAttribute("data-kind", "projectile");
  await expect(projectile.getByTestId("dungeon-combat-action-effect")).toHaveAttribute(
    "data-source-actor-id",
    /archer-history/,
  );
  await expect(projectile.getByTestId("dungeon-combat-action-effect")).toHaveAttribute(
    "data-target-actor-id",
    /rat-a/,
  );
  await expect(projectile.getByTestId("dungeon-combat-action-payload")).toBeVisible();
  await expect(projectile.getByLabel(/PM de Céleste : 4 sur 8/)).toBeVisible();
  await expect(
    projectile.locator("[data-actor-id*='archer-history'] [data-idle-motion='true']"),
  ).toHaveCSS("animation-name", "none");

  const magic = await openAdvancedStep(page, 3);
  await expect(magic).toHaveAttribute("data-action-mode", "magic");
  await expect(magic.getByTestId("dungeon-combat-action-effect")).toHaveAttribute("data-kind", "magic");
  await expect(magic.getByTestId("dungeon-combat-action-effect")).toHaveAttribute("data-target-actor-id", /rat-b/);
  await expect(magic.getByLabel(/PM de Milo : 6 sur 12/)).toBeVisible();

  const healing = await openAdvancedStep(page, 4);
  await expect(healing).toHaveAttribute("data-action-mode", "healing");
  await expect(healing.getByTestId("dungeon-combat-action-effect")).toHaveAttribute("data-kind", "healing");
  await expect(healing.getByTestId("dungeon-combat-action-effect")).toHaveAttribute(
    "data-target-actor-id",
    /pugilist-history/,
  );
  await expect(healing.getByLabel(/PV \+8 .* Ariane/)).toBeVisible();
  await expect(healing.getByLabel(/PM .*4 .* Abel/)).toBeVisible();

  const support = await openAdvancedStep(page, 5);
  await expect(support).toHaveAttribute("data-action-mode", "support");
  await expect(support.getByTestId("dungeon-combat-action-effect")).toHaveAttribute("data-kind", "support");
  await expect(support.getByTestId("dungeon-combat-action-effect")).toHaveAttribute("data-source-actor-id", /rat-c/);
  await expect(support.getByTestId("dungeon-combat-action-effect")).toHaveAttribute("data-target-actor-id", /rat-b/);
});

test("preserves multi-hit order and advances an area action only on logged targets", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  const multi = await openAdvancedStep(page, 6);
  await expect(multi).toHaveAttribute("data-action-mode", "melee");
  const numbers = multi.getByTestId("dungeon-combat-effect");
  const damageNumbers = multi.locator(
    "[data-testid='dungeon-combat-effect']:not([data-kind='mana-spent'])",
  );
  await expect(numbers).toHaveCount(4);
  await expect(damageNumbers).toHaveCount(3);
  await expect(damageNumbers.nth(0)).toHaveText("−4");
  await expect(damageNumbers.nth(1)).toHaveText("−6");
  await expect(damageNumbers.nth(1)).toHaveAttribute("data-kind", "critical");
  await expect(damageNumbers.nth(2)).toHaveText("−5");
  await expect(multi.locator("[data-testid='dungeon-combat-effect'][data-kind='mana-spent']")).toHaveCount(1);

  for (const [step, target] of [[7, "rat-a"], [8, "rat-b"], [9, "rat-c"]] as const) {
    const area = await openAdvancedStep(page, step);
    const impacted = area.locator(`[data-testid='dungeon-combat-actor'][data-actor-id*='${target}']`);
    await expect(impacted.locator("[data-reaction='impact']")).toHaveCount(1);
    await expect(area.getByTestId("dungeon-combat-effect")).toHaveCount(step === 7 ? 2 : 1);
  }
});

test("keeps advanced effects readable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 1000 });
  const scene = await openAdvancedStep(page, 3, true);
  const trail = scene.locator("path").first();
  const number = scene.getByTestId("dungeon-combat-effect").first();

  await expect(scene).toHaveAttribute("data-action-mode", "magic");
  await expect(trail).toHaveCSS("animation-name", "none");
  await expect(number).toHaveCSS("animation-name", "none");
  await expect(number).toBeVisible();
});

test("keeps the combat scene keyboard-focusable without loading effect bitmaps", async ({ page }) => {
  const imageRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "image") imageRequests.push(request.url());
  });
  await page.setViewportSize({ width: 1280, height: 1000 });
  const scene = await openAdvancedStep(page, 3);

  await scene.focus();
  await expect(scene).toBeFocused();
  expect(imageRequests.some((url) => /effect-(?:projectile|magic|healing|support)/.test(url))).toBe(false);
});

test("provides a preloaded, replayable visual-review scenario", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(
    "/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&integrated=1&advanced-combat=1&scenario=1",
  );

  const controls = page.getByTestId("advanced-combat-scenario-controls");
  const step = page.getByTestId("advanced-combat-scenario-step");
  const scene = page.getByTestId("dungeon-combat-scene");
  await expect(controls).toBeVisible();
  await expect(step).toHaveText("Étape 1/10");
  await expect(scene).toHaveAttribute("data-action-mode", "entry");
  await expect(scene.locator("[data-testid='dungeon-combat-visual'] img")).toHaveCount(7);
  const targetActor = scene.locator("[data-testid='dungeon-combat-actor'][data-actor-id*='rat-a']");
  const targetActorHandle = await targetActor.elementHandle();

  await controls.getByRole("button", { name: "Suivante" }).click();
  await expect(step).toHaveText("Étape 2/10");
  await expect(scene).toHaveAttribute("data-action-mode", "projectile");
  expect(await targetActorHandle?.evaluate((node) => node.isConnected)).toBe(true);
  const payload = scene.getByTestId("dungeon-combat-action-payload");
  await expect(payload).toHaveCSS("animation-name", /action-effect-payload/);
  await expect(payload).toHaveCSS("animation-duration", "0.43s");
  await expect(scene.locator("[data-kind='damage']")).toHaveCSS("animation-delay", "0.43s");
  await expect(scene.locator("[data-kind='mana-spent']")).toHaveCSS("animation-delay", "0s");
  await expect(targetActor.locator("[data-resource='health'] > span")).toHaveCSS("transition-delay", "0.43s");

  const payloadHandle = await payload.elementHandle();
  await controls.getByRole("button", { name: "Rejouer" }).click();
  await expect(scene.getByTestId("dungeon-combat-action-payload")).toBeAttached();
  await expect.poll(() => payloadHandle?.evaluate((node) => node.isConnected)).toBe(false);
});

test("loads CDI-136 Novices through the production portrait pipeline", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(
    "/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&integrated=1&advanced-combat=1&scenario=1&novice-review=1",
  );

  const heroes = page.locator("[data-testid='dungeon-combat-actor'][data-team='heroes']");
  await expect(heroes).toHaveCount(4);
  await expect(heroes.locator("[data-visual-key^='Novice_']")).toHaveCount(4);
  const sources = await heroes.locator("img").evaluateAll((images) => (
    images.map((image) => (image as HTMLImageElement).currentSrc)
  ));
  expect(sources).toHaveLength(4);
  expect(sources.every((source) => /novice-(?:male|female)-\d{2}-v1/.test(source))).toBe(true);
});
