import {
  calculateHeroDerivedStats,
  type CanonicalHeroBaseStats,
  type CanonicalStatModifier,
} from "../../../shared/domain/hero-stats.ts";
import { getSkillById } from "../../../shared/data/game-data.ts";
import { getItemById } from "../../../shared/domain/items/items.ts";
import { applyItemRarityScaling, resolveItemModifiers } from "../../../shared/domain/items/scaling.ts";
import type { WeaponOffensiveContext } from "../../../shared/domain/weapon-combat.ts";

export type AuthoritativeNoviceStats = CanonicalHeroBaseStats;

export type AuthoritativeEquipment = Partial<Record<
  "mainHand" | "offHand" | "armor" | "accessory",
  {
    itemId: string;
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    modifiers?: Array<{ stat: string; type?: "flat" | "percent"; value: number }>;
  } | null
>>;

export function resolveAuthoritativeNoviceItemModifiers(
  itemId: string,
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" = "common",
  persisted?: Array<{ stat: string; type?: "flat" | "percent"; value: number }>,
): CanonicalStatModifier[] {
  const item = getItemById(itemId);
  if (!item) return [];
  return resolveItemModifiers(
    item,
    rarity,
    persisted?.map((modifier) => ({ ...modifier, type: modifier.type ?? "flat" })),
  );
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
  const mainHand = equipment.mainHand;
  let weaponContext: WeaponOffensiveContext | undefined;
  if (mainHand) {
    const item = getItemById(mainHand.itemId);
    if (item?.itemType === "weapon") {
      const scaled = applyItemRarityScaling(item, mainHand.rarity ?? "common");
      weaponContext = {
        scaling: scaled.scaling,
        attackProfile: scaled.attackProfile,
        damageRange: scaled.damageRange,
        attackSpeed: scaled.attackSpeed,
      };
    }
  }
  return calculateHeroDerivedStats(
    stats,
    [...passiveModifiers, ...equipmentModifiers],
    weaponContext,
  );
}

export function calculateAuthoritativeNoviceStats(
  stats: AuthoritativeNoviceStats,
  passiveSkill: string | undefined,
  equipment: AuthoritativeEquipment,
) {
  return calculateAuthoritativeHeroStats(stats, passiveSkill ? [passiveSkill] : [], equipment);
}
