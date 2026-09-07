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
import { RAT_KING_SIGNATURE_IDS, RAT_KING_SIGNATURE_PARAMETERS, type RatKingSignatureId } from "../../shared/domain/items/items_rat_king";
import { createForgeMaterialReserveView, type BossComponentGroupView } from "./forgeMaterialPresentation";
import { applyItemLevelScaling, applyItemRarityScaling } from "../../shared/domain/items/scaling";
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
  category: ItemInfo['itemType'];
  categoryLabel: string;
  discoveryLabel: string;
  name: string;
  description: string;
  rarityLabel: string;
  unlocked: boolean;
  powerModelId: 'legacy-fixed-v1' | 'level-bands-v1';
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
  baseRarityLabel: string;
  offeredRarity: Rarity;
  upgradeAvailable: boolean;
  upgradeAffordable: boolean;
  upgradeCosts: ForgeCostView[];
  modifierOptions: ForgeModifierOptionView[];
}

export interface ForgeCostView {
  id: string;
  name: string;
  owned: number;
  required: number;
  missing: number;
}

export type ForgeCategory = 'all' | ItemInfo['itemType'];
export const FORGE_CATEGORIES: Array<{ id: ForgeCategory; label: string }> = [
  { id: 'all', label: 'Tout' }, { id: 'weapon', label: 'Armes' },
  { id: 'offhand', label: 'Mains gauches' }, { id: 'armor', label: 'Armures' },
  { id: 'accessory', label: 'Accessoires' },
];

export function filterForgeRecipes(recipes: ForgeRecipeView[], query: string, category: ForgeCategory, knownOnly: boolean): ForgeRecipeView[] {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const search = normalize(query.trim());
  return recipes.filter((recipe) => (!knownOnly || recipe.unlocked)
    && (category === 'all' || recipe.category === category)
    && normalize(recipe.name).includes(search));
}

export interface ForgeWorkspaceView {
  progression: {
    openedRangeLabel: string;
    nextRangeLabel?: string;
    nextRequiredFloor?: number;
  };
  materials: Array<{ id: string; name: string; count: number }>;
  bossComponents: BossComponentGroupView[];
  recipes: ForgeRecipeView[];
  selectedRecipe: ForgeRecipeView | null;
  selectedLevelBandMin: number;
  baseAffordable: boolean;
  baseCosts: ForgeCostView[];
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
  physicalDamage: 'Dégâts physiques', magicDamage: 'Dégâts magiques',
  criticalChance: 'Chances de critique', speed: 'Vitesse', maxHp: 'PV max', maxMana: 'Mana max',
  physicalDefense: 'Défense physique', magicDefense: 'Défense magique', dodgeChance: 'Chances d’esquive',
  fireResistance: 'Résistance Feu', iceResistance: 'Résistance Glace', waterResistance: 'Résistance Eau',
  earthResistance: 'Résistance Terre', windResistance: 'Résistance Vent', lightningResistance: 'Résistance Foudre',
  holyResistance: 'Résistance Sacré', darkResistance: 'Résistance Ombre', natureResistance: 'Résistance Nature',
  arcaneResistance: 'Résistance Arcanes', poisonResistance: 'Résistance Poison', bloodResistance: 'Résistance Sang',
  soundResistance: 'Résistance Son', radiantResistance: 'Résistance Radiant',
};

const rarityLabels = {
  common: "Commune",
  uncommon: "Inhabituelle",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
} as const;

