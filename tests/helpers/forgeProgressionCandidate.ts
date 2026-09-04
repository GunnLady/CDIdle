import type {
  CanonicalDungeonEncounterRecord,
  CanonicalGameState,
  CanonicalRarity,
  CanonicalStoredItemInstance,
} from "../../shared/contracts/authoritative";
import {
  ITEM_LIBRARY,
  getItemById,
  rarityRank,
} from "../../shared/domain/items/items";
import { FORGE_PROGRESSION_LEVELS } from "../../shared/data/forge-progression";
import { getBuildingUpgradeCost } from "../../shared/data/buildings";
import { resolveAuthoritativeNoviceItemModifiers } from "../../supabase/functions/game-api/novice-stats-authority";
import type { CanonicalRng } from "../../supabase/functions/game-api/authoritative-rng";
import { applyTownCommand } from "../../supabase/functions/game-api/town-authority";
import type { ItemLevelBand } from "./heroXpTier1Campaign";

export const FORGE_CANDIDATE_ENABLED = process.env.FORGE_CANDIDATE === "1";
const CRAFT_COOLDOWN_EXPLORATIONS = 8;
const MAX_CRAFTS_PER_BAND = 8;

type ResourceKey = "gold" | "food" | "wood" | "stone" | "ore";
export const FORGE_CANDIDATE_LEVELS = FORGE_PROGRESSION_LEVELS.map((entry) => ({
  level: entry.level,
  levelMin: entry.itemLevelRange.min,
  levelMax: entry.itemLevelRange.max,
  requiredFloor: entry.requiredFloor,
}));

export type ForgeCandidateBandResult = {
  heroEntryExploration?: number;
  heroExitExploration?: number;
  buildingUpgradeExploration?: number;
  firstUsefulCraftExploration?: number;
  firstEquippedCraftExploration?: number;
  plansKnownAtUpgrade?: number;
  firstMaterialsAvailableExploration?: number;
  firstRecipeAvailableExploration?: number;
  materialBlockedChecks: number;
  recipeBlockedChecks: number;
  crafts: number;
  usefulCrafts: number;
  equippedCrafts: number;
  rarityOffers: Record<CanonicalRarity, number>;
  rarityAccepted: Record<CanonicalRarity, number>;
};

export type ForgeCandidateReport = {
  finalLevel: number;
  buildingUpgrades: number;
  bossPlans: number;
  treasurePlanRolls: number;
  treasurePlans: number;
  emptyPlanRolls: number;
  knownPlans: number;
  knownProgressionPlans: number;
  crafts: number;
  usefulCrafts: number;
  equippedCrafts: number;
  rejectedRarityOffers: number;
  recycledCrafts: number;
  bands: Record<ItemLevelBand, ForgeCandidateBandResult>;
};

export type ForgeCandidateContext = {
  rng: CanonicalRng;
  lastCraftAttempt: number;
  report: ForgeCandidateReport;
};

type OptimizeEquipment = (
  source: CanonicalGameState,
  candidateInstanceIds: readonly string[],
) => {
  state: CanonicalGameState;
  gains: Array<{ absolute: number; relative: number; rarity: CanonicalRarity }>;
};

const emptyRarityCounters = (): Record<CanonicalRarity, number> => ({
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
});

export function createForgeCandidateContext(rng: CanonicalRng): ForgeCandidateContext {
  return {
    rng,
    lastCraftAttempt: -CRAFT_COOLDOWN_EXPLORATIONS,
    report: {
      finalLevel: 0,
      buildingUpgrades: 0,
      bossPlans: 0,
      treasurePlanRolls: 0,
      treasurePlans: 0,
      emptyPlanRolls: 0,
      knownPlans: 0,
      knownProgressionPlans: 0,
      crafts: 0,
      usefulCrafts: 0,
      equippedCrafts: 0,
      rejectedRarityOffers: 0,
      recycledCrafts: 0,
      bands: Object.fromEntries(FORGE_CANDIDATE_LEVELS.map((entry) => [
        `${entry.levelMin}-${entry.levelMax}`,
        {
          crafts: 0,
          usefulCrafts: 0,
          equippedCrafts: 0,
          materialBlockedChecks: 0,
          recipeBlockedChecks: 0,
          rarityOffers: emptyRarityCounters(),
          rarityAccepted: emptyRarityCounters(),
        },
      ])) as Record<ItemLevelBand, ForgeCandidateBandResult>,
    },
  };
}

