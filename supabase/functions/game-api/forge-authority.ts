import type { CanonicalRng } from "./authoritative-rng.ts";
import { resolveAuthoritativeNoviceItemModifiers } from "./novice-stats-authority.ts";
import { ITEM_LIBRARY, getItemById, rarityRank } from "../../../shared/domain/items/items.ts";
import { nameItem } from "../../../shared/domain/items/naming.ts";
import {
  RAT_KING_SIGNATURE_IDS,
  RAT_KING_SIGNATURE_PARAMETERS,
  createRatKingSignatureInstance,
  type RatKingSignatureId,
} from "../../../shared/domain/items/items_rat_king.ts";
import type {
  CanonicalForgeMaterialStack,
  CanonicalGameState,
  CanonicalPendingForge,
  CanonicalStateTransition,
  CanonicalStoredItemInstance,
} from "../../../shared/contracts/authoritative.ts";
import type { CanonicalStatModifier } from "../../../shared/domain/hero-stats.ts";
import {
  scaleModifierByItemLevel,
  scaleModifierByRarity,
} from "../../../shared/domain/items/scaling.ts";
import {
  FORGE_PROGRESSION_LEVELS,
  getForgeLevelForItemLevel,
} from "../../../shared/data/forge-progression.ts";
import {
  FORGE_CRAFT_COST,
  FORGE_RARITY_WEIGHTS,
  FORGE_RECYCLE_REWARDS,
  getForgeUpgradeCost,
  scaleForgeMaterialsForItemLevel,
} from "../../../shared/domain/forge-economy.ts";
export { FORGE_RARITY_WEIGHTS } from "../../../shared/domain/forge-economy.ts";
export { DEFAULT_NOVICE_ITEM_BLUEPRINTS } from "./forge-blueprints.ts";

export type ForgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ForgeMaterialStack = CanonicalForgeMaterialStack;
type ItemInstance = CanonicalStoredItemInstance;
type Recipe = {
  itemId: string;
  itemType: "weapon" | "offhand" | "armor" | "accessory";
  minimumRarity: ForgeRarity;
  levelRange: { min: number; max: number };
  powerModelId: 'legacy-fixed-v1' | 'level-bands-v1';
};

export type ForgeCommand =
  | { type: 'forge.start'; recipeId: string; levelBandMin?: number; commandId?: string }
  | { type: "forge.finalize"; previewId: string; acceptUpgrade?: boolean; chosenModifierStat?: string }
  | { type: "forge.cancel"; previewId: string }
  | { type: "inventory.recycle"; instanceId: string };

export class ForgeCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const RARITIES = new Set<ForgeRarity>(["common", "uncommon", "rare", "epic", "legendary"]);
const isRatKingSignature = (itemId: string): itemId is RatKingSignatureId => RAT_KING_SIGNATURE_IDS.includes(itemId as RatKingSignatureId);

const ALL_RECIPES: Record<string, Recipe> = Object.fromEntries(
  ITEM_LIBRARY
    .filter((item) => item.blueprintAvailable && item.provenances.includes("forge"))
    .map((item) => [item.id, {
      itemId: item.id,
      itemType: item.itemType,
      minimumRarity: item.minimumRarity,
      levelRange: { ...item.levelRange },
      powerModelId: item.powerModelId,
    }]),
);
const RECIPES: Record<string, Recipe> = Object.fromEntries(
  Object.entries(ALL_RECIPES).filter(([itemId]) => {
    const item = getItemById(itemId);
    return item?.catalogStatus === "active" && (item.powerModelId === "level-bands-v1" || RAT_KING_SIGNATURE_IDS.includes(itemId as RatKingSignatureId));
  }),
);

const WEAPON_MODIFIERS = new Set(["physicalDamage", "magicDamage", "criticalChance", "speed"]);
const ARMOR_MODIFIERS = new Set([
  "maxHp", "maxMana", "physicalDefense", "magicDefense", "dodgeChance",
  "fireResistance", "iceResistance", "waterResistance", "earthResistance", "windResistance",
  "lightningResistance", "holyResistance", "darkResistance", "natureResistance", "arcaneResistance",
  "poisonResistance", "bloodResistance", "soundResistance", "radiantResistance",
]);

