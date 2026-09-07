import type { Hero, Monster, SkillInfo } from "../contracts/game.ts";
import { estimateNormalAttackDamage, estimateSkillDamage } from "./combat-tactics.ts";
import type { TemporaryCombatEffect } from "./combat-effects.ts";
import {
  createUndercityEnemyGroup,
  type UndercityBehavior,
  type UndercityEncounterBlueprint,
  type UndercityEnemy,
} from "./undercity.ts";

export type UndercityCombatGroup = {
  behavior: UndercityBehavior;
  members: UndercityEnemy[];
  selectedId: string;
  healingRemaining: number;
  baseStats: Record<string, { atk: number; def: number; magicDef: number }>;
};

export function createUndercityCombatGroup(monster: Monster, blueprint: UndercityEncounterBlueprint): UndercityCombatGroup {
  const members = createUndercityEnemyGroup(monster, blueprint);
  return {
    behavior: blueprint.behavior,
    members,
    selectedId: members[0].id,
    healingRemaining: Math.floor(monster.maxHp * 0.15),
    baseStats: Object.fromEntries(members.map((member) => [member.id, { atk: member.atk, def: member.def, magicDef: member.magicDef }])),
  };
}

export const livingUndercityEnemies = (group: UndercityCombatGroup) => group.members.filter((member) => member.hp > 0);

export function primaryUndercityEnemy(group: UndercityCombatGroup): UndercityEnemy {
  const living = livingUndercityEnemies(group);
  return living.find((member) => member.id === group.selectedId) ?? living[0] ?? group.members[group.members.length - 1];
}

export function chooseUndercityEnemyTarget(
  group: UndercityCombatGroup,
  hero: Hero,
  effects: TemporaryCombatEffect[],
): UndercityEnemy {
  const living = livingUndercityEnemies(group);
  const protectors = living.filter((member) => member.role === "protector" || member.role === "guard");
  const pool = protectors.length > 0 ? protectors : living;
  const target = pool.find((member) => estimateNormalAttackDamage(hero, member, effects) >= member.hp)
    ?? pool.find((member) => member.role === "support")
    ?? pool[0];
  group.selectedId = target.id;
  return target;
}

export function prepareUndercityEnemyRound(group: UndercityCombatGroup, round: number): UndercityEnemy[] {
  const living = livingUndercityEnemies(group);
  const guardAlive = living.some((member) => member.role === "guard");
  const protectorAlive = living.some((member) => member.role === "protector");
  for (const member of living) {
    const base = group.baseStats[member.id];
    let attackFactor = 1;
    let defenseFactor = 1;
    if (member.role === "king") {
      attackFactor = guardAlive ? 0.75 : 1.10;
      defenseFactor = guardAlive ? 1.15 : 0.85;
      member.intent = guardAlive ? "Commandement protégé" : "Assaut monstrueux";
    } else if (group.behavior === "cover") {
      defenseFactor = protectorAlive || (group.members.length === 1 && round <= 2) ? 1.15 : 0.85;
      member.intent = defenseFactor > 1 ? "Sous protection" : "Exposé";
    } else if (group.behavior === "surge") {
      attackFactor = round % 3 === 0 ? 1.15 : 0.65;
      member.intent = round % 3 === 0 ? "Assaut" : "Préparation";
    } else {
      member.intent = "Attaque";
    }
    member.atk = Math.max(1, Math.round(base.atk * attackFactor));
    member.def = Math.max(0, Math.round(base.def * defenseFactor));
    member.magicDef = Math.max(0, Math.round(base.magicDef * defenseFactor));
  }
  return living;
}

export function performUndercitySupport(group: UndercityCombatGroup, member: UndercityEnemy, round: number) {
  if (member.hp <= 0 || member.role !== "support" || round % 3 !== 0 || group.healingRemaining <= 0) return null;
  const target = livingUndercityEnemies(group)
    .filter((candidate) => candidate.hp < candidate.maxHp)
    .sort((left, right) => (right.maxHp - right.hp) - (left.maxHp - left.hp) || left.id.localeCompare(right.id))[0];
  if (!target) return null;
  const healing = Math.min(target.maxHp - target.hp, Math.max(1, Math.floor(target.maxHp * 0.08)), group.healingRemaining);
  target.hp += healing;
  group.healingRemaining -= healing;
  return { target, healing };
}

export function damageUndercityEnemy(group: UndercityCombatGroup, targetId: string, damage: number): number {
  const target = group.members.find((member) => member.id === targetId);
  if (!target) throw new Error("UNDERCITY_TARGET_UNKNOWN");
  const applied = Math.min(target.hp, Math.max(0, damage));
  target.hp -= applied;
  return applied;
}

export function estimateUndercitySkillValue(
  group: UndercityCombatGroup,
  hero: Hero,
  skill: SkillInfo,
  effects: TemporaryCombatEffect[],
): number {
  const targets = skill.target === "all_enemies" ? livingUndercityEnemies(group) : [primaryUndercityEnemy(group)];
  return targets.reduce((total, target) => total + Math.min(target.hp, estimateSkillDamage(hero, target, skill, effects)), 0);
}

export function summarizeUndercityGroup(group: UndercityCombatGroup): Monster {
  const source = group.members[group.members.length - 1];
  return {
    ...source,
    hp: group.members.reduce((sum, member) => sum + member.hp, 0),
    maxHp: group.members.reduce((sum, member) => sum + member.maxHp, 0),
    isBoss: group.members.some((member) => member.isBoss),
  };
}