export function forgeCandidateBuildingCost(targetLevel: number): Record<ResourceKey, number> {
  return getBuildingUpgradeCost("forge", targetLevel - 1);
}

function bandForForgeLevel(level: number): ItemLevelBand {
  const definition = FORGE_CANDIDATE_LEVELS[level - 1]!;
  return `${definition.levelMin}-${definition.levelMax}` as ItemLevelBand;
}

export function prepareForgeCandidateTown(state: CanonicalGameState): CanonicalGameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      ferme: Math.max(1, state.buildings.ferme ?? 0),
      scierie: Math.max(1, state.buildings.scierie ?? 0),
      carriere: Math.max(1, state.buildings.carriere ?? 0),
      mine: Math.max(1, state.buildings.mine ?? 0),
      guilde: Math.max(1, state.buildings.guilde ?? 0),
      forge: 0,
    },
    itemBlueprints: state.itemBlueprints.map((entry) => ({ ...entry })),
  };
}

export function allocateForgeCandidateWorkers(
  state: CanonicalGameState,
  context: ForgeCandidateContext,
): CanonicalGameState {
  const forgeLevel = Math.max(0, Number(state.buildings.forge ?? 0));
  if (forgeLevel >= 8) return state;
  const cost = forgeCandidateBuildingCost(forgeLevel + 1);
  const roles = [
    { role: "farmers" as const, resource: "food" as const },
    { role: "woodcutters" as const, resource: "wood" as const },
    { role: "quarrymen" as const, resource: "stone" as const },
    { role: "miners" as const, resource: "ore" as const },
  ].sort((left, right) => {
    const leftNeed = Math.max(0, cost[left.resource] - state.resources[left.resource]) / cost[left.resource];
    const rightNeed = Math.max(0, cost[right.resource] - state.resources[right.resource]) / cost[right.resource];
    return rightNeed - leftNeed;
  });
  const allocations = { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 0 };
  for (let index = 0; index < state.totalCitizensCount; index += 1) {
    allocations[roles[index % Math.min(3, roles.length)]!.role] += 1;
  }
  context.report.finalLevel = forgeLevel;
  return { ...state, citizens: allocations };
}

export function trackForgeCandidateHeroBand(
  context: ForgeCandidateContext,
  partyLevel: number,
  exploration: number,
): void {
  const currentBand = bandForForgeLevel(Math.min(8, Math.floor((Math.max(1, partyLevel) - 1) / 5) + 1));
  const current = context.report.bands[currentBand];
  current.heroEntryExploration ??= exploration;
  for (const definition of FORGE_CANDIDATE_LEVELS) {
    const band = bandForForgeLevel(definition.level);
    if (definition.levelMax < partyLevel) {
      context.report.bands[band].heroExitExploration ??= exploration;
    }
  }
}

function affordableResources(state: CanonicalGameState, cost: Record<ResourceKey, number>): boolean {
  return (Object.keys(cost) as ResourceKey[])
    .every((resource) => state.resources[resource] >= cost[resource]);
}

function applyAvailableBuildingUpgrades(
  source: CanonicalGameState,
  context: ForgeCandidateContext,
  exploration: number,
): CanonicalGameState {
  let state = source;
  while (Number(state.buildings.forge ?? 0) < 8) {
    const targetLevel = Number(state.buildings.forge ?? 0) + 1;
    const definition = FORGE_CANDIDATE_LEVELS[targetLevel - 1]!;
    if (state.highestFloorReached < definition.requiredFloor) break;
    const cost = getBuildingUpgradeCost("forge", targetLevel - 1);
    if (!affordableResources(state, cost)) break;
    state = applyTownCommand(state, { type: "building.upgrade", buildingId: "forge" }).state;
    const band = bandForForgeLevel(targetLevel);
    const known = new Set(state.itemBlueprints.filter((entry) => entry.unlocked).map((entry) => entry.itemId));
    context.report.bands[band].buildingUpgradeExploration = exploration;
    context.report.bands[band].plansKnownAtUpgrade = known.size;
    context.report.buildingUpgrades += 1;
    context.report.finalLevel = targetLevel;
  }
  return state;
}

function maxRarity(left: CanonicalRarity, right: CanonicalRarity): CanonicalRarity {
  return rarityRank(left) >= rarityRank(right) ? left : right;
}

