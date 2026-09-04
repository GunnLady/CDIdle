import type { CanonicalForgeMaterialStack } from "../contracts/authoritative.ts";
import type { CanonicalRarity } from "./items/types.ts";

export type ForgeEconomyRarity = CanonicalRarity;
export type ForgeEconomyMaterialStack = CanonicalForgeMaterialStack;

export const FORGE_CRAFT_COST: readonly ForgeEconomyMaterialStack[] = [
  { materialId: "metal_scrap", rarity: "common", count: 6 },
  { materialId: "refined_metal", rarity: "uncommon", count: 1 },
];

export const FORGE_UPGRADE_COSTS: Readonly<Record<Exclude<ForgeEconomyRarity, "common">, readonly ForgeEconomyMaterialStack[]>> = {
  uncommon: [{ materialId: "refined_metal", rarity: "uncommon", count: 2 }],
  rare: [
    { materialId: "refined_metal", rarity: "uncommon", count: 4 },
    { materialId: "enchanted_fragment", rarity: "rare", count: 1 },
  ],
  epic: [
    { materialId: "enchanted_fragment", rarity: "rare", count: 4 },
    { materialId: "arcane_core", rarity: "epic", count: 1 },
  ],
  legendary: [
    { materialId: "arcane_core", rarity: "epic", count: 4 },
    { materialId: "legendary_essence", rarity: "legendary", count: 1 },
  ],
};

export const FORGE_RECYCLE_REWARDS: Readonly<Record<ForgeEconomyRarity, readonly ForgeEconomyMaterialStack[]>> = {
  common: [{ materialId: "metal_scrap", rarity: "common", count: 2 }],
  uncommon: [{ materialId: "metal_scrap", rarity: "common", count: 4 }, { materialId: "refined_metal", rarity: "uncommon", count: 2 }],
  rare: [{ materialId: "metal_scrap", rarity: "common", count: 3 }, { materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 2 }],
  epic: [{ materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }],
  legendary: [{ materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }, { materialId: "legendary_essence", rarity: "legendary", count: 1 }],
};

export const FORGE_RARITY_WEIGHTS: Readonly<Record<number, readonly [ForgeEconomyRarity, number][]>> = {
  1: [["common", 72], ["uncommon", 23], ["rare", 5], ["epic", 0], ["legendary", 0]],
  2: [["common", 62], ["uncommon", 29], ["rare", 8], ["epic", 1], ["legendary", 0]],
  3: [["common", 50], ["uncommon", 34], ["rare", 13], ["epic", 3], ["legendary", 0]],
  4: [["common", 38], ["uncommon", 38], ["rare", 19], ["epic", 5], ["legendary", 0]],
  5: [["common", 28], ["uncommon", 38], ["rare", 26], ["epic", 7], ["legendary", 1]],
  6: [["common", 18], ["uncommon", 34], ["rare", 35], ["epic", 11], ["legendary", 2]],
  7: [["common", 10], ["uncommon", 27], ["rare", 40], ["epic", 19], ["legendary", 4]],
  8: [["common", 5], ["uncommon", 20], ["rare", 40], ["epic", 28], ["legendary", 7]],
};

export function getForgeMaterialMultiplier(itemLevel: number): number {
  const band = Math.floor((Math.max(1, Math.min(40, itemLevel)) - 1) / 5) + 1;
  return band <= 2 ? 1 : band <= 6 ? 2 : 3;
}

export function scaleForgeMaterialsForItemLevel(
  stacks: readonly ForgeEconomyMaterialStack[],
  itemLevel: number,
): ForgeEconomyMaterialStack[] {
  const multiplier = getForgeMaterialMultiplier(itemLevel);
  return stacks.map((entry) => ({ ...entry, count: entry.count * multiplier }));
}

export function getForgeUpgradeCost(
  rarity: ForgeEconomyRarity,
  itemLevel: number,
): ForgeEconomyMaterialStack[] {
  return rarity === "common"
    ? []
    : scaleForgeMaterialsForItemLevel(FORGE_UPGRADE_COSTS[rarity], itemLevel);
}
