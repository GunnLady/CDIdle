import type { CanonicalItem as ItemInfo } from "./types.ts";
import { TIER1_ITEM_WPN_LIST } from "./items_weapons_tier1.ts";
import { TIER1_ITEM_ARMOR_LIST } from "./items_armors_tier1.ts";
import { TIER1_ITEM_OFFHAND_LIST } from "./items_offhands_tier1.ts";
import { TIER1_ITEM_ACC_LIST } from "./items_accessories_tier1.ts";
import { HIGH_TIER_ITEM_LIST } from "./items_high_tier.ts";
import { createWeapon, createOffhand, createArmor } from "./itemBuilders.ts";
import { WEAPON_INFO_LIST } from "./weapons.ts";
import { OFF_HAND_INFO_LIST } from "./offhands.ts";
import { ARMOR_INFO_LIST } from "./armors.ts";
import { ACCESSORY_INFO_LIST } from "./accessories.ts";
import { isVocationRewardItem } from "./vocation-rewards.ts";
import { isCanonicalItemModifierField } from "../hero-stats.ts";
import { isValidWeaponScaling } from "./weapon-scaling.ts";
import { isValidWeaponAttackProfile } from "./weapon-attack-profile.ts";
import type {
  CanonicalEquipmentSlot,
  CanonicalItemProvenance,
  CanonicalRarity,
  CanonicalWeaponHandedness,
} from "./types.ts";

export { TIER1_ITEM_WPN_LIST, TIER1_ITEM_ARMOR_LIST, TIER1_ITEM_OFFHAND_LIST, TIER1_ITEM_ACC_LIST, HIGH_TIER_ITEM_LIST };

export const NOVICE_BASIC_ITEM_LIST: ItemInfo[] = [
  createWeapon(
    "starter_sword",
    "Épée de départ",
    "sword",
    "common",
    1,
    "Une épée simple et fiable pour les premiers combats.",
    1, 3,
    1,
    [{ stat: "physicalDamage", value: 1 }]
  ),
  createWeapon(
    "quick_dagger",
    "Dague vive",
    "dagger",
    "common",
    1,
    "Une dague légère, facile à manier et rapide à dégainer.",
    1, 2,
    1.2,
    [{ stat: "criticalChance", type: "percent", value: 1 }]
  ),
  createWeapon(
    "woodcutter_axe",
    "Hache de bûcheron",
    "axe",
    "common",
    1,
    "Une hache simple, plus habituée au bois qu’aux monstres, mais assez solide pour se défendre.",
    2, 4,
    0.9,
    [{ stat: "physicalDamage", value: 2 }]
  ),
  createOffhand(
    "wooden_shield",
    "Bouclier en bois",
    "shield",
    "common",
    1,
    "Un bouclier simple offrant une protection de base.",
    [{ stat: "physicalDefense", value: 1 }]
  ),
  createArmor(
    "traveler_clothes",
    "Tenue de voyageur",
    "cloth_armor",
    "common",
    1,
    "Une tenue légère et pratique pour partir à l’aventure.",
    [{ stat: "maxMana", type: "percent", value: 3 }]
  ),
  createArmor(
    "simple_leather_armor",
    "Armure de cuir simple",
    "leather_armor",
    "common",
    1,
    "Une armure légère offrant une protection correcte sans gêner les mouvements.",
    [
      { stat: "physicalDefense", type: "percent", value: 5 },
      { stat: "dodgeChance", type: "percent", value: 3 }
    ]
  ),
  createArmor(
    "novice_mystic_robe",
    "Robe mystique de novice",
    "magic_robe",
    "common",
    1,
    "Une robe simple imprégnée d’une faible énergie mystique, offrant une légère protection contre les forces arcaniques et naturelles.",
    [
      { stat: "maxMana", type: "percent", value: 5 },
      { stat: "arcaneResistance", value: 5 },
      { stat: "natureResistance", value: 5 }
    ]
  )
];

