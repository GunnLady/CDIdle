import type {
  CanonicalItem,
  CanonicalItemModifier,
  CanonicalRarity,
} from "./types.ts";

export const ITEM_RARITY_DAMAGE_MULTIPLIERS: Record<CanonicalRarity, number> = {
  common: 1, uncommon: 1.5, rare: 2.25, epic: 3.5, legendary: 5,
};

export const ITEM_RARITY_FLAT_MODIFIER_MULTIPLIERS: Record<CanonicalRarity, number> = {
  common: 1, uncommon: 1.5, rare: 2.5, epic: 4, legendary: 6,
};

export const ITEM_RARITY_PERCENT_MODIFIER_MULTIPLIERS: Record<CanonicalRarity, number> = {
  common: 1, uncommon: 1.25, rare: 1.75, epic: 2.5, legendary: 3.5,
};

export const ITEM_RARITY_MODIFIER_COUNTS: Record<CanonicalRarity, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5,
};

const WEAPON_POOL = ["physicalDamage", "magicDamage", "criticalChance", "speed", "dodgeChance"];
const ARMOR_POOL = [
  "maxHp", "maxMana", "physicalDefense", "magicDefense", "dodgeChance",
  "fireResistance", "iceResistance", "waterResistance", "earthResistance",
  "windResistance", "lightningResistance", "holyResistance", "darkResistance",
  "natureResistance", "arcaneResistance", "poisonResistance", "bloodResistance",
  "soundResistance", "radiantResistance",
];
const ACCESSORY_POOL = [
  "maxHp", "maxMana", "physicalDamage", "magicDamage", "criticalChance",
  "dodgeChance", "speed", ...ARMOR_POOL.slice(5),
];

const EXTRA_MODIFIER_TEMPLATES: Record<string, Array<{ type: "flat" | "percent"; baseValue: number }>> = {
  physicalDamage: [{ type: "flat", baseValue: 1 }, { type: "percent", baseValue: 1.5 }],
  magicDamage: [{ type: "flat", baseValue: 1 }, { type: "percent", baseValue: 1.5 }],
  criticalChance: [{ type: "flat", baseValue: 1 }, { type: "percent", baseValue: 1.5 }],
  speed: [{ type: "flat", baseValue: 1 }, { type: "percent", baseValue: 1.5 }],
  maxHp: [{ type: "flat", baseValue: 5 }, { type: "percent", baseValue: 2 }],
  maxMana: [{ type: "flat", baseValue: 5 }, { type: "percent", baseValue: 2 }],
  physicalDefense: [{ type: "flat", baseValue: 1 }, { type: "percent", baseValue: 1.5 }],
  magicDefense: [{ type: "flat", baseValue: 1 }, { type: "percent", baseValue: 1.5 }],
  dodgeChance: [{ type: "percent", baseValue: 1.5 }],
  fireResistance: [{ type: "flat", baseValue: 3 }],
  iceResistance: [{ type: "flat", baseValue: 3 }],
  waterResistance: [{ type: "flat", baseValue: 3 }],
  earthResistance: [{ type: "flat", baseValue: 3 }],
  windResistance: [{ type: "flat", baseValue: 3 }],
  lightningResistance: [{ type: "flat", baseValue: 3 }],
  holyResistance: [{ type: "flat", baseValue: 3 }],
  darkResistance: [{ type: "flat", baseValue: 3 }],
  natureResistance: [{ type: "flat", baseValue: 3 }],
  arcaneResistance: [{ type: "flat", baseValue: 3 }],
  poisonResistance: [{ type: "flat", baseValue: 3 }],
  bloodResistance: [{ type: "flat", baseValue: 3 }],
  soundResistance: [{ type: "flat", baseValue: 3 }],
  radiantResistance: [{ type: "flat", baseValue: 3 }],
};

export function scaleModifierByRarity(
  modifier: CanonicalItemModifier,
  rarity: CanonicalRarity,
): CanonicalItemModifier {
  const multiplier = modifier.type === "flat"
    ? ITEM_RARITY_FLAT_MODIFIER_MULTIPLIERS[rarity]
    : ITEM_RARITY_PERCENT_MODIFIER_MULTIPLIERS[rarity];
  return {
    ...modifier,
    value: Math.sign(modifier.value) * Math.round(Math.abs(modifier.value) * multiplier),
  };
}

export function generateExtraModifiersForRarity(
  item: CanonicalItem,
  rarity: CanonicalRarity,
): CanonicalItemModifier[] {
  const baseModifiers = item.modifiers ?? [];
  const needed = Math.max(0, ITEM_RARITY_MODIFIER_COUNTS[rarity] - baseModifiers.length);
  const pool = item.itemType === "weapon"
    ? WEAPON_POOL
    : item.itemType === "accessory"
    ? ACCESSORY_POOL
    : ARMOR_POOL;
  const used = new Set(baseModifiers.map((modifier) => modifier.stat));
  let seed = 0;
  for (const character of `${item.id}_${rarity}`) seed = (seed * 31 + character.charCodeAt(0)) | 0;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const result: CanonicalItemModifier[] = [];
  for (let index = 0; index < needed; index += 1) {
    const unused = pool.filter((stat) => !used.has(stat));
    const candidates = unused.length > 0 ? unused : pool;
    const stat = candidates[Math.floor(next() * candidates.length)];
    used.add(stat);
    const templates = EXTRA_MODIFIER_TEMPLATES[stat] ?? [{ type: "flat" as const, baseValue: 1 }];
    const template = templates[Math.floor(next() * templates.length)];
    result.push(scaleModifierByRarity({ stat, type: template.type, value: template.baseValue }, rarity));
  }
  return result;
}

export function resolveItemModifiers(
  item: CanonicalItem,
  rarity: CanonicalRarity,
  persisted?: CanonicalItemModifier[],
): CanonicalItemModifier[] {
  if (persisted?.length) return persisted.map((modifier) => ({ ...modifier }));
  return [
    ...(item.modifiers ?? []).map((modifier) => scaleModifierByRarity(modifier, rarity)),
    ...generateExtraModifiersForRarity(item, rarity),
  ];
}

export function applyItemRarityScaling<T extends CanonicalItem>(
  item: T,
  rarity: CanonicalRarity,
  skipExtraModifiers = false,
): T {
  const scaled = {
    ...item,
    rarity,
    modifiers: (item.modifiers ?? []).map((modifier) => scaleModifierByRarity(modifier, rarity)),
  } as T;
  if (scaled.itemType === "weapon" && scaled.damageRange) {
    const multiplier = ITEM_RARITY_DAMAGE_MULTIPLIERS[rarity];
    scaled.damageRange = {
      min: Math.max(1, Math.round(scaled.damageRange.min * multiplier)),
      max: Math.max(1, Math.round(scaled.damageRange.max * multiplier)),
    };
  }
  if (!skipExtraModifiers) {
    scaled.modifiers = [...(scaled.modifiers ?? []), ...generateExtraModifiersForRarity(item, rarity)];
  }
  return scaled;
}
