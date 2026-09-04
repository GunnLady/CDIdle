import { ITEM_LIBRARY } from "../data/gameData";
import type { ItemBlueprint, ItemInfo, Rarity, StoredForgeMaterialStack } from "../types";
import {
  FORGE_MATERIALS,
} from "../utils/gameCalculations";
import {
  FORGE_CRAFT_COST,
  getForgeUpgradeCost,
  scaleForgeMaterialsForItemLevel,
} from "../../shared/domain/forge-economy";
import { FORGE_PROGRESSION_LEVELS } from "../../shared/data/forge-progression";
import {
  formatWeaponAttackSpeed,
  getWeaponAttackProfileLabel,
  getWeaponScalingLabel,
} from "./weaponPresentation";

export interface ForgePendingViewInput {
  previewId: string;
  itemId: string;
  itemLevel?: number;
  offeredRarity: Rarity;
}

export interface ForgeRecipeView {
  id: string;
  name: string;
  description: string;
  rarityLabel: string;
  unlocked: boolean;
  powerModelId: 'legacy-fixed-v1' | 'level-bands-v1';
  levelRangeLabel: string;
  availableLevelBands: number[];
  weaponDetails: string[];
  modifierLines: string[];
}

export interface ForgeModifierOptionView {
  stat: string;
  label: string;
}

export interface ForgePendingView {
  previewId: string;
  itemId: string;
  itemName: string;
  itemLevel: number;
  rarityLabel: string;
  offeredRarity: Rarity;
  upgradeAvailable: boolean;
  upgradeAffordable: boolean;
  upgradeCostLabel: string;
  modifierOptions: ForgeModifierOptionView[];
}

export interface ForgeWorkspaceView {
  progression: {
    openedRangeLabel: string;
    nextRangeLabel?: string;
    nextRequiredFloor?: number;
  };
  materials: Array<{ id: string; name: string; count: number }>;
  recipes: ForgeRecipeView[];
  selectedRecipe: ForgeRecipeView | null;
  selectedLevelBandMin: number;
  baseAffordable: boolean;
  baseCostLabel: string;
  pending: ForgePendingView | null;
}

const armorModifiers = [
  "maxHp", "maxMana", "physicalDefense", "magicDefense", "dodgeChance",
  "fireResistance", "iceResistance", "waterResistance", "earthResistance", "windResistance",
  "lightningResistance", "holyResistance", "darkResistance", "natureResistance", "arcaneResistance",
  "poisonResistance", "bloodResistance", "soundResistance", "radiantResistance",
];

const weaponModifiers = ["physicalDamage", "magicDamage", "criticalChance", "speed"];

const modifierLabels: Record<string, string> = {
  physicalDamage: "⚔️ +1 Dégâts Physiques", magicDamage: "🔮 +1 Dégâts Magiques",
  criticalChance: "✨ +1% Chances de Critique", speed: "👟 +2% Vitesse",
  maxHp: "❤️ +3% PV Max", maxMana: "🧪 +3% Mana Max",
  physicalDefense: "🛡️ +1 Défense Physique", magicDefense: "🧼 +1 Défense Magique",
  dodgeChance: "💨 +1% Chances d'Esquive", fireResistance: "🔥 +2 Résistance Feu",
  iceResistance: "❄️ +2 Résistance Glace", waterResistance: "💧 +2 Résistance Eau",
  earthResistance: "🪨 +2 Résistance Terre", windResistance: "🌀 +2 Résistance Vent",
  lightningResistance: "⚡ +2 Résistance Foudre", holyResistance: "☀️ +2 Résistance Sacré",
  darkResistance: "🌙 +2 Résistance Ombre", natureResistance: "🍃 +2 Résistance Nature",
  arcaneResistance: "🔯 +2 Résistance Arcanes", poisonResistance: "🧪 +2 Résistance Poison",
  bloodResistance: "🩸 +2 Résistance Sang", soundResistance: "🔊 +2 Résistance Son",
  radiantResistance: "🌟 +2 Résistance Radiant",
};

const rarityLabels = {
  common: "Commune",
  uncommon: "Inhabituelle",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
} as const;

const rarityOrder: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
const materialLabels: Record<string, { singular: string; plural: string }> = {
  metal_scrap: { singular: "débris métallique", plural: "débris métalliques" },
  refined_metal: { singular: "métal raffiné", plural: "métaux raffinés" },
  enchanted_fragment: { singular: "fragment enchanté", plural: "fragments enchantés" },
  arcane_core: { singular: "noyau arcanique", plural: "noyaux arcaniques" },
  legendary_essence: { singular: "essence légendaire", plural: "essences légendaires" },
};

const formatMaterialCost = (cost: readonly { materialId: string; count: number }[]) => cost
  .map((entry) => {
    const labels = materialLabels[entry.materialId];
    return `${entry.count} ${entry.count > 1 ? labels?.plural : labels?.singular}`;
  })
  .join(" · ");

