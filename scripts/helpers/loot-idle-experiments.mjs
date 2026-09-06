// Counterfactual policies only. All accepted crafts/equips use authoritative commands.
export const IDLE_VARIANTS = {
  idleControl: {},
  idleEfficient: { efficient: true },
  idleQuality: { quality: true },
  idleTargeted: { targeted: true },
  idlePlans: { plans: true },
  idleCombined: { efficient: true, quality: true, targeted: true, plans: true },
};
export const activeRecipes = (lib) => lib.ITEM_LIBRARY.filter((i) => i.catalogStatus === 'active' && i.powerModelId === 'level-bands-v1' && i.blueprintAvailable && i.provenances.includes('forge'));
export const heroBand = (state) => Math.min(8, Math.floor((Math.min(...state.heroes.map((h) => h.level)) - 1) / 5) + 1);
export const bandName = (band) => `${band * 5 - 4}-${band * 5}`;
// Experimental extra drop chance on ordinary wins: 5% early, 12% late.
// Independent of room count and loot already obtained; no per-passage quota.
export const flowItemChance = (band) => 0.05 + 0.01 * (Math.max(1, Math.min(8, band)) - 1);
export function qualityWeights(weights) {
  // Tilt chances without eliminating failures or guaranteeing an improvement.
  const tilted = weights.map(([r, w], i) => [r, w * (1 + i * 0.35)]);
  const total = tilted.reduce((s, [, w]) => s + w, 0);
  return tilted.map(([r, w]) => [r, w * 100 / total]);
}
export function materialTotals(state) { return Object.fromEntries(state.forgeMaterials.map((m) => [m.materialId, m.count])); }
const add = (target, id, count) => { target[id] = (target[id] ?? 0) + count; };
const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export function createIdleForgePolicy(lib, variant, run) {
  const recipes = activeRecipes(lib);
  if (recipes.length !== 48) throw new Error(`Expected 48 active recipes, got ${recipes.length}`);
  const ledger = { initial: {}, startCosts: {}, upgradeCosts: {}, recycled: {}, refunded: {}, crafts: [], bands: {}, blocked: {}, plansGranted: [], conservationError: {} };
  let previewing = false;
  let lastAttempt = -8;
  let cachedKey;
  let cachedChoice;
  let targetRecipe;
  const bandRow = (state) => ledger.bands[bandName(heroBand(state))] ??= { crafts: 0, equipped: 0, equippedLater: 0, fourHeroEquipped: 0, checks: 0, cooldownBlocked: 0, capBlocked: 0, recipeBlocked: 0, materialBlocked: 0, upgradeBlocked: 0, explorations: 0, fourHeroExplorations: 0 };
  const block = (name) => add(ledger.blocked, name, 1);
  function command(state, cmd) {
    const before = materialTotals(state);
    const result = lib.applyTownCommand(state, cmd);
    const after = materialTotals(result.state);
    const field = cmd.type === 'forge.start' ? 'startCosts' : cmd.type === 'forge.finalize' ? 'upgradeCosts' : 'recycled';
    for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const delta = (after[id] ?? 0) - (before[id] ?? 0);
      if (delta) add(ledger[field], id, field === 'recycled' ? delta : -delta);
    }
    if (variant.efficient && ['forge.start', 'forge.finalize'].includes(cmd.type)) {
      // Progressive 10%-30% preservation, only on the paid scrap component.
      // Rare catalysts remain paid in full, including acceptance costs.
      const paid = (before.metal_scrap ?? 0) - (after.metal_scrap ?? 0);
      const refund = Math.floor(paid * (0.10 + 0.20 * (heroBand(state) - 1) / 7));
      if (refund) {
        const stack = result.state.forgeMaterials.find((m) => m.materialId === 'metal_scrap');
        if (stack) stack.count += refund; else result.state.forgeMaterials.push({ materialId: 'metal_scrap', rarity: 'common', count: refund });
        add(ledger.refunded, 'metal_scrap', refund);
      }
    }
    return result.state;
  }
  function preview(state, recipe, level, rarity, optimize) {
    const modifier = recipe.itemType === 'weapon' ? recipe.scaling?.category === 'magic' ? 'magicDamage' : 'physicalDamage' : 'maxHp';
    const accept = lib.rarityRank(rarity) > lib.rarityRank(recipe.minimumRarity);
    const pendingForge = { previewId: `probe-${recipe.id}`, recipeId: recipe.id, itemId: recipe.id, itemType: recipe.itemType, itemLevel: level, powerModelId: recipe.powerModelId, offeredRarity: rarity };
    previewing = true;
    try {
      const forged = lib.applyTownCommand({ ...state, pendingForge }, { type: 'forge.finalize', previewId: pendingForge.previewId, acceptUpgrade: accept, ...(accept ? { chosenModifierStat: modifier } : {}) }).state;
      const id = `item:forge:${pendingForge.previewId}`;
      const projected = { ...forged, heroes: forged.heroes.map((h) => ({ ...h, level: Math.max(h.level, level) })) };
      return optimize(projected, [id]).gains.reduce((s, g) => s + g.absolute, 0);
    } catch (error) {
      if (error.code === 'INSUFFICIENT_MATERIALS') return 0;
      throw error;
    } finally { previewing = false; }
  }
  function choose(state, forgeLevel, optimize, useCache = true) {
    const min = forgeLevel * 5 - 4;
    const cost = lib.scaleForgeMaterialsForItemLevel(lib.FORGE_CRAFT_COST, min);
    if (cost.some((m) => (state.forgeMaterials.find((x) => x.materialId === m.materialId)?.count ?? 0) < m.count)) return null;
    const budget = { ...state, forgeMaterials: state.forgeMaterials.map((m) => ({ ...m, count: m.count - (cost.find((c) => c.materialId === m.materialId)?.count ?? 0) })).filter((m) => m.count > 0) };
    const known = new Set(state.itemBlueprints.filter((p) => p.unlocked).map((p) => p.itemId));
    const weights = lib.FORGE_RARITY_WEIGHTS[state.buildings.forge] ?? lib.FORGE_RARITY_WEIGHTS[1];
    const affordable = rarities.filter((r) => lib.getForgeUpgradeCost(r, min).every((c) => (budget.forgeMaterials.find((m) => m.materialId === c.materialId)?.count ?? 0) >= c.count));
    const key = JSON.stringify([forgeLevel, state.buildings.forge, [...known], affordable, state.heroes.map((h) => [h.id, h.level, h.class, Object.values(h.equipment ?? {}).map((i) => i?.instanceId)]), targetRecipe]);
    if (useCache && key === cachedKey) return cachedChoice;
    let best = null;
    const evaluated = [];
    for (const recipe of recipes) {
      if (!known.has(recipe.id)) continue;
      let score = 0;
      for (const [rolled, weight] of weights) {
        if (!weight) continue;
        const rarity = lib.rarityRank(rolled) > lib.rarityRank(recipe.minimumRarity) ? rolled : recipe.minimumRarity;
        // Real distribution + real acceptance budget; middle and top level avoid
        // discarding a recipe whose upper accessible roll still improves gear.
        for (const level of [min + 2, min + 4]) score += weight / 200 * preview(budget, recipe, level, rarity, optimize);
      }
      if (score > 0.01) { evaluated.push({ id: recipe.id, score }); if (!best || score > best.score) best = { id: recipe.id, score }; }
    }
    // Recraft the same base while it retains at least 80% of the best expected gain.
    if (variant.targeted && best) best = evaluated.find((r) => r.id === targetRecipe && r.score >= best.score * 0.8) ?? best;
    if (useCache) { cachedKey = key; cachedChoice = best?.id ?? null; }
    return best?.id ?? null;
  }
  function equipped(item, state, gain) {
    if (previewing || gain <= 0.01) return;
    const record = ledger.crafts.find((c) => c.id === item.instanceId);
    if (!record || record.equippedAt !== undefined) return;
    record.equippedAt = run.currentExploration;
    record.equippedBand = bandName(heroBand(state));
    record.heroCountAtEquip = state.heroes.length;
    record.gain = gain;
    const row = bandRow(state);
    row.equipped++;
    if (record.exploration !== record.equippedAt) row.equippedLater++;
    if (state.heroes.length === 4) row.fourHeroEquipped++;
  }
  function craft(source, context, exploration, optimize) {
    const row = bandRow(source); row.checks++;
    const band = heroBand(source);
    const cooldown = Math.max(1, 9 - band);
    if (exploration - lastAttempt < cooldown) { row.cooldownBlocked++; return source; }
    const forgeLevel = Math.min(band, source.buildings.forge);
    if (!forgeLevel) { block('forgeUnavailable'); return source; }
    // No arbitrary craft cap; finite positive material costs and one attempt/step.
    lastAttempt = exploration;
    const min = forgeLevel * 5 - 4;
    const startCost = lib.scaleForgeMaterialsForItemLevel(lib.FORGE_CRAFT_COST, min);
    if (startCost.some((c) => (source.forgeMaterials.find((m) => m.materialId === c.materialId)?.count ?? 0) < c.count)) { row.materialBlocked++; block('startMaterials'); return source; }
    const recipeId = choose(source, forgeLevel, optimize);
    if (!recipeId) { row.recipeBlocked++; block('noAffordableExpectedGain'); return source; }
    targetRecipe = recipeId;
    const model = lib.getItemById(recipeId);
    let state = command(source, { type: 'forge.start', recipeId, levelBandMin: min, commandId: `idle-${run.seed}-${exploration}` });
    const pending = state.pendingForge;
    const offered = pending.offeredRarity;
    let accepted = lib.rarityRank(offered) > lib.rarityRank(model.minimumRarity);
    if (accepted && lib.getForgeUpgradeCost(offered, pending.itemLevel).some((c) => (state.forgeMaterials.find((m) => m.materialId === c.materialId)?.count ?? 0) < c.count)) { accepted = false; row.upgradeBlocked++; context.report.rejectedRarityOffers++; }
    state = command(state, { type: 'forge.finalize', previewId: pending.previewId, acceptUpgrade: accepted, ...(accepted ? { chosenModifierStat: model.itemType === 'weapon' ? model.scaling?.category === 'magic' ? 'magicDamage' : 'physicalDamage' : 'maxHp' } : {}) });
    const id = `item:forge:${pending.previewId}`;
    const record = { id, recipeId, exploration, heroBand: bandName(band), itemLevel: pending.itemLevel, offered, accepted, rarity: accepted ? offered : model.minimumRarity };
    ledger.crafts.push(record); row.crafts++;
    const actual = optimize(state, [id]); state = actual.state;
    const equippedNow = record.equippedAt !== undefined;
    previewing = true;
    let projected;
    try { projected = optimize({ ...state, heroes: state.heroes.map((h) => ({ ...h, level: Math.max(h.level, pending.itemLevel) })) }, [id]); } finally { previewing = false; }
    const useful = equippedNow || projected.gains.some((g) => g.absolute > 0.01);
    const legacy = context.report.bands[bandName(forgeLevel)];
    context.report.crafts++; legacy.crafts++;
    legacy.rarityOffers[offered]++; legacy.rarityAccepted[record.rarity]++;
    if (useful) { context.report.usefulCrafts++; legacy.usefulCrafts++; }
    if (equippedNow) { context.report.equippedCrafts++; legacy.equippedCrafts++; }
    if (!useful && state.storedItems.some((i) => i.instanceId === id)) { state = command(state, { type: 'inventory.recycle', instanceId: id }); context.report.recycledCrafts++; }
    return state;
  }
  function unlock(state, encounter) {
    if (!variant.plans || encounter.outcome !== 'victory' || !encounter.enemy?.isBoss) return state;
    // One useful eligible missing family per cleared boss/elite floor, even on repeats.
    if (ledger.plansGranted.some((p) => p.floor === encounter.floor)) return state;
    const known = new Set(state.itemBlueprints.filter((p) => p.unlocked).map((p) => p.itemId));
    const eligible = recipes.filter((i) => !known.has(i.id) && i.blueprintDiscovery.kind === 'random-drop' && encounter.floor >= i.blueprintDiscovery.floorMin && encounter.floor <= i.blueprintDiscovery.floorMax);
    if (!eligible.length || !state.buildings.forge) return state;
    // Plan selection probes a generous budget ONLY for ranking, never campaign state.
    const rich = { ...state, itemBlueprints: eligible.map((i) => ({ itemId: i.id, unlocked: true })), forgeMaterials: ['metal_scrap', 'refined_metal', 'enchanted_fragment', 'arcane_core', 'legendary_essence'].map((materialId, i) => ({ materialId, rarity: rarities[i], count: 1e6 })) };
    const id = choose(rich, Math.min(heroBand(state), state.buildings.forge), (s, ids) => lib.optimizeEquipment(s, ids, true), false);
    if (!id) return state;
    ledger.plansGranted.push({ floor: encounter.floor, itemId: id });
    return { ...state, itemBlueprints: [...state.itemBlueprints.filter((p) => p.itemId !== id), { itemId: id, unlocked: true }] };
  }
  function capture(state) {
    const row = bandRow(state); row.explorations++; if (state.heroes.length === 4) row.fourHeroExplorations++;
    const stock = materialTotals(state);
    for (const id of new Set([...Object.keys(stock), ...Object.keys(run.materialsGross)])) ledger.conservationError[id] = (ledger.initial[id] ?? 0) + (run.materialsGross[id] ?? 0) + (ledger.recycled[id] ?? 0) + (ledger.refunded[id] ?? 0) - (ledger.startCosts[id] ?? 0) - (ledger.upgradeCosts[id] ?? 0) - (stock[id] ?? 0);
    if (Object.values(ledger.conservationError).some((x) => x !== 0) || state.forgeMaterials.some((m) => m.count < 0)) throw new Error('Material conservation failed');
  }
  return { ledger, choose, craft, equipped, unlock, capture, command, initialize: (state) => { ledger.initial = materialTotals(state); } };
}
