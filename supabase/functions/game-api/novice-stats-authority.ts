import {
  calculateHeroDerivedStats,
  type CanonicalHeroBaseStats,
  type CanonicalStatModifier,
} from "../../../shared/domain/hero-stats.ts";
import { getSkillById } from "../../../src/data/gameData.ts";

export type AuthoritativeNoviceStats = CanonicalHeroBaseStats;

export type AuthoritativeEquipment = Partial<Record<
  "mainHand" | "offHand" | "armor" | "accessory",
  {
    itemId: string;
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    modifiers?: Array<{ stat: string; type?: "flat" | "percent"; value: number }>;
  } | null
>>;

const ITEM_BASE_MODIFIERS: Record<string, CanonicalStatModifier[]> = {
  starter_sword: [{ stat: "physicalDamage", type: "flat", value: 1 }],
  quick_dagger: [{ stat: "criticalChance", type: "percent", value: 1 }],
  woodcutter_axe: [{ stat: "physicalDamage", type: "flat", value: 2 }],
  wooden_shield: [{ stat: "physicalDefense", type: "flat", value: 1 }],
  traveler_clothes: [{ stat: "maxMana", type: "percent", value: 3 }],
  simple_leather_armor: [
    { stat: "physicalDefense", type: "percent", value: 5 },
    { stat: "dodgeChance", type: "percent", value: 3 },
  ],
  novice_mystic_robe: [
    { stat: "maxMana", type: "percent", value: 5 },
    { stat: "arcaneResistance", type: "flat", value: 5 },
    { stat: "natureResistance", type: "flat", value: 5 },
  ],
};

const FLAT_RARITY_MULTIPLIERS = { common: 1, uncommon: 1.5, rare: 2.5, epic: 4, legendary: 6 } as const;
const PERCENT_RARITY_MULTIPLIERS = { common: 1, uncommon: 1.25, rare: 1.75, epic: 2.5, legendary: 3.5 } as const;

export function resolveAuthoritativeNoviceItemModifiers(
  itemId: string,
  rarity: keyof typeof FLAT_RARITY_MULTIPLIERS = "common",
  persisted?: Array<{ stat: string; type?: "flat" | "percent"; value: number }>,
): CanonicalStatModifier[] {
  if (persisted?.length) {
    return persisted.map((modifier) => ({ ...modifier, type: modifier.type ?? "flat" }));
  }
  return (ITEM_BASE_MODIFIERS[itemId] ?? []).map((modifier) => {
    const multiplier = modifier.type === "flat"
      ? FLAT_RARITY_MULTIPLIERS[rarity]
      : PERCENT_RARITY_MULTIPLIERS[rarity];
    return { ...modifier, value: Math.sign(modifier.value) * Math.round(Math.abs(modifier.value) * multiplier) };
  });
}

export function calculateAuthoritativeHeroStats(
  stats: AuthoritativeNoviceStats,
  passiveSkills: string[] | undefined,
  equipment: AuthoritativeEquipment,
) {
  const passiveModifiers = (passiveSkills ?? []).flatMap((skillId) => {
    const skill = getSkillById(skillId);
    if (!skill || skill.type !== "passive" || !("modifiers" in skill.effect)) return [];
    return skill.effect.modifiers.map((modifier) => ({ ...modifier, type: modifier.type ?? "flat" }));
  });
  const equipmentModifiers = Object.values(equipment).flatMap((item) => item
    ? resolveAuthoritativeNoviceItemModifiers(item.itemId, item.rarity ?? "common", item.modifiers)
    : []);
  return calculateHeroDerivedStats(stats, [...passiveModifiers, ...equipmentModifiers]);
}

export function calculateAuthoritativeNoviceStats(
  stats: AuthoritativeNoviceStats,
  passiveSkill: string | undefined,
  equipment: AuthoritativeEquipment,
) {
  return calculateAuthoritativeHeroStats(stats, passiveSkill ? [passiveSkill] : [], equipment);
}