function toRecipeView(item: ItemInfo, unlockedIds: Set<string>, forgeLevel: number): ForgeRecipeView {
  const weaponDetails = item.itemType === "weapon"
    ? [
        ...(item.damageRange ? [`Dégâts de base : ${item.damageRange.min} - ${item.damageRange.max}`] : []),
        `Caractéristique : ${getWeaponScalingLabel(item)}`,
        `Profil d’attaque : ${getWeaponAttackProfileLabel(item)}`,
        `Vitesse d’attaque : ${formatWeaponAttackSpeed(item.attackSpeed ?? 1)}`,
      ]
    : [];
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    rarityLabel: rarityLabels[item.minimumRarity],
    unlocked: unlockedIds.has(item.id),
    powerModelId: item.powerModelId,
    levelRangeLabel: item.levelRange.min === item.levelRange.max
      ? `Niveau ${item.levelRange.min}`
      : `Niveaux ${item.levelRange.min}–${item.levelRange.max}`,
    availableLevelBands: item.powerModelId === 'legacy-fixed-v1'
      ? [Math.floor((item.requiredLevel - 1) / 5) * 5 + 1]
      : [1, 6, 11, 16, 21, 26, 31, 36].filter((start) => (
          start <= forgeLevel * 5 && start <= item.levelRange.max && start + 4 >= item.levelRange.min
        )),
    weaponDetails,
    modifierLines: (item.modifiers ?? []).map((entry) =>
      `• ${entry.stat} : ${entry.type === "percent" ? `+${entry.value}%` : `+${entry.value}`}`),
  };
}

export function createForgeWorkspaceView(input: {
  materials: StoredForgeMaterialStack[];
  blueprints: ItemBlueprint[];
  selectedRecipeId: string;
  selectedLevelBandMin?: number;
  forgeLevel?: number;
  pending?: ForgePendingViewInput | null;
}): ForgeWorkspaceView {
  const materialCounts = new Map(input.materials.map((stack) => [stack.materialId, stack.count]));
  const count = (id: string) => materialCounts.get(id) ?? 0;
  const unlockedIds = new Set(input.blueprints.filter((entry) => entry.unlocked).map((entry) => entry.itemId));
  const forgeItems = ITEM_LIBRARY.filter((item) => (
    item.catalogStatus === "active"
    && item.blueprintAvailable
    && item.provenances.includes("forge")
    && item.blueprintDiscovery.kind !== "none"
  ));
  const forgeLevel = Math.max(1, input.forgeLevel ?? 1);
  const openedProgression = FORGE_PROGRESSION_LEVELS[Math.min(forgeLevel, FORGE_PROGRESSION_LEVELS.length) - 1]!;
  const nextProgression = FORGE_PROGRESSION_LEVELS[forgeLevel];
  const recipes = forgeItems.map((item) => toRecipeView(item, unlockedIds, forgeLevel));
  const selectedRecipe = recipes.find((recipe) => recipe.id === input.selectedRecipeId) ?? recipes[0] ?? null;
  const selectedLevelBandMin = selectedRecipe?.availableLevelBands.includes(input.selectedLevelBandMin ?? -1)
    ? input.selectedLevelBandMin!
    : selectedRecipe?.availableLevelBands.at(-1) ?? 1;
  const baseCost = selectedRecipe?.powerModelId === 'level-bands-v1'
    ? scaleForgeMaterialsForItemLevel(FORGE_CRAFT_COST, selectedLevelBandMin)
    : [...FORGE_CRAFT_COST];
  const pendingItem = input.pending ? ITEM_LIBRARY.find((item) => item.id === input.pending?.itemId) : undefined;
  const offeredRarity = input.pending?.offeredRarity ?? pendingItem?.minimumRarity ?? "common";
  const upgradeAvailable = Boolean(pendingItem)
    && rarityOrder.indexOf(offeredRarity) > rarityOrder.indexOf(pendingItem.minimumRarity);
  const compatibleModifiers = pendingItem?.itemType === "weapon" ? weaponModifiers : armorModifiers;
  const upgradeCost = getForgeUpgradeCost(
    offeredRarity,
    pendingItem?.powerModelId === 'level-bands-v1' ? input.pending?.itemLevel ?? 1 : 1,
  );
  const upgradeAffordable = upgradeCost.length > 0
    && upgradeCost.every((entry) => count(entry.materialId) >= entry.count);
  const upgradeCostLabel = upgradeCost.length > 0
    ? formatMaterialCost(upgradeCost)
    : "Aucun coût supplémentaire";

  return {
    progression: {
      openedRangeLabel: `${openedProgression.itemLevelRange.min}–${openedProgression.itemLevelRange.max}`,
      ...(nextProgression ? {
        nextRangeLabel: `${nextProgression.itemLevelRange.min}–${nextProgression.itemLevelRange.max}`,
        nextRequiredFloor: nextProgression.requiredFloor,
      } : {}),
    },
    materials: FORGE_MATERIALS.map((material) => ({ id: material.id, name: material.name, count: count(material.id) })),
    recipes,
    selectedRecipe,
    selectedLevelBandMin,
    baseAffordable: baseCost.every((entry) => count(entry.materialId) >= entry.count),
    baseCostLabel: formatMaterialCost(baseCost),
    pending: input.pending ? {
      previewId: input.pending.previewId,
      itemId: input.pending.itemId,
      itemName: pendingItem?.name ?? input.pending.itemId,
      itemLevel: input.pending.itemLevel ?? pendingItem?.requiredLevel ?? 1,
      rarityLabel: rarityLabels[offeredRarity],
      offeredRarity,
      upgradeAvailable,
      upgradeAffordable: upgradeAvailable && upgradeAffordable,
      upgradeCostLabel,
      modifierOptions: compatibleModifiers.map((stat) => ({ stat, label: modifierLabels[stat] ?? stat })),
    } : null,
  };
}
