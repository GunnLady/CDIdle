import {
  calculateHeroDerivedStats,
  type CanonicalHeroBaseStats,
  type CanonicalStatModifier,
} from "../../../shared/domain/hero-stats.ts";
import { getSkillById } from "../../../shared/data/game-data.ts";
import { getItemById } from "../../../shared/domain/items/items.ts";
import { resolveItemInstance } from "../../../shared/domain/items/scaling.ts";
import type { WeaponOffensiveContext } from "../../../shared/domain/weapon-combat.ts";

export type AuthoritativeNoviceStats = CanonicalHeroBaseStats;

export type AuthoritativeEquipment = Partial<Record<
  "mainHand" | "offHand" | "armor" | "accessory",
  {
    instanceId?: string;
    itemId: string;
    itemLevel?: number;
    powerModelId?: 'legacy-fixed-v1' | 'level-bands-v1';
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    modifiers?: Array<{ stat: string; type?: "flat" | "percent"; value: number }>;
  } | null
>>;

export function resolveAuthoritativeNoviceItemModifiers(
  itemId: string,
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" = "common",
  persisted?: Array<{ stat: string; type?: "flat" | "percent"; value: number }>,
  itemLevel?: number,
  powerModelId?: 'legacy-fixed-v1' | 'level-bands-v1',
  instanceId = itemId,
): CanonicalStatModifier[] {
  const item = getItemById(itemId);
  if (!item) return [];
  return resolveItemInstance(item, {
    instanceId,
    itemLevel: itemLevel ?? item.requiredLevel,
    powerModelId: powerModelId ?? item.powerModelId,
    rarity,
    modifiers: persisted?.map((modifier) => ({ ...modifier, type: modifier.type ?? "flat" })),
  }).modifiers ?? [];
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
    ? resolveAuthoritativeNoviceItemModifiers(
        item.itemId,
        item.rarity ?? "common",
        item.modifiers,
        item.itemLevel,
        item.powerModelId,
        item.instanceId,
      )
    : []);
  const mainHand = equipment.mainHand;
  let weaponContext: WeaponOffensiveContext | undefined;
  if (mainHand) {
    const item = getItemById(mainHand.itemId);
    if (item?.itemType === "weapon") {
      const scaled = resolveItemInstance(item, {
        instanceId: mainHand.instanceId ?? mainHand.itemId,
        itemLevel: mainHand.itemLevel ?? item.requiredLevel,
        powerModelId: mainHand.powerModelId ?? item.powerModelId,
        rarity: mainHand.rarity ?? "common",
        modifiers: mainHand.modifiers?.map((modifier) => ({ ...modifier, type: modifier.type ?? "flat" })),
      });
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
