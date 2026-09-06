// Focused manual checks against real authoritative commands; no services needed.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createLootTownPolicy } from './helpers/loot-town-policy.mjs';

try {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const compiled = await build({ stdin: { resolveDir: root, loader: 'ts', contents: `
    export { applyTownCommand, initialTownState } from './supabase/functions/game-api/town-authority.ts';
    export { getBuildingUpgradeCost, checkBuildingUnlocked } from './shared/data/buildings.ts';
    export { recruitmentCost } from './shared/domain/hero.ts';
    export { applyIdleAuthority } from './supabase/functions/game-api/idle-authority.ts';
    export { ITEM_LIBRARY } from './shared/domain/items/items.ts';
  ` }, bundle: true, write: false, platform: 'node', format: 'esm' });
  const lib = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const policy = createLootTownPolicy(lib, 0x515050);
  let state = policy.prepare();
  assert.equal(state.heroes.length, 2);
  assert.equal(state.resources.gold, 125);
  assert.equal(state.buildings.habitation, 1);
  assert(Object.entries(state.buildings).filter(([id]) => id !== 'habitation').every(([, level]) => level === 0));
  assert(state.heroes.every((hero) => hero.isActive));
  state = policy.step(state, 0);
  assert.equal(policy.ledger.goldSpent, lib.getBuildingUpgradeCost('ferme', 0).gold + lib.getBuildingUpgradeCost('scierie', 0).gold);
  assert.equal(state.buildings.carriere, 0, 'must wait for actual wood');
  state = lib.applyIdleAuthority(state, '2026-01-01T00:00:00.000Z', new Date('2026-01-01T00:01:00.000Z')).state;
  state = policy.step(state, 1);
  assert.equal(state.buildings.carriere, 1);
  assert.equal(state.buildings.mine, 0, 'must respect floor prerequisite');
  assert.equal(policy.canForge(state, 1), false);

  // Rich fixture is for command validation only, never used in campaigns.
  state = { ...state, highestFloorReached: 3, resources: { gold: 1e6, food: 1e6, wood: 1e6, stone: 1e6, ore: 1e6 } };
  const spentBefore = policy.ledger.goldSpent;
  state = policy.step(state, 2);
  assert.equal(state.heroes.length, 2, 'reserve the first forge before recruitment');
  assert.equal(policy.canForge(state, 1), true);
  state = lib.applyTownCommand(state, { type: 'building.upgrade', buildingId: 'forge' }).state;
  const forgeGold = lib.getBuildingUpgradeCost('forge', 0).gold;
  state = policy.step(state, 2);
  assert.equal(state.heroes.length, 4);
  assert.equal(state.buildings.guilde, 2);
  assert.equal(policy.ledger.recruitmentGold, lib.recruitmentCost(2) + lib.recruitmentCost(3));
  assert.equal(policy.ledger.rosterFourExploration, 2);
  assert.equal(1e6 - state.resources.gold, policy.ledger.goldSpent - spentBefore + forgeGold);
  assert.equal(policy.canForge(state, 1), true);
  assert.equal(state.buildings.forge, 1, 'forge is charged outside the city ledger');
  assert.equal(Object.values(state.citizens).reduce((sum, count) => sum + count, 0), state.totalCitizensCount);
  const beforeRepeat = policy.ledger.goldSpent;
  state = policy.step(state, 3);
  assert.equal(policy.ledger.goldSpent, beforeRepeat, 'completed purchases must not be charged twice');
  assert(Object.values(state.resources).every((value) => value >= 0));
  assert.deepEqual(createLootTownPolicy(lib, 0x515050).prepare(), createLootTownPolicy(lib, 0x515050).prepare());
  const recipes = lib.ITEM_LIBRARY.filter((item) => item.catalogStatus === 'active' && item.powerModelId === 'level-bands-v1' && item.blueprintAvailable && item.provenances.includes('forge'));
  assert.equal(recipes.length, 48);
  const forgeFixture = { ...state, itemBlueprints: recipes.map((item) => ({ itemId: item.id, unlocked: true })), forgeMaterials: [{ materialId: 'metal_scrap', rarity: 'common', count: 100 }, { materialId: 'refined_metal', rarity: 'uncommon', count: 100 }] };
  for (const recipe of recipes) {
    const crafted = lib.applyTownCommand(forgeFixture, { type: 'forge.start', recipeId: recipe.id, levelBandMin: 1, commandId: `probe-${recipe.id}` }).state;
    assert.equal(crafted.pendingForge.recipeId, recipe.id);
  }
  // Even an explicitly unlocked legacy blueprint is not an active recipe.
  const legacyFixture = { ...forgeFixture, itemBlueprints: [...forgeFixture.itemBlueprints, { itemId: 'basic_sword', unlocked: true }] };
  assert.throws(() => lib.applyTownCommand(legacyFixture, { type: 'forge.start', recipeId: 'basic_sword', levelBandMin: 1 }), { code: 'BLUEPRINT_LOCKED' });
  console.log('PASS: all 48 active recipe probes accepted by authoritative forge; legacy recipe rejected');
  console.log('PASS: onboarding, real production, prerequisites, paid recruitment/buildings, gold conservation, allocation, no double spending, deterministic initial state');
} catch (error) {
  console.error(JSON.stringify({ error: error.message, actual: error.actual, expected: error.expected }));
  process.exitCode = 1;
}
