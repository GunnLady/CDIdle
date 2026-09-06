import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { activeRecipes, createIdleForgePolicy, qualityWeights } from './helpers/loot-idle-experiments.mjs';
import { createLootTownPolicy } from './helpers/loot-town-policy.mjs';

try {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const compiled = await build({ stdin: { resolveDir: root, loader: 'ts', contents: `
    export { applyTownCommand, initialTownState } from './supabase/functions/game-api/town-authority.ts';
    export { getBuildingUpgradeCost, checkBuildingUnlocked } from './shared/data/buildings.ts';
    export { recruitmentCost } from './shared/domain/hero.ts';
    export { ITEM_LIBRARY, getItemById, rarityRank } from './shared/domain/items/items.ts';
    export { FORGE_CRAFT_COST, FORGE_RARITY_WEIGHTS, FORGE_RECYCLE_REWARDS, getForgeUpgradeCost, scaleForgeMaterialsForItemLevel } from './shared/domain/forge-economy.ts';
  ` }, bundle: true, write: false, platform: 'node', format: 'esm' });
  const lib = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const recipes = activeRecipes(lib);
  assert.equal(recipes.length, 48);
  assert(recipes.every((r) => r.minimumRarity === 'common'), 'cycle proof must include minimum rarity if active recipes change');
  // A strict drop in total material units on EVERY craft/recycle outcome
  // excludes any zero-input cycle, even when rare materials are converted.
  let cycles = 0;
  for (let band = 1; band <= 8; band++) {
    const level = band * 5 - 4;
    const base = lib.scaleForgeMaterialsForItemLevel(lib.FORGE_CRAFT_COST, level);
    const scrap = base.find((m) => m.materialId === 'metal_scrap').count;
    const refund = Math.floor(scrap * (0.1 + 0.2 * (band - 1) / 7));
    for (const [rarity] of lib.FORGE_RARITY_WEIGHTS[band]) {
      const spent = [...base, ...lib.getForgeUpgradeCost(rarity, level)].reduce((s, m) => s + m.count, 0) - refund;
      const returned = lib.scaleForgeMaterialsForItemLevel(lib.FORGE_RECYCLE_REWARDS[rarity], level).reduce((s, m) => s + m.count, 0);
      assert(spent > returned, `non-consuming cycle: ${band}/${rarity}`); cycles++;
    }
    const tilted = qualityWeights(lib.FORGE_RARITY_WEIGHTS[band]);
    assert(Math.abs(tilted.reduce((s, [, w]) => s + w, 0) - 100) < 1e-9);
    assert(tilted[0][1] > 0, 'quality must retain common failures');
    assert(tilted.every(([, w], i) => lib.FORGE_RARITY_WEIGHTS[band][i][1] > 0 || w === 0), 'no impossible rarity introduced');
  }
  const initial = createLootTownPolicy(lib, 0x515050).prepare();
  const recipe = recipes[0];
  const materials = ['metal_scrap', 'refined_metal', 'enchanted_fragment', 'arcane_core', 'legendary_essence'];
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const state = { ...initial, buildings: { ...initial.buildings, forge: 5 }, forgeMaterials: materials.map((materialId, i) => ({ materialId, rarity: rarities[i], count: 100 })), itemBlueprints: [{ itemId: recipe.id, unlocked: true }] };
  const run = { seed: 3, materialsGross: {}, currentExploration: 0 };
  const policy = createIdleForgePolicy(lib, { efficient: true }, run);
  policy.initialize(state);
  // Deliberately synthetic utility isolates recipe selection; forge previews
  // and resource validation remain real. Only epic/legendary improve this fixture.
  const onlyHighProc = (s, ids) => ({ state: s, gains: ids.some((id) => ['epic', 'legendary'].includes(s.storedItems.find((i) => i.instanceId === id)?.rarity)) ? [{ absolute: 10 }] : [] });
  assert.equal(policy.choose(state, 5, onlyHighProc, false), recipe.id);
  const poor = { ...state, forgeMaterials: state.forgeMaterials.filter((m) => ['metal_scrap', 'refined_metal'].includes(m.materialId)) };
  assert.equal(policy.choose(poor, 5, onlyHighProc, false), null, 'must not count unaffordable procs');
  const exactBudget = { ...state, forgeMaterials: lib.scaleForgeMaterialsForItemLevel(lib.FORGE_CRAFT_COST, 21) };
  assert.equal(policy.choose(exactBudget, 5, onlyHighProc, false), null, 'fully consumed stacks must be removed');
  const cmd = { type: 'forge.start', recipeId: recipe.id, levelBandMin: 21, commandId: 'deterministic-policy' };
  const a = policy.command(state, cmd);
  const other = createIdleForgePolicy(lib, { efficient: true }, { seed: 3, materialsGross: {} }); other.initialize(state);
  assert.deepEqual(a, other.command(state, cmd));
  let finished = policy.command(a, { type: 'forge.finalize', previewId: a.pendingForge.previewId, acceptUpgrade: false });
  finished = policy.command(finished, { type: 'inventory.recycle', instanceId: `item:forge:${a.pendingForge.previewId}` });
  policy.capture(finished);
  assert(Object.values(policy.ledger.conservationError).every((v) => v === 0));
  policy.ledger.crafts.push({ id: 'tracked', exploration: 0 });
  run.currentExploration = 20;
  policy.equipped({ instanceId: 'tracked' }, state, 5);
  policy.equipped({ instanceId: 'tracked' }, state, 8);
  assert.equal(policy.ledger.bands['1-5'].equipped, 1, 'transfers must not double-count');
  assert.equal(policy.ledger.bands['1-5'].equippedLater, 1);
  assert.equal(policy.ledger.bands['1-5'].fourHeroEquipped, 0, 'partial roster is not a group of four');
  console.log(`PASS: 48 active families; ${cycles} strictly consuming recycle cycles; normalized possible rarities; affordable high-proc selection; exact budgets; deterministic commands; material conservation; delayed equipment and transfer deduplication`);
} catch (error) {
  console.error(JSON.stringify({ error: error.message, code: error.code, actual: error.actual, expected: error.expected }));
  process.exitCode = 1;
}