const RAW_ITEM_LIBRARY: ItemInfo[] = [
  ...NOVICE_BASIC_ITEM_LIST,
  ...TIER1_ITEM_WPN_LIST,
  ...TIER1_ITEM_ARMOR_LIST,
  ...TIER1_ITEM_OFFHAND_LIST,
  ...TIER1_ITEM_ACC_LIST,
  ...HIGH_TIER_ITEM_LIST
];

export const ITEM_LIBRARY: ItemInfo[] = RAW_ITEM_LIBRARY.map((item) => ({
  ...item,
  provenances: isVocationRewardItem(item.id)
    ? [...item.provenances, "vocation"]
    : item.provenances,
}));

export const ITEMS_BY_ID: Record<string, ItemInfo> = Object.fromEntries(
  ITEM_LIBRARY.map((item) => [item.id, item])
);

export function getItemById(itemId: string): ItemInfo | undefined {
  return ITEMS_BY_ID[itemId];
}


export function validateUniqueItemIds(items: ItemInfo[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.push(item.id);
    }

    seen.add(item.id);
  }

  return duplicates;
}

export const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"] as const;

export const CHEST_LOOT_BANDS = [
  { floorMin: 1, floorMax: 5, levelMin: 1, levelMax: 10, weights: { common: 65, uncommon: 28, rare: 6, epic: 1, legendary: 0 } },
  { floorMin: 6, floorMax: 10, levelMin: 10, levelMax: 20, weights: { common: 45, uncommon: 38, rare: 14, epic: 3, legendary: 0 } },
  { floorMin: 11, floorMax: 20, levelMin: 10, levelMax: 25, weights: { common: 25, uncommon: 40, rare: 27, epic: 7, legendary: 1 } },
  { floorMin: 21, floorMax: 30, levelMin: 20, levelMax: 33, weights: { common: 10, uncommon: 28, rare: 40, epic: 18, legendary: 4 } },
  { floorMin: 31, floorMax: Number.POSITIVE_INFINITY, levelMin: 24, levelMax: 33, weights: { common: 0, uncommon: 15, rare: 42, epic: 33, legendary: 10 } },
] as const;

export function rarityRank(rarity: CanonicalRarity): number {
  return RARITY_ORDER.indexOf(rarity);
}

export function getItemSlot(item: ItemInfo): CanonicalEquipmentSlot {
  if (item.itemType === "weapon") return "mainHand";
  if (item.itemType === "offhand") return "offHand";
  return item.itemType;
}

export function getItemHandedness(item: ItemInfo): CanonicalWeaponHandedness | null {
  if (item.itemType !== "weapon") return null;
  return WEAPON_INFO_LIST.find((entry) => entry.id === item.weaponTypeId)?.handedness ?? null;
}

export function getChestLootBand(floor: number) {
  return CHEST_LOOT_BANDS.find((band) => floor >= band.floorMin && floor <= band.floorMax)
    ?? CHEST_LOOT_BANDS[CHEST_LOOT_BANDS.length - 1];
}

export function rollWeightedRarity(
  weights: Record<CanonicalRarity, number>,
  roll: number,
): CanonicalRarity {
  const total = RARITY_ORDER.reduce((sum, rarity) => sum + weights[rarity], 0);
  if (total <= 0) throw new Error("INVALID_RARITY_WEIGHTS");
  let cursor = Math.max(0, Math.min(0.999999999, roll)) * total;
  for (const rarity of RARITY_ORDER) {
    cursor -= weights[rarity];
    if (cursor < 0) return rarity;
  }
  return "legendary";
}

export function eligibleCatalogItems(options: {
  rarity: CanonicalRarity;
  levelMin: number;
  levelMax: number;
  provenance: CanonicalItemProvenance;
  blueprintOnly?: boolean;
}): ItemInfo[] {
  const rolledRank = rarityRank(options.rarity);
  return ITEM_LIBRARY.filter((item) => (
    item.requiredLevel >= options.levelMin
    && item.requiredLevel <= options.levelMax
    && rarityRank(item.minimumRarity) <= rolledRank
    && item.provenances.includes(options.provenance)
    && (!options.blueprintOnly || item.blueprintAvailable)
  ));
}