function createCandidateItem(
  itemId: string,
  itemLevel: number,
  rarity: CanonicalRarity,
  instanceId: string,
): CanonicalStoredItemInstance {
  const model = getItemById(itemId);
  if (!model) throw new Error(`UNKNOWN_FORGE_CANDIDATE:${itemId}`);
  return {
    instanceId,
    itemId,
    itemLevel,
    powerModelId: model.powerModelId,
    rarity,
    modifiers: resolveAuthoritativeNoviceItemModifiers(
      itemId,
      rarity,
      undefined,
      itemLevel,
      model.powerModelId,
      instanceId,
    ),
  };
}

function chooseManagedRecipe(
  state: CanonicalGameState,
  forgeLevel: number,
  optimizeEquipment: OptimizeEquipment,
): string | null {
  const definition = FORGE_CANDIDATE_LEVELS[forgeLevel - 1]!;
  const evaluationRarity: CanonicalRarity = "rare";
  const unlocked = new Set(state.itemBlueprints.filter((entry) => entry.unlocked).map((entry) => entry.itemId));
  let best: { itemId: string; gain: number } | null = null;
  for (const item of ITEM_LIBRARY) {
    if (!unlocked.has(item.id) || !item.blueprintAvailable || !item.provenances.includes("forge")) continue;
    const minimum = Math.max(item.levelRange.min, definition.levelMin);
    const maximum = Math.min(item.levelRange.max, definition.levelMax);
    if (minimum > maximum) continue;
    const evaluationLevel = Math.round((minimum + maximum) / 2);
    const instance = createCandidateItem(
      item.id,
      evaluationLevel,
      maxRarity(item.minimumRarity, evaluationRarity),
      `candidate:preview:${item.id}`,
    );
    const projectedState = {
      ...state,
      heroes: state.heroes.map((hero) => ({ ...hero, level: Math.max(hero.level, evaluationLevel) })),
      storedItems: [...state.storedItems, instance],
    };
    const evaluated = optimizeEquipment(
      projectedState,
      [instance.instanceId],
    );
    const gain = evaluated.gains.reduce((sum, entry) => sum + entry.absolute, 0);
    if (gain > 0.01 && (!best || gain > best.gain)) best = { itemId: item.id, gain };
  }
  return best?.itemId ?? null;
}

