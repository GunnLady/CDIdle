import type { ClassType, Hero, HeroStats, Resources } from "../types";
import { CLASS_INFO_LIST } from "../data/gameData";
import { calculateXpNeeded, evaluateAutomaticClassChange, refreshHeroDerivedStats } from "../utils/gameCalculations";
import type { Rng } from "./random";

export const recruitmentCost = (heroCount: number): number => 100 + Math.max(0, heroCount) * 150;

export type HeroEligibilityError = "INSUFFICIENT_GOLD" | "GUILD_REQUIRED" | "CAPACITY_REACHED";
export function recruitmentEligibility(heroCount: number, gold: number, guildLevel: number): { ok: true; cost: number; capacity: number } | { ok: false; error: HeroEligibilityError; cost: number; capacity: number } {
  const cost = recruitmentCost(heroCount);
  const capacity = Math.max(0, guildLevel) + 2;
  if (gold < cost) return { ok: false, error: "INSUFFICIENT_GOLD", cost, capacity };
  if (guildLevel < 1) return { ok: false, error: "GUILD_REQUIRED", cost, capacity };
  if (heroCount >= capacity) return { ok: false, error: "CAPACITY_REACHED", cost, capacity };
  return { ok: true, cost, capacity };
}

export type HeroRosterState = { heroes: Hero[]; resources: Resources; buildings: Record<string, number> };
export type RecruitmentResult = { ok: true; state: HeroRosterState; cost: number } | { ok: false; error: HeroEligibilityError; cost: number; capacity: number };

export function recruitHero(state: HeroRosterState, createHero: () => Hero): RecruitmentResult {
  const eligibility = recruitmentEligibility(state.heroes.length, state.resources.gold, state.buildings.guilde ?? 0);
  if (eligibility.ok === false) return { ok: false, error: eligibility.error, cost: eligibility.cost, capacity: eligibility.capacity };
  const hero = createHero();
  return {
    ok: true,
    cost: eligibility.cost,
    state: {
      ...state,
      resources: { ...state.resources, gold: state.resources.gold - eligibility.cost },
      heroes: [...state.heroes, hero]
    }
  };
}

export function dismissHero(heroes: Hero[], heroId: string): Hero[] { return heroes.filter((hero) => hero.id !== heroId); }
export function canActivateHero(hero: Hero, activeHeroCount: number): boolean { return !hero.isActive && hero.currentHp > 0 && activeHeroCount < 4; }
export type HeroActivityError = "HERO_NOT_FOUND" | "ALREADY_ACTIVE" | "ALREADY_INACTIVE" | "INVALID_HEALTH" | "ACTIVE_LIMIT";
export function setHeroActivity(heroes: Hero[], heroId: string, active: boolean): { ok: true; heroes: Hero[] } | { ok: false; error: HeroActivityError } {
  const target = heroes.find((hero) => hero.id === heroId);
  if (!target) return { ok: false, error: "HERO_NOT_FOUND" };
  if (target.isActive === active) return { ok: false, error: active ? "ALREADY_ACTIVE" : "ALREADY_INACTIVE" };
  if (active && target.currentHp <= 0) return { ok: false, error: "INVALID_HEALTH" };
  if (active && heroes.filter((hero) => hero.isActive).length >= 4) return { ok: false, error: "ACTIVE_LIMIT" };
  return { ok: true, heroes: heroes.map((hero) => hero.id === heroId ? { ...hero, isActive: active, status: active ? "idle" : "resting" } : { ...hero }) };
}

export function growHeroStats(baseStats: HeroStats, classType: ClassType, rng: Rng): HeroStats {
  const keys: (keyof HeroStats)[] = ["str", "agi", "end", "int", "wiz", "dex", "luk"];
  const classInfo = CLASS_INFO_LIST.find((entry) => entry.type === classType);
  const prioritized = classInfo?.tier && classInfo.tier > 0 ? classInfo.mainStats : [...keys].sort((a, b) => baseStats[b] - baseStats[a]).slice(0, 3);
  const fallback = keys.filter((key) => !prioritized.includes(key));
  const points = classInfo?.tier && classInfo.tier > 0 ? 8 : 5;
  const next = { ...baseStats };
  for (let index = 0; index < points; index += 1) {
    const pool = rng.next() < 0.8 ? prioritized : fallback;
    const selected = pool[rng.nextInt(pool.length)];
    next[selected] += 1;
  }
  return next;
}

export function addHeroExperience(hero: Hero, xpEarned: number, rng: Rng, buildings: Record<string, number> = {}): Hero {
  if (!Number.isFinite(xpEarned) || xpEarned < 0) return hero;
  let next = { ...hero, baseStats: { ...hero.baseStats }, xp: hero.xp + xpEarned };
  let leveledUp = false;
  while (next.xp >= next.xpNeeded) {
    next.xp -= next.xpNeeded;
    next.level += 1;
    next.baseStats = growHeroStats(next.baseStats, next.classType, rng);
    next.xpNeeded = calculateXpNeeded(next.level + 1, next.classType);
    leveledUp = true;
  }
  next = refreshHeroDerivedStats(next);
  if (!leveledUp) {
    next.currentHp = Math.min(next.calculatedStats.maxHp, hero.currentHp);
    next.currentMana = Math.min(next.calculatedStats.maxMana, hero.currentMana);
    return next;
  }
  next.currentHp = Math.min(next.calculatedStats.maxHp, hero.currentHp + Math.floor(next.calculatedStats.maxHp * 0.2));
  if (next.classType === "Novice" && next.level >= 10) {
    const evolution = evaluateAutomaticClassChange(next, buildings);
    if (evolution.newClass) {
      next = refreshHeroDerivedStats({ ...next, classType: evolution.newClass });
      next.currentHp = next.calculatedStats.maxHp;
      next.currentMana = next.calculatedStats.maxMana;
    }
  }
  return next;
}

export function chooseAutomaticClass(hero: Hero, buildings: Record<string, number>): ClassType | null {
  return evaluateAutomaticClassChange(hero, buildings).newClass;
}
