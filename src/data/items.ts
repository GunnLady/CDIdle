import { ItemInfo } from "../types";

export const NOVICE_BASIC_ITEM_LIST: ItemInfo[] = [
  {
    id: "starter_sword",
    name: "Épée de départ",
    itemType: "weapon",
    weaponTypeId: "sword",
    rarity: "common",
    requiredLevel: 1,
    description: "Une épée simple et fiable pour les premiers combats.",
    damageRange: {
      min: 1,
      max: 3
    },
    attackSpeed: 1,
    damageTypes: ["physical"],
    modifiers: [
      {
        stat: "physicalDamage",
        type: "flat",
        value: 1
      }
    ]
  },
  {
    id: "quick_dagger",
    name: "Dague vive",
    itemType: "weapon",
    weaponTypeId: "dagger",
    rarity: "common",
    requiredLevel: 1,
    description: "Une dague légère, facile à manier et rapide à dégainer.",
    damageRange: {
      min: 1,
      max: 2
    },
    attackSpeed: 1.2,
    damageTypes: ["physical"],
    modifiers: [
      {
        stat: "criticalChance",
        type: "percent",
        value: 1
      }
    ]
  },
  {
    id: "woodcutter_axe",
    name: "Hache de bûcheron",
    itemType: "weapon",
    weaponTypeId: "axe",
    rarity: "common",
    requiredLevel: 1,
    description: "Une hache simple, plus habituée au bois qu’aux monstres, mais assez solide pour se défendre.",
    damageRange: {
      min: 2,
      max: 4
    },
    attackSpeed: 0.9,
    damageTypes: ["physical"],
    modifiers: [
      {
        stat: "physicalDamage",
        type: "flat",
        value: 2
      }
    ]
  },
  {
    id: "wooden_shield",
    name: "Bouclier en bois",
    itemType: "offhand",
    offHandTypeId: "shield",
    rarity: "common",
    requiredLevel: 1,
    description: "Un bouclier simple offrant une protection de base.",
    modifiers: [
      {
        stat: "physicalDefense",
        type: "flat",
        value: 1
      }
    ]
  },
  {
    id: "traveler_clothes",
    name: "Tenue de voyageur",
    itemType: "armor",
    armorTypeId: "cloth_armor",
    rarity: "common",
    requiredLevel: 1,
    description: "Une tenue légère et pratique pour partir à l’aventure.",
    modifiers: [
      {
        stat: "maxMana",
        type: "percent",
        value: 3
      }
    ]
  },
  {
    id: "simple_leather_armor",
    name: "Armure de cuir simple",
    itemType: "armor",
    armorTypeId: "leather_armor",
    rarity: "common",
    requiredLevel: 1,
    description: "Une armure légère offrant une protection correcte sans gêner les mouvements.",
    modifiers: [
      {
        stat: "physicalDefense",
        type: "percent",
        value: 5
      },
      {
        stat: "dodgeChance",
        type: "percent",
        value: 3
      }
    ]
  },
  {
    id: "novice_mystic_robe",
    name: "Robe mystique de novice",
    itemType: "armor",
    armorTypeId: "magic_robe",
    rarity: "common",
    requiredLevel: 1,
    description: "Une robe simple imprégnée d’une faible énergie mystique, offrant une légère protection contre les forces arcaniques et naturelles.",
    modifiers: [
      { stat: "maxMana", type: "percent", value: 5 },
      { stat: "arcaneResistance", type: "flat", value: 5 },
      { stat: "natureResistance", type: "flat", value: 5 }
    ]
  }
];

export const ITEM_LIBRARY: ItemInfo[] = [
  ...NOVICE_BASIC_ITEM_LIST
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
