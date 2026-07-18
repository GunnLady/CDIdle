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

export interface CombatantState extends BasicAttackProfile {
  hp: number;
  maxHp: number;
  physicalDefense: number;
  resistances: Partial<Record<Exclude<DamageType, "physical">, number>>;
}

export type CombatOutcome = "active" | "victory" | "defeat" | "retreated";

export interface CombatState {
  round: number;
  heroes: CombatantState[];
  enemy: CombatantState;
  outcome: CombatOutcome;
  transcript: CombatHit[];
}

export type CombatRoundError = "INVALID_STATE" | "ALREADY_FINISHED" | "NO_LIVING_HERO";
export type CombatRoundResult = { ok: true; state: CombatState } | { ok: false; error: CombatRoundError };

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

function isValidCombatant(combatant: CombatantState): boolean {
  return isValidAttackProfile(combatant)
    && Number.isFinite(combatant.hp) && Number.isFinite(combatant.maxHp)
    && combatant.maxHp > 0 && combatant.hp >= 0 && combatant.hp <= combatant.maxHp
    && Number.isFinite(combatant.physicalDefense) && combatant.physicalDefense >= 0;
}

function asTarget(combatant: CombatantState): CombatTarget {
  return {
    id: combatant.id,
    hp: combatant.hp,
    maxHp: combatant.maxHp,
    physicalDefense: combatant.physicalDefense,
    resistances: combatant.resistances,
  };
}

function asProfile(combatant: CombatantState): BasicAttackProfile {
  return {
    id: combatant.id,
    attackSpeed: combatant.attackSpeed,
    speed: combatant.speed,
    attack: combatant.attack,
    damageMin: combatant.damageMin,
    damageMax: combatant.damageMax,
    criticalChance: combatant.criticalChance,
    damageTypes: combatant.damageTypes,
  };
}

export function validateCombatState(state: CombatState): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(state.round) || state.round < 0) errors.push("round must be an integer >= 0");
  if (state.heroes.length === 0 || state.heroes.some((hero) => !isValidCombatant(hero))) errors.push("heroes must contain valid combatants");
  if (!isValidCombatant(state.enemy)) errors.push("enemy must be a valid combatant");
  if (state.transcript.some((hit, index) => hit.sequence !== index + 1)) errors.push("transcript sequence must be contiguous");
  return errors;
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

function appendTranscript(transcript: CombatHit[], hits: CombatHit[]): CombatHit[] {
  return [...transcript, ...hits.map((hit, index) => ({ ...hit, sequence: transcript.length + index + 1 }))];
}

export function resolveCombatRound(state: CombatState, rng: Rng): CombatRoundResult {
  if (validateCombatState(state).length > 0) return { ok: false, error: "INVALID_STATE" };
  if (state.outcome !== "active") return { ok: false, error: "ALREADY_FINISHED" };
  const livingHero = state.heroes.find((hero) => hero.hp > 0);
  if (!livingHero) return { ok: false, error: "NO_LIVING_HERO" };

  const heroAttack = resolveBasicAttack(asProfile(livingHero), asTarget(state.enemy), rng);
  if (!heroAttack.ok) return { ok: false, error: "INVALID_STATE" };
  let transcript = appendTranscript(state.transcript, heroAttack.result.hits);
  const heroes = state.heroes.map((hero) => ({ ...hero }));
  const enemy = { ...state.enemy, hp: heroAttack.result.target.hp };
  const round = state.round + 1;
  if (enemy.hp === 0) return { ok: true, state: { round, heroes, enemy, outcome: "victory", transcript } };

  const targetHero = heroes.find((hero) => hero.hp > 0)!;
  const enemyAttack = resolveBasicAttack(asProfile(state.enemy), asTarget(targetHero), rng);
  if (!enemyAttack.ok) return { ok: false, error: "INVALID_STATE" };
  transcript = appendTranscript(transcript, enemyAttack.result.hits);
  const updatedHeroes = heroes.map((hero) => hero.id === targetHero.id ? { ...hero, hp: enemyAttack.result.target.hp } : hero);
  const outcome: CombatOutcome = updatedHeroes.some((hero) => hero.hp > 0) ? "active" : "defeat";
  return { ok: true, state: { round, heroes: updatedHeroes, enemy, outcome, transcript } };
}

export function retreatCombat(state: CombatState): CombatRoundResult {
  if (validateCombatState(state).length > 0) return { ok: false, error: "INVALID_STATE" };
  if (state.outcome !== "active") return { ok: false, error: "ALREADY_FINISHED" };
  return { ok: true, state: { ...state, heroes: state.heroes.map((hero) => ({ ...hero })), enemy: { ...state.enemy }, outcome: "retreated" } };
}