const MODIFIER_VALUES: Record<string, CanonicalStatModifier> = {
  physicalDamage: { stat: "physicalDamage", type: "flat", value: 1 },
  magicDamage: { stat: "magicDamage", type: "flat", value: 1 },
  criticalChance: { stat: "criticalChance", type: "flat", value: 1 },
  speed: { stat: "speed", type: "percent", value: 2 },
  maxHp: { stat: "maxHp", type: "percent", value: 3 },
  maxMana: { stat: "maxMana", type: "percent", value: 3 },
  physicalDefense: { stat: "physicalDefense", type: "flat", value: 1 },
  magicDefense: { stat: "magicDefense", type: "flat", value: 1 },
  dodgeChance: { stat: "dodgeChance", type: "flat", value: 1 },
  fireResistance: { stat: "fireResistance", type: "flat", value: 2 },
  iceResistance: { stat: "iceResistance", type: "flat", value: 2 },
  waterResistance: { stat: "waterResistance", type: "flat", value: 2 },
  earthResistance: { stat: "earthResistance", type: "flat", value: 2 },
  windResistance: { stat: "windResistance", type: "flat", value: 2 },
  lightningResistance: { stat: "lightningResistance", type: "flat", value: 2 },
  holyResistance: { stat: "holyResistance", type: "flat", value: 2 },
  darkResistance: { stat: "darkResistance", type: "flat", value: 2 },
  natureResistance: { stat: "natureResistance", type: "flat", value: 2 },
  arcaneResistance: { stat: "arcaneResistance", type: "flat", value: 2 },
  poisonResistance: { stat: "poisonResistance", type: "flat", value: 2 },
  bloodResistance: { stat: "bloodResistance", type: "flat", value: 2 },
  soundResistance: { stat: "soundResistance", type: "flat", value: 2 },
  radiantResistance: { stat: "radiantResistance", type: "flat", value: 2 },
};

const consume = (source: ForgeMaterialStack[], cost: readonly ForgeMaterialStack[]) => {
  const next = clone(source);
  for (const entry of cost) {
    const stack = next.find((candidate) => candidate.materialId === entry.materialId && candidate.rarity === entry.rarity);
    if (!stack || stack.count < entry.count) throw new ForgeCommandError("INSUFFICIENT_MATERIALS", "insufficient forge materials");
    stack.count -= entry.count;
  }
  return next.filter((entry) => entry.count > 0);
};

const addMaterial = (target: ForgeMaterialStack[], reward: ForgeMaterialStack) => {
  const existing = target.find((entry) => entry.materialId === reward.materialId && entry.rarity === reward.rarity);
  if (existing) existing.count += reward.count;
  else target.push({ ...reward });
};

export const rollOfferedRarity = (rng: CanonicalRng, forgeLevel: number): ForgeRarity => {
  const roll = rng.next() * 100;
  let ceiling = 0;
  for (const [rarity, weight] of FORGE_RARITY_WEIGHTS[forgeLevel] ?? FORGE_RARITY_WEIGHTS[1]) {
    ceiling += weight;
    if (roll < ceiling) return rarity;
  }
  return "legendary";
};

const ensureRarity = (rarity: unknown): ForgeRarity => {
  if (!RARITIES.has(rarity as ForgeRarity)) throw new ForgeCommandError("INVALID_COMMAND", "rarity is invalid");
  return rarity as ForgeRarity;
};

const FORGE_LEVEL_BAND_STARTS = FORGE_PROGRESSION_LEVELS.map((entry) => entry.itemLevelRange.min);

function resolveForgeItemLevelRange(
  recipe: Recipe,
  requestedBandMin: number | undefined,
  forgeLevel: number,
): { minimum: number; maximum: number } {
  if (recipe.powerModelId === 'legacy-fixed-v1') {
    if (forgeLevel < getForgeLevelForItemLevel(recipe.levelRange.min)) {
      throw new ForgeCommandError('ITEM_LEVEL_LOCKED', 'forge level band is locked');
    }
    return { minimum: recipe.levelRange.min, maximum: recipe.levelRange.min };
  }
  const maximumUnlockedLevel = Math.min(40, Math.max(1, forgeLevel) * 5);
  const defaultBandMin = [...FORGE_LEVEL_BAND_STARTS]
    .reverse()
    .find((start) => start <= maximumUnlockedLevel && start <= recipe.levelRange.max)
    ?? 1;
  const bandMin = requestedBandMin ?? defaultBandMin;
  if (!FORGE_LEVEL_BAND_STARTS.includes(bandMin as typeof FORGE_LEVEL_BAND_STARTS[number])) {
    throw new ForgeCommandError('INVALID_ITEM_LEVEL', 'forge level band is invalid');
  }
  const minimum = Math.max(recipe.levelRange.min, bandMin);
  const maximum = Math.min(recipe.levelRange.max, bandMin + 4, maximumUnlockedLevel);
  if (maximum < minimum) throw new ForgeCommandError('ITEM_LEVEL_LOCKED', 'forge level band is locked');
  return { minimum, maximum };
}

