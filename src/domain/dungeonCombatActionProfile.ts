import type { EncounterSceneStep } from "./encounterSceneProjection";

export type DungeonCombatActionProfile =
  | "melee"
  | "projectile"
  | "magic"
  | "healing"
  | "support"
  | "neutral";

const DIRECT_MELEE_EVENT_TYPES: readonly string[] = [
  "hero.hit",
  "hero.hit.critical",
  "enemy.hit",
  "enemy.dodged",
  "hero.defeated",
];

// Stable action identifiers are presentation inputs; translated names and
// inferred hero classes deliberately are not.
const MELEE_SKILL_IDS: readonly string[] = [
  "heavy_blow",
  "cleaving_strike",
  "quick_shiv",
  "double_cut",
  "earthen_fist",
  "zephyr_strike",
  "rapid_combo",
];

const PROJECTILE_SKILL_IDS: readonly string[] = [
  "precise_shot",
  "piercing_arrow",
  "flame_thrower",
  "lightning_arc",
];

const MAGIC_SKILL_IDS: readonly string[] = [
  "fire_bolt",
  "ice_shard",
  "water_lance",
  "stone_spike",
  "wind_blade",
  "lightning_bolt",
  "holy_smite",
];

export function getDungeonCombatActionProfile(
  step: EncounterSceneStep | null,
): DungeonCombatActionProfile {
  if (!step) return "neutral";
  if (DIRECT_MELEE_EVENT_TYPES.includes(step.type)) return "melee";
  if (step.type === "hero.skill.heal") return "healing";
  if (step.type === "enemy.support") return "support";
  if (step.type !== "hero.skill.damage") return "neutral";
  if (step.skillId && MELEE_SKILL_IDS.includes(step.skillId)) return "melee";
  if (step.skillId && PROJECTILE_SKILL_IDS.includes(step.skillId)) return "projectile";
  if (step.skillId && MAGIC_SKILL_IDS.includes(step.skillId)) return "magic";
  return "neutral";
}