export function resolveEligibleCatalogDrop(options: {
  rarity: CanonicalRarity;
  levelMin: number;
  levelMax: number;
  provenance: CanonicalItemProvenance;
  blueprintOnly?: boolean;
}): { rarity: CanonicalRarity; candidates: ItemInfo[] } | null {
  const initialRank = rarityRank(options.rarity);
  for (let rank = initialRank; rank < RARITY_ORDER.length; rank += 1) {
    const rarity = RARITY_ORDER[rank];
    const candidates = eligibleCatalogItems({ ...options, rarity });
    if (candidates.length > 0) return { rarity, candidates };
  }
  return null;
}

export function validateItemCatalog(items: ItemInfo[] = ITEM_LIBRARY): string[] {
  const errors = validateUniqueItemIds(items).map((id) => `${id}:DUPLICATE_ID`);
  const weapons = new Set(WEAPON_INFO_LIST.map((entry) => entry.id));
  const offhands = new Set(OFF_HAND_INFO_LIST.map((entry) => entry.id));
  const armors = new Set(ARMOR_INFO_LIST.map((entry) => entry.id));
  const accessories = new Set(ACCESSORY_INFO_LIST.map((entry) => entry.id));

  for (const item of items) {
    if (!Number.isInteger(item.requiredLevel) || item.requiredLevel < 1) errors.push(`${item.id}:INVALID_LEVEL`);
    if (item.rarity !== item.minimumRarity) errors.push(`${item.id}:RARITY_ALIAS_MISMATCH`);
    if (item.provenances.length === 0) errors.push(`${item.id}:NO_PROVENANCE`);
    if (new Set(item.provenances).size !== item.provenances.length) errors.push(`${item.id}:DUPLICATE_PROVENANCE`);
    if (item.itemType === "weapon" && !weapons.has(item.weaponTypeId)) errors.push(`${item.id}:INVALID_WEAPON_TYPE`);
    if (item.itemType === "weapon" && !isValidWeaponScaling(item.scaling)) errors.push(`${item.id}:INVALID_WEAPON_SCALING`);
    if (item.itemType === "weapon" && !isValidWeaponAttackProfile(item.attackProfile)) {
      errors.push(`${item.id}:INVALID_WEAPON_ATTACK_PROFILE`);
    }
    if (
      item.itemType === "weapon"
      && (
        !Number.isInteger(item.damageRange.min)
        || !Number.isInteger(item.damageRange.max)
        || item.damageRange.min < 0
        || item.damageRange.max < item.damageRange.min
      )
    ) errors.push(`${item.id}:INVALID_WEAPON_DAMAGE_RANGE`);
    if (item.itemType === "weapon" && (!Number.isFinite(item.attackSpeed) || item.attackSpeed <= 0)) {
      errors.push(`${item.id}:INVALID_WEAPON_ATTACK_SPEED`);
    }
    if (item.itemType === "offhand" && !offhands.has(item.offHandTypeId)) errors.push(`${item.id}:INVALID_OFFHAND_TYPE`);
    if (item.itemType === "armor" && !armors.has(item.armorTypeId)) errors.push(`${item.id}:INVALID_ARMOR_TYPE`);
    if (item.itemType === "accessory" && !accessories.has(item.accessoryTypeId)) errors.push(`${item.id}:INVALID_ACCESSORY_TYPE`);
    for (const modifier of item.modifiers ?? []) {
      if (!modifier.stat || !isCanonicalItemModifierField(modifier.stat) || !Number.isFinite(modifier.value)) {
        errors.push(`${item.id}:INVALID_MODIFIER`);
      }
    }
  }
  return errors;
}

const catalogErrors = validateItemCatalog();
if (catalogErrors.length > 0) {
  throw new Error(`INVALID_ITEM_CATALOG:${catalogErrors.join(",")}`);
}