function rollForgeItemLevel(
  range: { minimum: number; maximum: number },
  rng: CanonicalRng,
): number {
  const { minimum, maximum } = range;
  return minimum === maximum ? minimum : minimum + rng.nextInt(maximum - minimum + 1);
}

export function applyForgeCommand(
  current: CanonicalGameState,
  command: Record<string, unknown>,
  rng?: CanonicalRng,
): CanonicalStateTransition {
  const materials = clone(current.forgeMaterials);
  const items = clone(current.storedItems);
  const pending: CanonicalPendingForge | null = clone(current.pendingForge ?? null);
  const typed = command as ForgeCommand;
  const forgeLevel = Number(current.buildings.forge ?? 0);
  const forgeUnlocked = forgeLevel >= 1;
  if (!forgeUnlocked) throw new ForgeCommandError("FORGE_LOCKED", "forge building is required");

  if (typed.type === "forge.start") {
    const recipe = RECIPES[typed.recipeId];
    const blueprints = current.itemBlueprints;
    if (!recipe || !blueprints.some((entry) => entry.itemId === typed.recipeId && entry.unlocked === true)) {
      throw new ForgeCommandError("BLUEPRINT_LOCKED", "forge blueprint is locked");
    }
    if (pending) throw new ForgeCommandError("FORGE_PENDING", "a forge preview is already pending");
    if (!rng) throw new ForgeCommandError("RNG_REQUIRED", "canonical RNG is required");
    const previewId = `preview-${typed.commandId ?? "command"}`;
    const itemLevelRange = resolveForgeItemLevelRange(recipe, typed.levelBandMin, forgeLevel);
    const requestedBandMin = typed.levelBandMin ?? (recipe.powerModelId === 'level-bands-v1'
      ? FORGE_LEVEL_BAND_STARTS[Math.min(forgeLevel, FORGE_LEVEL_BAND_STARTS.length) - 1]
      : recipe.levelRange.min);
    const costLevel = recipe.powerModelId === 'level-bands-v1' ? requestedBandMin : recipe.levelRange.min;
    const signatureRecipe = isRatKingSignature(recipe.itemId);
    const craftCost = signatureRecipe
      ? RAT_KING_SIGNATURE_PARAMETERS.recipeCosts
      : recipe.powerModelId === 'level-bands-v1'
        ? scaleForgeMaterialsForItemLevel(FORGE_CRAFT_COST, costLevel)
        : FORGE_CRAFT_COST;
    const nextMaterials = consume(materials, craftCost);
    const rolledRarity = signatureRecipe
      ? (rng.next() < RAT_KING_SIGNATURE_PARAMETERS.legendaryCraftChance ? "legendary" : "epic")
      : rollOfferedRarity(rng, forgeLevel);
    const offeredRarity = rarityRank(rolledRarity) > rarityRank(recipe.minimumRarity)
      ? rolledRarity
      : recipe.minimumRarity;
    const itemLevel = rollForgeItemLevel(itemLevelRange, rng);
    return {
      state: {
        ...current,
        forgeMaterials: nextMaterials,
        pendingForge: {
          previewId,
          recipeId: typed.recipeId,
          itemId: recipe.itemId,
          itemType: recipe.itemType,
          itemLevel,
          powerModelId: recipe.powerModelId,
          offeredRarity,
        },
      },
      events: [{ type: 'forge.preview_created', previewId, itemId: recipe.itemId, itemLevel, powerModelId: recipe.powerModelId, offeredRarity, craftCost }],
    };
  }

  if (typed.type === "forge.cancel") {
    if (!pending || pending.previewId !== typed.previewId) throw new ForgeCommandError("PREVIEW_NOT_FOUND", "forge preview not found");
    return { state: { ...current, pendingForge: null }, events: [{ type: "forge.preview_cancelled", previewId: typed.previewId }] };
  }

  if (typed.type === "forge.finalize") {
    if (!pending || pending.previewId !== typed.previewId) throw new ForgeCommandError("PREVIEW_NOT_FOUND", "forge preview not found");
    const recipe = ALL_RECIPES[String(pending.recipeId)];
    if (!recipe) throw new ForgeCommandError("BLUEPRINT_LOCKED", "unknown forge blueprint");
    const itemDefinition = getItemById(recipe.itemId);
    if (!itemDefinition) throw new ForgeCommandError('BLUEPRINT_LOCKED', 'unknown forge item');
    const itemLevel = pending.itemLevel ?? itemDefinition.requiredLevel;
    const powerModelId = pending.powerModelId ?? itemDefinition.powerModelId;
    const offeredRarity = ensureRarity(pending.offeredRarity);
    const signatureRecipe = isRatKingSignature(recipe.itemId);

    let rarity: ForgeRarity = signatureRecipe ? offeredRarity : recipe.minimumRarity;
    let modifier: CanonicalStatModifier | undefined;
    let nextMaterials = materials;
    if (!signatureRecipe && typed.acceptUpgrade) {
      if (rarityRank(offeredRarity) <= rarityRank(recipe.minimumRarity)) throw new ForgeCommandError("UPGRADE_UNAVAILABLE", "forge upgrade is unavailable");
      if (!typed.chosenModifierStat) throw new ForgeCommandError("INVALID_MODIFIER", "an upgrade modifier is required");
      const allowed = recipe.itemType === "weapon" ? WEAPON_MODIFIERS : ARMOR_MODIFIERS;
      if (!allowed.has(typed.chosenModifierStat) || !MODIFIER_VALUES[typed.chosenModifierStat]) {
        throw new ForgeCommandError("INVALID_MODIFIER", "modifier is incompatible with the crafted item");
      }
      const upgradeCost = powerModelId === 'level-bands-v1'
        ? getForgeUpgradeCost(offeredRarity, itemLevel)
        : getForgeUpgradeCost(offeredRarity, 1);
      nextMaterials = consume(materials, upgradeCost);
      rarity = offeredRarity;
      modifier = powerModelId === 'level-bands-v1'
        ? scaleModifierByRarity(
            scaleModifierByItemLevel(MODIFIER_VALUES[typed.chosenModifierStat], itemLevel),
            rarity,
          )
        : MODIFIER_VALUES[typed.chosenModifierStat];
    } else if (!signatureRecipe && typed.chosenModifierStat) {
      throw new ForgeCommandError("INVALID_MODIFIER", "modifier requires an accepted upgrade");
    }

    const instanceId = `item:forge:${typed.previewId}`;
    const signatureInstance = signatureRecipe
      ? createRatKingSignatureInstance(recipe.itemId as RatKingSignatureId, rarity as "epic" | "legendary", instanceId)
      : null;
    const modifiers = signatureInstance?.modifiers ?? (modifier
      ? [...resolveAuthoritativeNoviceItemModifiers(
          recipe.itemId,
          rarity,
          undefined,
          itemLevel,
          powerModelId,
          instanceId,
        ), modifier]
      : undefined);
    const equippedInstances = current.heroes
      .flatMap((hero) => Object.values(hero.equipment ?? {}))
      .filter((entry): entry is ItemInstance => Boolean(entry));
    if ([...items, ...equippedInstances].some((entry) => entry.instanceId === instanceId)) {
      throw new ForgeCommandError("INVALID_GAME_STATE", "forged item instance already exists");
    }
    const instance = signatureInstance ?? { instanceId, itemId: recipe.itemId, itemLevel, powerModelId, rarity, modifiers };
    items.push(instance);
    const itemName = nameItem(itemDefinition, instance).name;
    return {
      state: { ...current, storedItems: items, forgeMaterials: nextMaterials, pendingForge: null },
      events: [{ type: 'forge.finalized', previewId: typed.previewId, instanceId, itemId: recipe.itemId, itemName, itemLevel, powerModelId, rarity, modifier: typed.chosenModifierStat ?? null }],
    };
  }

  if (typed.type === "inventory.recycle") {
    const index = items.findIndex((entry) => entry.instanceId === typed.instanceId);
    if (index === -1) throw new ForgeCommandError("ITEM_NOT_FOUND", "item instance is unavailable");
    const [instance] = items.splice(index, 1);
    const rarity = ensureRarity(instance.rarity);
    const definition = getItemById(instance.itemId);
    const itemLevel = instance.itemLevel ?? definition?.requiredLevel ?? 1;
    const rewards = instance.powerModelId === 'level-bands-v1'
      ? scaleForgeMaterialsForItemLevel(FORGE_RECYCLE_REWARDS[rarity], itemLevel)
      : FORGE_RECYCLE_REWARDS[rarity];
    const nextMaterials = clone(materials);
    for (const reward of rewards) addMaterial(nextMaterials, reward);
    return {
      state: { ...current, storedItems: items, forgeMaterials: nextMaterials },
      events: [{ type: 'inventory.recycled', instanceId: instance.instanceId, itemId: instance.itemId, itemName: nameItem(definition, instance).name, itemLevel, rarity, rewards }],
    };
  }

  throw new ForgeCommandError("INVALID_COMMAND", "unsupported forge command");
}
