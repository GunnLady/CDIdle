import type { CanonicalRng } from "./authoritative-rng.ts";
import { resolveAuthoritativeNoviceItemModifiers } from "./novice-stats-authority.ts";
import { ITEM_LIBRARY, rarityRank } from "../../../shared/domain/items/items.ts";
import type {
  CanonicalForgeMaterialStack,
  CanonicalGameState,
  CanonicalPendingForge,
  CanonicalStateTransition,
  CanonicalStoredItemInstance,
} from "../../../shared/contracts/authoritative.ts";
import type { CanonicalStatModifier } from "../../../shared/domain/hero-stats.ts";
export { DEFAULT_NOVICE_ITEM_BLUEPRINTS } from "./forge-blueprints.ts";

export type ForgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ForgeUpgradeProc = "none" | "uncommon" | "rare";
export type ForgeMaterialStack = CanonicalForgeMaterialStack;
type ItemInstance = CanonicalStoredItemInstance;
type Recipe = {
  itemId: string;
  itemType: "weapon" | "offhand" | "armor" | "accessory";
  minimumRarity: ForgeRarity;
};

export type ForgeCommand =
  | { type: "forge.start"; recipeId: string; commandId?: string }
  | { type: "forge.finalize"; previewId: string; acceptUpgrade?: boolean; chosenModifierStat?: string }
  | { type: "forge.cancel"; previewId: string }
  | { type: "inventory.recycle"; instanceId: string };

export class ForgeCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const RARITIES = new Set<ForgeRarity>(["common", "uncommon", "rare", "epic", "legendary"]);

const CRAFT_COST: ForgeMaterialStack[] = [
  { materialId: "metal_scrap", rarity: "common", count: 6 },
  { materialId: "refined_metal", rarity: "uncommon", count: 1 },
];

const UPGRADE_COSTS: Record<Exclude<ForgeUpgradeProc, "none">, ForgeMaterialStack[]> = {
  uncommon: [{ materialId: "refined_metal", rarity: "uncommon", count: 2 }],
  rare: [
    { materialId: "refined_metal", rarity: "uncommon", count: 4 },
    { materialId: "enchanted_fragment", rarity: "rare", count: 1 },
  ],
};

