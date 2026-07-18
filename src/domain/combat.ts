import type { DamageType } from "../types";
import type { Rng } from "./random";

export const MAX_BASIC_ATTACK_STRIKES = 3;

export interface BasicAttackProfile {
  id: string;
  attackSpeed: number;
  speed: number;
  attack: number;
  damageMin: number;
  damageMax: number;
  criticalChance: number;
  damageTypes: DamageType[];
}

export interface CombatTarget {
  id: string;
  hp: number;
  maxHp: number;
  physicalDefense: number;
  resistances: Partial<Record<Exclude<DamageType, "physical">, number>>;
}

export interface CombatHit {
  sequence: number;
  attackerId: string;
  targetId: string;
  strike: number;
  strikeCount: number;
  rawDamage: number;
  critical: boolean;
  damage: number;
  targetHpAfter: number;
}

export interface BasicAttackResult {
  target: CombatTarget;
  strikes: number;
  hits: CombatHit[];
}

export type CombatError = "INVALID_ATTACKER" | "INVALID_TARGET";
export type CombatResult = { ok: true; result: BasicAttackResult } | { ok: false; error: CombatError };

function isValidAttackProfile(profile: BasicAttackProfile): boolean {
  return profile.id.length > 0
    && Number.isFinite(profile.attackSpeed) && profile.attackSpeed > 0
    && Number.isFinite(profile.speed) && profile.speed >= 0
    && Number.isFinite(profile.attack) && profile.attack >= 0
    && Number.isInteger(profile.damageMin) && profile.damageMin >= 0
    && Number.isInteger(profile.damageMax) && profile.damageMax >= profile.damageMin
    && Number.isFinite(profile.criticalChance) && profile.criticalChance >= 0 && profile.criticalChance <= 1
    && profile.damageTypes.length > 0;
}

function isValidTarget(target: CombatTarget): boolean {
  return target.id.length > 0
    && Number.isFinite(target.hp) && Number.isFinite(target.maxHp)
    && target.maxHp > 0 && target.hp >= 0 && target.hp <= target.maxHp
    && Number.isFinite(target.physicalDefense) && target.physicalDefense >= 0;
}

/** Existing gameplay rule: weapon speed bonus and hero speed are cumulative percentage points. */
export function calculateMultiStrikeChance(attackSpeed: number, speed: number): number {
  return Math.max(0, (attackSpeed - 1) * 100 + speed);
}

export function resolveMultiStrikeCount(attackSpeed: number, speed: number, rng: Rng): number {
  const chance = calculateMultiStrikeChance(attackSpeed, speed);
  let strikes = 1;
  let remainingChance = chance;
  while (remainingChance > 0 && strikes < MAX_BASIC_ATTACK_STRIKES) {
    if (remainingChance >= 100) {
      strikes += 1;
      remainingChance -= 100;
      continue;
    }
    if (rng.next() < remainingChance / 100) strikes += 1;
    break;
  }
  return strikes;
}

function damageAfterDefense(damage: number, damageType: DamageType, target: CombatTarget): number {
  if (damageType === "physical") return Math.max(1, damage - target.physicalDefense);
  const resistance = target.resistances[damageType] ?? 0;
  return Math.max(1, Math.floor(damage * (1 - resistance / 100)));
}

function applyTypedDamage(damage: number, damageTypes: DamageType[], target: CombatTarget): number {
  const splitDamage = damage / damageTypes.length;
  return Math.max(1, Math.round(damageTypes.reduce(
    (total, damageType) => total + damageAfterDefense(splitDamage, damageType, target), 0
  )));
}

export function resolveBasicAttack(profile: BasicAttackProfile, target: CombatTarget, rng: Rng): CombatResult {
  if (!isValidAttackProfile(profile)) return { ok: false, error: "INVALID_ATTACKER" };
  if (!isValidTarget(target)) return { ok: false, error: "INVALID_TARGET" };

  const strikes = resolveMultiStrikeCount(profile.attackSpeed, profile.speed, rng);
  let nextTarget = { ...target };
  const hits: CombatHit[] = [];
  for (let strike = 1; strike <= strikes; strike += 1) {
    const weaponDamage = profile.damageMin === profile.damageMax
      ? profile.damageMin
      : profile.damageMin + rng.nextInt(profile.damageMax - profile.damageMin + 1);
    const rawDamage = profile.attack + weaponDamage;
    const critical = rng.next() < profile.criticalChance;
    const criticalDamage = critical ? Math.floor(rawDamage * 1.5) : rawDamage;
    const damage = applyTypedDamage(criticalDamage, profile.damageTypes, nextTarget);
    nextTarget = { ...nextTarget, hp: Math.max(0, nextTarget.hp - damage) };
    hits.push({ sequence: hits.length + 1, attackerId: profile.id, targetId: target.id, strike, strikeCount: strikes, rawDamage: criticalDamage, critical, damage, targetHpAfter: nextTarget.hp });
    if (nextTarget.hp === 0) break;
  }
  return { ok: true, result: { target: nextTarget, strikes, hits } };
}
