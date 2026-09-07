import type { CanonicalBaseItem, CanonicalItem, CanonicalItemModifier, CanonicalRarity } from "./types.ts";

export const RAT_KING_MARK_ID = "rat_king_mark";
export const RAT_KING_SIGNATURE_IDS = ["rat_king_fang", "outcasts_mantle", "tribute_chain"] as const;
export type RatKingSignatureId = typeof RAT_KING_SIGNATURE_IDS[number];

const shared: Omit<CanonicalBaseItem, "id" | "name" | "itemType" | "description"> = {
  rarity: "epic", minimumRarity: "epic", requiredLevel: 35,
  levelRange: { min: 35, max: 35 }, powerModelId: "legacy-fixed-v1", powerReferenceLevel: 35,
  catalogStatus: "active", provenances: ["forge"], blueprintAvailable: true,
  blueprintDiscovery: { kind: "random-drop", sources: ["boss"], floorMin: 50, floorMax: 50, weight: 1, bossIds: ["undercity:boss:50"] },
};

export const RAT_KING_SIGNATURE_ITEMS: CanonicalItem[] = [
  {
    ...shared, id: "rat_king_fang", name: "Croc du Roi", itemType: "weapon", weaponTypeId: "dagger",
    description: "Même arraché à sa mâchoire, le croc cherche encore la gorge des vivants.",
    scaling: { category: "finesse", stat: "agi" }, attackProfile: { baseStrikes: 1, powerPerStrike: 1, maxStrikes: 3 },
    damageRange: { min: 30, max: 55 }, attackSpeed: 1.35, damageTypes: ["physical"],
    modifiers: [
      { stat: "physicalDamage", type: "percent", value: 16 }, { stat: "criticalChance", type: "flat", value: 3.75 },
      { stat: "speed", type: "percent", value: 8 }, { stat: "holyResistance", type: "flat", value: -3.75 },
    ],
  },
  {
    ...shared, id: "outcasts_mantle", name: "Manteau des Exclus", itemType: "armor", armorTypeId: "leather_armor",
    description: "Chaque pièce de cuir porte la marque d'un Exclu auquel le Roi avait offert refuge.",
    modifiers: [
      { stat: "physicalDefense", type: "percent", value: 40 }, { stat: "magicDefense", type: "percent", value: 24 },
      { stat: "maxHp", type: "percent", value: 18 }, { stat: "fireResistance", type: "flat", value: -3.75 },
    ],
  },
  {
    ...shared, id: "tribute_chain", name: "Chaîne des tributs", itemType: "accessory", accessoryTypeId: "amulet",
    description: "Chaque maillon avait acheté le droit de traverser son royaume.",
    modifiers: [
      { stat: "maxHp", type: "percent", value: 20 }, { stat: "speed", type: "percent", value: 8 },
      { stat: "dodgeChance", type: "flat", value: 2.5 }, { stat: "poisonResistance", type: "flat", value: 7.5 },
      { stat: "maxMana", type: "percent", value: -4 },
    ],
  },
];

export const RAT_KING_SIGNATURE_FINAL_MODIFIERS: Record<CanonicalRarity, Partial<Record<RatKingSignatureId, CanonicalItemModifier[]>>> = {
  common: {}, uncommon: {}, rare: {},
  epic: {
    rat_king_fang: [{ stat: "physicalDamage", type: "percent", value: 40 }, { stat: "criticalChance", type: "flat", value: 15 }, { stat: "speed", type: "percent", value: 20 }, { stat: "holyResistance", type: "flat", value: -15 }],
    outcasts_mantle: [{ stat: "physicalDefense", type: "percent", value: 100 }, { stat: "magicDefense", type: "percent", value: 60 }, { stat: "maxHp", type: "percent", value: 45 }, { stat: "fireResistance", type: "flat", value: -15 }],
    tribute_chain: [{ stat: "maxHp", type: "percent", value: 50 }, { stat: "speed", type: "percent", value: 20 }, { stat: "dodgeChance", type: "flat", value: 10 }, { stat: "poisonResistance", type: "flat", value: 30 }, { stat: "maxMana", type: "percent", value: -10 }],
  },
  legendary: {
    rat_king_fang: [{ stat: "physicalDamage", type: "percent", value: 55 }, { stat: "criticalChance", type: "flat", value: 22 }, { stat: "speed", type: "percent", value: 30 }],
    outcasts_mantle: [{ stat: "physicalDefense", type: "percent", value: 260 }, { stat: "magicDefense", type: "percent", value: 160 }, { stat: "maxHp", type: "percent", value: 110 }],
    tribute_chain: [{ stat: "maxHp", type: "percent", value: 70 }, { stat: "speed", type: "percent", value: 28 }, { stat: "dodgeChance", type: "flat", value: 16 }, { stat: "poisonResistance", type: "flat", value: 46 }],
  },
};

export const RAT_KING_SIGNATURE_PARAMETERS = {
  directDropChance: 0.15, blueprintChance: 0.20, legendaryDirectChance: 4 / 23, legendaryCraftChance: 0.04,
  marksPerVictory: [1, 2] as const,
  recipeCosts: [
    { materialId: RAT_KING_MARK_ID, rarity: "epic", count: 6 },
    { materialId: "metal_scrap", rarity: "common", count: 18 },
    { materialId: "refined_metal", rarity: "uncommon", count: 3 },
  ] as const,
};

export function createRatKingSignatureInstance(itemId: RatKingSignatureId, rarity: "epic" | "legendary", instanceId: string) {
  return {
    instanceId, itemId, itemLevel: 35, powerModelId: "legacy-fixed-v1" as const, rarity,
    modifiers: RAT_KING_SIGNATURE_FINAL_MODIFIERS[rarity][itemId]?.map((modifier) => ({ ...modifier })) ?? [],
    sourceDungeonId: "undercity", sourceZoneId: "court",
  };
}
