// Experimental resource helpers for the next campaign, never production rules.
import { createIdleForgePolicy, heroBand, bandName } from './loot-idle-experiments.mjs';

export function missingForgeMaterials(materials, cost) {
  return cost.filter((c) => (materials.find((m) => m.materialId === c.materialId)?.count ?? 0) < c.count).map((c) => c.materialId);
}

export function recyclingScrapSupplement(lib, item) {
  if (item.powerModelId !== 'level-bands-v1') return 0;
  const level = item.itemLevel;
  const base = lib.scaleForgeMaterialsForItemLevel(lib.FORGE_CRAFT_COST, level);
  const reward = lib.scaleForgeMaterialsForItemLevel(lib.FORGE_RECYCLE_REWARDS[item.rarity], level);
  const baseScrap = base.find((m) => m.materialId === 'metal_scrap')?.count ?? 0;
  const recycledScrap = reward.find((m) => m.materialId === 'metal_scrap')?.count ?? 0;
  // Every rarity retains at least the common recycle's one-third base return.
  // Existing larger returns are preserved. Only epic/legendary change today.
  return Math.max(0, Math.floor(baseScrap / 3) - recycledScrap);
}

export function searchForgeWeights(weights, forgeLevel, mode) {
  const endings = { moderate:[50,30,15,4,1], scarce:[65,25,8,1.8,.2], idleRhythm:[30,40,22,7,1] };
  if (!endings[mode]) throw new Error(`Unknown forge search mode: ${mode}`);
  const first = [72,23,5,0,0];
  const progress = (Math.max(1,Math.min(8,forgeLevel))-1)/7;
  const candidate = weights.map(([rarity,possible],i) => [rarity, possible > 0 ? first[i]+(endings[mode][i]-first[i])*progress : 0]);
  const sum = candidate.reduce((s,[,w]) => s+w,0);
  return candidate.map(([rarity,w]) => [rarity,100*w/sum]);
}

export function createBudgetForgePolicy(lib, variant, run) {
  const supplementLedger = {};
  const upgradedLib = { ...lib, applyTownCommand(source, command) {
    const item = command.type === 'inventory.recycle' ? source.storedItems.find((i) => i.instanceId === command.instanceId) : null;
    const result = lib.applyTownCommand(source, command);
    const extra = variant.recycleBase && item ? recyclingScrapSupplement(lib, item) : 0;
    if (extra) {
      const stack = result.state.forgeMaterials.find((m) => m.materialId === 'metal_scrap');
      if (stack) stack.count += extra; else result.state.forgeMaterials.push({ materialId:'metal_scrap', rarity:'common', count:extra });
      supplementLedger.metal_scrap = (supplementLedger.metal_scrap ?? 0) + extra;
    }
    return result;
  } };
  const policy = createIdleForgePolicy(upgradedLib, variant, run);
  policy.ledger.recycleSupplement = supplementLedger; // Already included in recycled; never add twice in conservation.
  return { ...policy, capture(state, report) {
    policy.capture(state);
    if (!report) return;
    for (const record of policy.ledger.crafts) {
      record.craftedSeconds ??= report.simulatedSeconds;
      if (record.equippedAt !== undefined) record.equippedSeconds ??= report.simulatedSeconds;
    }
  }, equipped(item, state, gain, previousScore) {
    const record = policy.ledger.crafts.find((c) => c.id === item.instanceId);
    const first = record && record.equippedAt === undefined;
    policy.equipped(item,state,gain);
    if (first && record.equippedAt !== undefined) record.relativeEquipmentGain = previousScore > 0 ? gain/previousScore : null;
  }, craft(source, context, exploration, optimize) {
    const band = bandName(heroBand(source));
    const before = policy.ledger.bands[band]?.materialBlocked ?? 0;
    const state = policy.craft(source, context, exploration, optimize);
    const row = policy.ledger.bands[band];
    if (row.materialBlocked > before) {
      const min = Math.min(heroBand(source),source.buildings.forge)*5-4;
      const missing = missingForgeMaterials(source.forgeMaterials,lib.scaleForgeMaterialsForItemLevel(lib.FORGE_CRAFT_COST,min));
      if (!missing.length) throw new Error('Blocked craft without a missing material');
      row.materialBlockedById ??= {};
      for (const id of missing) row.materialBlockedById[id] = (row.materialBlockedById[id] ?? 0) + 1;
    }
    return state;
  } };
}
