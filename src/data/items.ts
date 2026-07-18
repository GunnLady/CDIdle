import { ItemInfo } from "../types";
import { TIER1_ITEM_WPN_LIST } from "./items_weapons_tier1";
import { TIER1_ITEM_ARMOR_LIST } from "./items_armors_tier1";
import { TIER1_ITEM_OFFHAND_LIST } from "./items_offhands_tier1";
import { TIER1_ITEM_ACC_LIST } from "./items_accessories_tier1";
import { HIGH_TIER_ITEM_LIST } from "./items_high_tier";
import { createWeapon, createOffhand, createArmor } from "./itemBuilders";

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

export const ITEM_LIBRARY: ItemInfo[] = [
  ...NOVICE_BASIC_ITEM_LIST,
  ...TIER1_ITEM_WPN_LIST,
  ...TIER1_ITEM_ARMOR_LIST,
  ...TIER1_ITEM_OFFHAND_LIST,
  ...TIER1_ITEM_ACC_LIST,
  ...HIGH_TIER_ITEM_LIST
];

export const ITEMS_BY_ID: Record<string, ItemInfo> = Object.fromEntries(
  ITEM_LIBRARY.map((item) => [item.id, item])
);

export function getItemById(itemId: string): ItemInfo | undefined {
  return ITEMS_BY_ID[itemId];
}

export function getItemsByIds(itemIds: string[]): ItemInfo[] {
  return itemIds
    .map((itemId) => ITEMS_BY_ID[itemId])
    .filter((item): item is ItemInfo => Boolean(item));
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

const duplicatedItemIds = validateUniqueItemIds(ITEM_LIBRARY);

if (duplicatedItemIds.length > 0) {
  console.warn("Duplicated item IDs found:", duplicatedItemIds);
}