const RECIPES: Record<string, Recipe> = Object.fromEntries(
  ITEM_LIBRARY
    .filter((item) => item.blueprintAvailable && item.provenances.includes("forge"))
    .map((item) => [item.id, {
      itemId: item.id,
      itemType: item.itemType,
      minimumRarity: item.minimumRarity,
    }]),
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

const RECYCLE_REWARDS: Record<ForgeRarity, ForgeMaterialStack[]> = {
  common: [{ materialId: "metal_scrap", rarity: "common", count: 2 }],
  uncommon: [{ materialId: "metal_scrap", rarity: "common", count: 4 }, { materialId: "refined_metal", rarity: "uncommon", count: 2 }],
  rare: [{ materialId: "metal_scrap", rarity: "common", count: 3 }, { materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 2 }],
  epic: [{ materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }],
  legendary: [{ materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }, { materialId: "legendary_essence", rarity: "legendary", count: 1 }],
};

const consume = (source: ForgeMaterialStack[], cost: ForgeMaterialStack[]) => {
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

const rollUpgradeProc = (rng: CanonicalRng): ForgeUpgradeProc => {
  const roll = rng.next() * 100;
  if (roll < 85) return "none";
  if (roll < 98) return "uncommon";
  return "rare";
};

const ensureRarity = (rarity: unknown): ForgeRarity => {
  if (!RARITIES.has(rarity as ForgeRarity)) throw new ForgeCommandError("INVALID_COMMAND", "rarity is invalid");
  return rarity as ForgeRarity;
};

export function applyForgeCommand(
  current: CanonicalGameState,
  command: Record<string, unknown>,
  rng?: CanonicalRng,
): CanonicalStateTransition {
  const materials = clone(current.forgeMaterials);
  const items = clone(current.storedItems);
  const pending: CanonicalPendingForge | null = clone(current.pendingForge ?? null);
  const typed = command as ForgeCommand;
  const forgeUnlocked = Number(current.buildings.forge ?? 0) >= 1;
  if (!forgeUnlocked) throw new ForgeCommandError("FORGE_LOCKED", "forge building is required");

  if (typed.type === "forge.start") {
    const recipe = RECIPES[typed.recipeId];
    const blueprints = current.itemBlueprints;
    if (!recipe || !blueprints.some((entry) => entry.itemId === typed.recipeId && entry.unlocked === true)) {
      throw new ForgeCommandError("BLUEPRINT_LOCKED", "forge blueprint is locked");
    }
    if (pending) throw new ForgeCommandError("FORGE_PENDING", "a forge preview is already pending");
    if (!rng) throw new ForgeCommandError("RNG_REQUIRED", "canonical RNG is required");
    const nextMaterials = consume(materials, CRAFT_COST);
    const previewId = `preview-${typed.commandId ?? "command"}`;
    const rolledUpgradeProc = rollUpgradeProc(rng);
    const upgradeProc = rolledUpgradeProc !== "none" && rarityRank(rolledUpgradeProc) > rarityRank(recipe.minimumRarity)
      ? rolledUpgradeProc
      : "none";
    return {
      state: {
        ...current,
        forgeMaterials: nextMaterials,
        pendingForge: { previewId, recipeId: typed.recipeId, itemId: recipe.itemId, itemType: recipe.itemType, upgradeProc },
      },
      events: [{ type: "forge.preview_created", previewId, itemId: recipe.itemId, upgradeProc }],
    };
  }

  if (typed.type === "forge.cancel") {
    if (!pending || pending.previewId !== typed.previewId) throw new ForgeCommandError("PREVIEW_NOT_FOUND", "forge preview not found");
    return { state: { ...current, pendingForge: null }, events: [{ type: "forge.preview_cancelled", previewId: typed.previewId }] };
  }

  if (typed.type === "forge.finalize") {
    if (!pending || pending.previewId !== typed.previewId) throw new ForgeCommandError("PREVIEW_NOT_FOUND", "forge preview not found");
    const recipe = RECIPES[String(pending.recipeId)];
    if (!recipe) throw new ForgeCommandError("BLUEPRINT_LOCKED", "unknown forge blueprint");
    const upgradeProc = pending.upgradeProc as ForgeUpgradeProc;
    if (!(["none", "uncommon", "rare"] as string[]).includes(upgradeProc)) {
      throw new ForgeCommandError("INVALID_GAME_STATE", "forge preview upgrade proc is invalid");
    }

    let rarity: ForgeRarity = recipe.minimumRarity;
    let modifier: CanonicalStatModifier | undefined;
    let nextMaterials = materials;
    if (typed.acceptUpgrade) {
      if (upgradeProc === "none") throw new ForgeCommandError("UPGRADE_UNAVAILABLE", "forge upgrade is unavailable");
      if (!typed.chosenModifierStat) throw new ForgeCommandError("INVALID_MODIFIER", "an upgrade modifier is required");
      const allowed = recipe.itemType === "weapon" ? WEAPON_MODIFIERS : ARMOR_MODIFIERS;
      if (!allowed.has(typed.chosenModifierStat) || !MODIFIER_VALUES[typed.chosenModifierStat]) {
        throw new ForgeCommandError("INVALID_MODIFIER", "modifier is incompatible with the crafted item");
      }
      nextMaterials = consume(materials, UPGRADE_COSTS[upgradeProc]);
      rarity = upgradeProc;
      modifier = MODIFIER_VALUES[typed.chosenModifierStat];
    } else if (typed.chosenModifierStat) {
      throw new ForgeCommandError("INVALID_MODIFIER", "modifier requires an accepted upgrade");
    }

    const modifiers = modifier
      ? [...resolveAuthoritativeNoviceItemModifiers(recipe.itemId, rarity), modifier]
      : undefined;
    const instanceId = `item:forge:${typed.previewId}`;
    const equippedInstances = current.heroes
      .flatMap((hero) => Object.values(hero.equipment ?? {}))
      .filter((entry): entry is ItemInstance => Boolean(entry));
    if ([...items, ...equippedInstances].some((entry) => entry.instanceId === instanceId)) {
      throw new ForgeCommandError("INVALID_GAME_STATE", "forged item instance already exists");
    }
    items.push({ instanceId, itemId: recipe.itemId, rarity, modifiers });
    return {
      state: { ...current, storedItems: items, forgeMaterials: nextMaterials, pendingForge: null },
      events: [{ type: "forge.finalized", previewId: typed.previewId, instanceId, itemId: recipe.itemId, rarity, modifier: typed.chosenModifierStat ?? null }],
    };
  }

  if (typed.type === "inventory.recycle") {
    const index = items.findIndex((entry) => entry.instanceId === typed.instanceId);
    if (index === -1) throw new ForgeCommandError("ITEM_NOT_FOUND", "item instance is unavailable");
    const [instance] = items.splice(index, 1);
    const rarity = ensureRarity(instance.rarity);
    const nextMaterials = clone(materials);
    for (const reward of RECYCLE_REWARDS[rarity]) addMaterial(nextMaterials, reward);
    return {
      state: { ...current, storedItems: items, forgeMaterials: nextMaterials },
      events: [{ type: "inventory.recycled", instanceId: instance.instanceId, itemId: instance.itemId, rarity, rewards: RECYCLE_REWARDS[rarity] }],
    };
  }

  throw new ForgeCommandError("INVALID_COMMAND", "unsupported forge command");
}
