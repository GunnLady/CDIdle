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
const PROJECTILE_SKILL_IDS: readonly string[] = [
  "precise_shot",
  "piercing_arrow",
];

export function getDungeonCombatActionProfile(
  step: EncounterSceneStep | null,
): DungeonCombatActionProfile {
  if (!step) return "neutral";
  if (DIRECT_MELEE_EVENT_TYPES.includes(step.type)) return "melee";
  if (step.type === "hero.skill.heal") return "healing";
  if (step.type === "enemy.support") return "support";
  if (step.type !== "hero.skill.damage") return "neutral";
  if (step.skillId && PROJECTILE_SKILL_IDS.includes(step.skillId)) return "projectile";
  if (step.damageType === "physical") return "melee";
  if (step.damageType) return "magic";
  return "neutral";
}
