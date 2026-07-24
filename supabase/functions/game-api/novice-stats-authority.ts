import {
  calculateHeroDerivedStats,
  type CanonicalHeroBaseStats,
  type CanonicalStatModifier,
} from "../../../shared/domain/hero-stats.ts";

export type AuthoritativeNoviceStats = CanonicalHeroBaseStats;

export type AuthoritativeEquipment = Partial<Record<
  "mainHand" | "offHand" | "armor" | "accessory",
  { itemId: string } | null
>>;

export function calculateAuthoritativeNoviceStats(
  stats: AuthoritativeNoviceStats,
  passiveSkill: string | undefined,
  equipment: AuthoritativeEquipment,
) {
  const modifiers: CanonicalStatModifier[] = [];
  const add = (stat: string, value: number, type: "flat" | "percent" = "flat") => {
    modifiers.push({ stat, value, type });
  };

  if (passiveSkill === "survival_instinct") add("maxHp", 3, "percent");
  if (equipment.mainHand?.itemId === "starter_sword") add("physicalDamage", 1);
  if (equipment.mainHand?.itemId === "quick_dagger") add("criticalChance", 1, "percent");
  if (equipment.mainHand?.itemId === "woodcutter_axe") add("physicalDamage", 2);
  if (equipment.offHand?.itemId === "wooden_shield") add("physicalDefense", 1);
  if (equipment.armor?.itemId === "traveler_clothes") add("maxMana", 3, "percent");
  if (equipment.armor?.itemId === "simple_leather_armor") {
    add("physicalDefense", 5, "percent");
    add("dodgeChance", 3, "percent");
  }
  if (equipment.armor?.itemId === "novice_mystic_robe") {
    add("maxMana", 5, "percent");
    add("arcaneResistance", 5);
    add("natureResistance", 5);
  }

  return calculateHeroDerivedStats(stats, modifiers);
}
