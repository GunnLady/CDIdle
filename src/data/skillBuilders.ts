import { SkillInfo, SkillTarget, SkillEffect, DamageType } from "../types";
import { createModifiers } from "./modifierBuilder";

// Effect Builders
export function damageEffect(
  damageType: DamageType,
  scalingStat: string,
  power: number,
  hitCount: number = 1
): SkillEffect {
  return {
    type: "damage",
    damageType,
    scalingStat,
    power,
    hitCount
  };
}

export function buffEffect(
  durationRounds: number,
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[]
): SkillEffect {
  return {
    type: "buff",
    durationRounds,
    modifiers: createModifiers(modifiers)
  };
}

export function debuffEffect(
  durationRounds: number,
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[]
): SkillEffect {
  return {
    type: "debuff",
    durationRounds,
    modifiers: createModifiers(modifiers)
  };
}

export function healEffect(
  scalingStat: string,
  power: number
): SkillEffect {
  return {
    type: "heal",
    scalingStat,
    power
  };
}

export function statModifierEffect(
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[]
): SkillEffect {
  return {
    type: "stat_modifier",
    modifiers: createModifiers(modifiers)
  };
}

export function lootModifierEffect(
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[]
): SkillEffect {
  return {
    type: "loot_modifier",
    modifiers: createModifiers(modifiers)
  };
}

// Active Skill Builder
export function createActiveSkill(
  id: string,
  name: string,
  description: string,
  target: SkillTarget,
  manaCost: number,
  cooldownRounds: number,
  effect: SkillEffect
): SkillInfo {
  return {
    id,
    name,
    description,
    type: "active",
    target,
    manaCost,
    cooldownRounds,
    effect
  };
}

// Passive Skill Builder
export function createPassiveSkill(
  id: string,
  name: string,
  description: string,
  effect: SkillEffect
): SkillInfo {
  return {
    id,
    name,
    description,
    type: "passive",
    effect
  };
}