function attemptManagedCraft(
  source: CanonicalGameState,
  context: ForgeCandidateContext,
  exploration: number,
  optimizeEquipment: OptimizeEquipment,
): CanonicalGameState {
  if (exploration - context.lastCraftAttempt < CRAFT_COOLDOWN_EXPLORATIONS) return source;
  const forgeLevel = Math.max(0, Math.min(8, Number(source.buildings.forge ?? 0)));
  if (forgeLevel === 0) return source;
  const minimumHeroLevel = Math.min(...source.heroes.map((hero) => hero.level));
  const heroBandLevel = Math.max(1, Math.min(8, Math.floor((minimumHeroLevel - 1) / 5) + 1));
  const craftBandLevel = Math.min(forgeLevel, heroBandLevel);
  const band = bandForForgeLevel(craftBandLevel);
  const bandReport = context.report.bands[band];
  if (bandReport.usefulCrafts > 0) return source;
  if (bandReport.crafts >= MAX_CRAFTS_PER_BAND) return source;
  const recipeId = chooseManagedRecipe(source, craftBandLevel, optimizeEquipment);
  if (!recipeId) {
    bandReport.recipeBlockedChecks += 1;
    return source;
  }
  bandReport.firstRecipeAvailableExploration ??= exploration;
  context.lastCraftAttempt = exploration;
  const model = getItemById(recipeId)!;
  let started: CanonicalGameState;
  try {
    started = applyTownCommand(source, {
      type: "forge.start",
      recipeId,
      levelBandMin: FORGE_CANDIDATE_LEVELS[craftBandLevel - 1]!.levelMin,
      commandId: `candidate-${context.rng.snapshot().seed}-${exploration}`,
    }).state;
  } catch (error) {
    if (error instanceof Error && error.message.includes("insufficient forge materials")) {
      bandReport.materialBlockedChecks += 1;
      return source;
    }
    throw error;
  }
  bandReport.firstMaterialsAvailableExploration ??= exploration;
  const pending = started.pendingForge!;
  const itemLevel = pending.itemLevel;
  const offeredRarity = pending.offeredRarity;
  bandReport.rarityOffers[offeredRarity] += 1;
  let state = started;
  let acceptedRarity: CanonicalRarity = model.minimumRarity;
  if (rarityRank(offeredRarity) > rarityRank(model.minimumRarity)) {
    const chosenModifierStat = model.itemType === "weapon" ? "physicalDamage" : "maxHp";
    try {
      state = applyTownCommand(state, {
        type: "forge.finalize",
        previewId: pending.previewId,
        acceptUpgrade: true,
        chosenModifierStat,
      }).state;
      acceptedRarity = offeredRarity;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("insufficient forge materials")) throw error;
      context.report.rejectedRarityOffers += 1;
      state = applyTownCommand(state, {
        type: "forge.finalize",
        previewId: pending.previewId,
        acceptUpgrade: false,
      }).state;
    }
  } else {
    state = applyTownCommand(state, {
      type: "forge.finalize",
      previewId: pending.previewId,
      acceptUpgrade: false,
    }).state;
  }
  bandReport.rarityAccepted[acceptedRarity] += 1;
  const instance = state.storedItems.find((entry) => entry.instanceId === `item:forge:${pending.previewId}`)!;
  const projected = optimizeEquipment(
    {
      ...state,
      heroes: state.heroes.map((hero) => ({ ...hero, level: Math.max(hero.level, itemLevel) })),
    },
    [instance.instanceId],
  );
  const optimized = optimizeEquipment(
    state,
    [instance.instanceId],
  );
  state = optimized.state;
  const useful = projected.gains.some((gain) => gain.absolute > 0.01);
  const equipped = optimized.gains.some((gain) => gain.absolute > 0.01);
  context.report.crafts += 1;
  context.report.bands[band].crafts += 1;
  if (useful) {
    context.report.usefulCrafts += 1;
    context.report.bands[band].usefulCrafts += 1;
    context.report.bands[band].firstUsefulCraftExploration ??= exploration;
  }
  if (equipped) {
    context.report.equippedCrafts += 1;
    context.report.bands[band].equippedCrafts += 1;
    context.report.bands[band].firstEquippedCraftExploration ??= exploration;
  }
  if (!useful) {
    try {
      state = applyTownCommand(state, {
        type: "inventory.recycle",
        instanceId: instance.instanceId,
      }).state;
      context.report.recycledCrafts += 1;
    } catch {
      // A crafted item that was equipped or otherwise consumed is not recyclable.
    }
  }
  return state;
}

export function advanceForgeCandidate(
  source: CanonicalGameState,
  encounter: CanonicalDungeonEncounterRecord,
  context: ForgeCandidateContext,
  exploration: number,
  optimizeEquipment: OptimizeEquipment,
): CanonicalGameState {
  const plans = encounter.rewards.loot.filter((loot) => loot.type === "blueprint").length;
  if (encounter.kind === "treasure" && encounter.outcome === "victory") {
    const eligibleFloor = ITEM_LIBRARY.some((item) => (
      item.blueprintDiscovery.kind === "random-drop"
      && item.blueprintDiscovery.sources.includes("treasure")
      && encounter.floor >= item.blueprintDiscovery.floorMin
      && encounter.floor <= item.blueprintDiscovery.floorMax
    ));
    if (eligibleFloor) context.report.treasurePlanRolls += 1;
    context.report.treasurePlans += plans;
  } else {
    context.report.bossPlans += plans;
  }
  let state = source;
  state = applyAvailableBuildingUpgrades(state, context, exploration);
  state = attemptManagedCraft(state, context, exploration, optimizeEquipment);
  const unlocked = state.itemBlueprints.filter((entry) => entry.unlocked);
  context.report.knownPlans = unlocked.length;
  context.report.knownProgressionPlans = unlocked.filter((entry) => (
    getItemById(entry.itemId)?.powerModelId === "level-bands-v1"
  )).length;
  context.report.finalLevel = Number(state.buildings.forge ?? 0);
  return state;
}

export function finalizeForgeCandidateReport(
  context: ForgeCandidateContext,
  exploration: number,
): ForgeCandidateReport {
  for (const band of Object.values(context.report.bands)) {
    if (band.heroEntryExploration !== undefined) band.heroExitExploration ??= exploration;
  }
  return context.report;
}