const rarityOrder: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
function toRecipeView(item: ItemInfo, unlockedIds: Set<string>, forgeLevel: number, selectedBand?: number): ForgeRecipeView {
  const availableLevelBands = item.powerModelId === 'legacy-fixed-v1'
    ? [Math.floor((item.requiredLevel - 1) / 5) * 5 + 1]
    : [1, 6, 11, 16, 21, 26, 31, 36].filter((start) => (
        start <= forgeLevel * 5 && start <= item.levelRange.max && start + 4 >= item.levelRange.min
      ));
  const band = availableLevelBands.includes(selectedBand ?? -1) ? selectedBand! : availableLevelBands.at(-1);
  const lowLevel = item.powerModelId === 'legacy-fixed-v1' ? item.requiredLevel : Math.max(item.levelRange.min, band ?? item.levelRange.min);
  const highLevel = item.powerModelId === 'legacy-fixed-v1' ? lowLevel : Math.min(item.levelRange.max, lowLevel + 4);
  const low = applyItemRarityScaling(applyItemLevelScaling(item, lowLevel), item.minimumRarity, true);
  const high = applyItemRarityScaling(applyItemLevelScaling(item, highLevel), item.minimumRarity, true);
  const weaponDetails = item.itemType === "weapon"
    ? [
        ...(low.itemType === 'weapon' && low.damageRange && high.itemType === 'weapon' && high.damageRange
          ? [`Dégâts niv. ${lowLevel} : ${low.damageRange.min}–${low.damageRange.max}`, ...(highLevel !== lowLevel ? [`Dégâts niv. ${highLevel} : ${high.damageRange.min}–${high.damageRange.max}`] : [])] : []),
        `Caractéristique : ${getWeaponScalingLabel(item)}`,
        `Profil d’attaque : ${getWeaponAttackProfileLabel(item)}`,
        `Vitesse d’attaque : ${formatWeaponAttackSpeed(item.attackSpeed ?? 1)}`,
      ]
    : [];
  return {
    id: item.id,
    category: item.itemType,
    categoryLabel: FORGE_CATEGORIES.find((entry) => entry.id === item.itemType)!.label,
    discoveryLabel: item.blueprintDiscovery.kind === 'random-drop'
      ? `Plan à découvrir · ${item.blueprintDiscovery.sources.map((source) => source === 'boss' ? 'boss' : 'coffres').join(' / ')} · étages ${item.blueprintDiscovery.floorMin}–${item.blueprintDiscovery.floorMax}`
      : 'Plan de départ',
    name: item.name,
    description: item.description,
    rarityLabel: rarityLabels[item.minimumRarity],
    unlocked: unlockedIds.has(item.id),
    powerModelId: item.powerModelId,
    availableLevelBands,
    weaponDetails,
    modifierLines: (low.modifiers ?? []).map((entry, index) => {
      const end = high.modifiers?.[index]?.value ?? entry.value;
      const label = modifierLabels[entry.stat] ?? entry.stat;
      const value = (n: number) => `${n >= 0 ? '+' : ''}${n}${entry.type === 'percent' ? ' %' : ''}`;
      return `${label} : ${value(entry.value)}${end !== entry.value ? ` → ${value(end)}` : ''}`;
    }),
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
  const costViews = (cost: readonly { materialId: string; count: number }[]): ForgeCostView[] => cost.map((entry) => ({
    id: entry.materialId,
    name: FORGE_MATERIALS.find((material) => material.id === entry.materialId)?.name ?? entry.materialId,
    owned: count(entry.materialId), required: entry.count,
    missing: Math.max(0, entry.count - count(entry.materialId)),
  }));
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
  const recipes = forgeItems.map((item) => toRecipeView(item, unlockedIds, forgeLevel, input.selectedLevelBandMin));
  const selectedRecipe = recipes.find((recipe) => recipe.id === input.selectedRecipeId) ?? recipes[0] ?? null;
  const selectedLevelBandMin = selectedRecipe?.availableLevelBands.includes(input.selectedLevelBandMin ?? -1)
    ? input.selectedLevelBandMin!
    : selectedRecipe?.availableLevelBands.at(-1) ?? 1;
  const selectedIsSignature = RAT_KING_SIGNATURE_IDS.includes(selectedRecipe?.id as RatKingSignatureId);
  const baseCost = selectedIsSignature
    ? [...RAT_KING_SIGNATURE_PARAMETERS.recipeCosts]
    : selectedRecipe?.powerModelId === 'level-bands-v1'
      ? scaleForgeMaterialsForItemLevel(FORGE_CRAFT_COST, selectedLevelBandMin)
      : [...FORGE_CRAFT_COST];
  const pendingItem = input.pending ? ITEM_LIBRARY.find((item) => item.id === input.pending?.itemId) : undefined;
  const offeredRarity = input.pending?.offeredRarity ?? pendingItem?.minimumRarity ?? "common";
  const pendingIsSignature = RAT_KING_SIGNATURE_IDS.includes(pendingItem?.id as RatKingSignatureId);
  const upgradeAvailable = Boolean(pendingItem)
    && !pendingIsSignature
    && rarityOrder.indexOf(offeredRarity) > rarityOrder.indexOf(pendingItem.minimumRarity);
  const compatibleModifiers = pendingItem?.itemType === "weapon" ? weaponModifiers : armorModifiers;
  const upgradeCost = getForgeUpgradeCost(
    offeredRarity,
    pendingItem?.powerModelId === 'level-bands-v1' ? input.pending?.itemLevel ?? 1 : 1,
  );
  const upgradeAffordable = upgradeCost.length > 0
    && upgradeCost.every((entry) => count(entry.materialId) >= entry.count);

  const reserve = createForgeMaterialReserveView(input.materials);

  return {
    progression: {
      openedRangeLabel: `${openedProgression.itemLevelRange.min}–${openedProgression.itemLevelRange.max}`,
      ...(nextProgression ? {
        nextRangeLabel: `${nextProgression.itemLevelRange.min}–${nextProgression.itemLevelRange.max}`,
        nextRequiredFloor: nextProgression.requiredFloor,
      } : {}),
    },
    materials: reserve.materials.map(({ id, name, count: materialCount }) => ({ id, name, count: materialCount })),
    bossComponents: reserve.bossComponents,
    recipes,
    selectedRecipe,
    selectedLevelBandMin,
    baseAffordable: baseCost.every((entry) => count(entry.materialId) >= entry.count),
    baseCosts: costViews(baseCost),
    pending: input.pending ? {
      previewId: input.pending.previewId,
      itemId: input.pending.itemId,
      itemName: pendingItem?.name ?? input.pending.itemId,
      itemLevel: input.pending.itemLevel ?? pendingItem?.requiredLevel ?? 1,
      rarityLabel: rarityLabels[offeredRarity],
      baseRarityLabel: rarityLabels[pendingIsSignature ? offeredRarity : pendingItem?.minimumRarity ?? 'common'],
      offeredRarity,
      upgradeAvailable,
      upgradeAffordable: upgradeAvailable && upgradeAffordable,
      upgradeCosts: costViews(upgradeCost),
      modifierOptions: pendingIsSignature ? [] : compatibleModifiers.map((stat) => ({ stat, label: modifierLabels[stat] ?? stat })),
    } : null,
  };
}
