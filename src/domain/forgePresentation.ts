import { ITEM_LIBRARY } from "../data/gameData";
import type { ItemBlueprint, ItemInfo, StoredForgeMaterialStack } from "../types";
import {
  BASIC_FORGE_CRAFTABLE_ITEMS,
  FORGE_MATERIALS,
  type BasicForgeUpgradeProc,
} from "../utils/gameCalculations";
import {
  formatWeaponAttackSpeed,
  getWeaponAttackProfileLabel,
  getWeaponScalingLabel,
} from "./weaponPresentation";

export interface ForgePendingViewInput {
  previewId: string;
  itemId: string;
  upgradeProc?: BasicForgeUpgradeProc;
}

export interface ForgeRecipeView {
  id: string;
  name: string;
  description: string;
  rarityLabel: string;
  unlocked: boolean;
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
  rarityLabel: string;
  upgradeProc: BasicForgeUpgradeProc;
  upgradeAffordable: boolean;
  modifierOptions: ForgeModifierOptionView[];
}

export interface ForgeWorkspaceView {
  materials: Array<{ id: string; name: string; count: number }>;
  recipes: ForgeRecipeView[];
  selectedRecipe: ForgeRecipeView | null;
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

function toRecipeView(item: ItemInfo, unlockedIds: Set<string>): ForgeRecipeView {
  const weaponDetails = item.itemType === "weapon"
    ? [
        ...(item.damageRange ? [`Dégâts de base : ${item.damageRange.min} - ${item.damageRange.max}`] : []),
        `Scaling : ${getWeaponScalingLabel(item)}`,
        `Profil : ${getWeaponAttackProfileLabel(item)}`,
        `Indice de vitesse : ${formatWeaponAttackSpeed(item.attackSpeed ?? 1)}`,
      ]
    : [];
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    rarityLabel: rarityLabels[item.minimumRarity],
    unlocked: unlockedIds.has(item.id),
    weaponDetails,
    modifierLines: (item.modifiers ?? []).map((entry) =>
      `• ${entry.stat} : ${entry.type === "percent" ? `+${entry.value}%` : `+${entry.value}`}`),
  };
}

export function createForgeWorkspaceView(input: {
  materials: StoredForgeMaterialStack[];
  blueprints: ItemBlueprint[];
  selectedRecipeId: string;
  pending?: ForgePendingViewInput | null;
}): ForgeWorkspaceView {
  const materialCounts = new Map(input.materials.map((stack) => [stack.materialId, stack.count]));
  const count = (id: string) => materialCounts.get(id) ?? 0;
  const unlockedIds = new Set(input.blueprints.filter((entry) => entry.unlocked).map((entry) => entry.itemId));
  const baseItems = [...BASIC_FORGE_CRAFTABLE_ITEMS];
  const extraItems = input.blueprints
    .filter((entry) => entry.unlocked && !baseItems.some((item) => item.id === entry.itemId))
    .map((entry) => ITEM_LIBRARY.find((item) => item.id === entry.itemId))
    .filter((item): item is ItemInfo => Boolean(item));
  const recipes = [...baseItems, ...extraItems].map((item) => toRecipeView(item, unlockedIds));
  const selectedRecipe = recipes.find((recipe) => recipe.id === input.selectedRecipeId) ?? recipes[0] ?? null;
  const upgradeProc = input.pending?.upgradeProc ?? "none";
  const pendingItem = input.pending ? ITEM_LIBRARY.find((item) => item.id === input.pending?.itemId) : undefined;
  const compatibleModifiers = pendingItem?.itemType === "weapon" ? weaponModifiers : armorModifiers;
  const upgradeAffordable = upgradeProc === "uncommon"
    ? count("refined_metal") >= 2
    : upgradeProc === "rare"
      ? count("refined_metal") >= 4 && count("enchanted_fragment") >= 1
      : false;

  return {
    materials: FORGE_MATERIALS.map((material) => ({ id: material.id, name: material.name, count: count(material.id) })),
    recipes,
    selectedRecipe,
    baseAffordable: count("metal_scrap") >= 6 && count("refined_metal") >= 1,
    baseCostLabel: "6 débris métalliques · 1 métal raffiné",
    pending: input.pending ? {
      previewId: input.pending.previewId,
      itemId: input.pending.itemId,
      itemName: pendingItem?.name ?? input.pending.itemId,
      rarityLabel: pendingItem ? rarityLabels[pendingItem.minimumRarity] : "Standard",
      upgradeProc,
      upgradeAffordable,
      modifierOptions: compatibleModifiers.map((stat) => ({ stat, label: modifierLabels[stat] ?? stat })),
    } : null,
  };
}
