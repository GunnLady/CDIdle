import { expect, test, type Page } from "@playwright/test";
import { UNDERCITY_ZONES } from "../../shared/domain/undercity";
import { UNDERCITY_ZONE_VISUAL_PACKS } from "../../src/assets/undercityVisualManifest";

async function expectActorsWithinStage(page: Page) {
  const result = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("[data-testid='dungeon-combat-stage']");
    if (!stage) return { stageMissing: true, offenders: [] as string[] };
    const bounds = stage.getBoundingClientRect();
    const offenders = [...stage.querySelectorAll<HTMLElement>("[data-testid='dungeon-combat-actor']")]
      .filter((actor) => {
        const box = actor.getBoundingClientRect();
        return box.left < bounds.left - 1
          || box.right > bounds.right + 1
          || box.top < bounds.top - 1
          || box.bottom > bounds.bottom + 1;
      })
      .map((actor) => actor.dataset.actorId ?? "unknown-actor");
    return { stageMissing: false, offenders };
  });
  expect(result).toEqual({ stageMissing: false, offenders: [] });
}

async function expectUndercityEncounter(page: Page, zoneId: string, blueprintId: string) {
  const zone = UNDERCITY_ZONES.find((candidate) => candidate.id === zoneId);
  const pack = UNDERCITY_ZONE_VISUAL_PACKS.find((candidate) => candidate.zoneId === zoneId);
  if (!zone || !pack) throw new Error(`Unknown UnderCity visual pack: ${zoneId}`);
  const blueprints = [...zone.encounters, zone.elite, zone.boss];
  const blueprint = blueprints.find((entry) => entry.id === blueprintId);
  if (!blueprint) throw new Error(`Unknown ${zoneId} blueprint: ${blueprintId}`);
  await page.goto(`/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&blueprint=${blueprint.id}&step=0`);

  const scene = page.getByTestId("dungeon-combat-scene");
  const stage = page.getByTestId("dungeon-combat-stage");
  const enemies = scene.locator("[data-testid='dungeon-combat-actor'][data-team='enemies']");
  const enemyVisuals = enemies.getByTestId("dungeon-combat-visual");
  await expect(scene).toBeVisible();
  await expect(stage).toHaveAttribute("data-asset-status", "ready");
  await expect(scene.getByTestId("dungeon-combat-actor")).toHaveCount(4 + blueprint.members.length);
  await expect(enemies).toHaveCount(blueprint.members.length);
  await expect(enemyVisuals).toHaveCount(blueprint.members.length);

  const expectedVisuals = pack.enemies.filter((visual) => visual.blueprintId === blueprint.id);
  expect(expectedVisuals).toHaveLength(blueprint.members.length);
  for (let index = 0; index < expectedVisuals.length; index += 1) {
    const visual = enemyVisuals.nth(index);
    await expect(visual).toHaveAttribute("data-asset-status", "ready");
    await expect(visual.locator("img")).toHaveAttribute(
      "src",
      new RegExp(expectedVisuals[index].file.replace(".png", "")),
    );
  }
  await expectActorsWithinStage(page);
}

for (const width of [1024, 1280, 1440] as const) {
  test(`loads all available UnderCity packs at ${width}px PC width`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const pack of UNDERCITY_ZONE_VISUAL_PACKS) {
      const zone = UNDERCITY_ZONES.find((candidate) => candidate.id === pack.zoneId);
      if (!zone) throw new Error(`Canonical ${pack.zoneId} zone missing`);
      for (const blueprint of [...zone.encounters, zone.elite, zone.boss]) {
        await expectUndercityEncounter(page, pack.zoneId, blueprint.id);
      }
    }
  });
}

test("keeps four heroes and every available UnderCity boss readable at the 1024px / 200% zoom equivalent", async ({ page }) => {
  await page.setViewportSize({ width: 512, height: 1000 });
  for (const pack of UNDERCITY_ZONE_VISUAL_PACKS) {
    const zone = UNDERCITY_ZONES.find((candidate) => candidate.id === pack.zoneId);
    if (!zone) throw new Error(`Canonical ${pack.zoneId} zone missing`);
    await expectUndercityEncounter(page, pack.zoneId, zone.boss.id);
  }
});
