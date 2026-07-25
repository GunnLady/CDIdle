import type { ClassType, Hero, HeroStats, Resources } from "../types.ts";
import { CLASS_INFO_LIST, getSkillById } from "../data/gameData.ts";
import { calculateXpNeeded, evaluateAutomaticClassChange, refreshHeroDerivedStats } from "../utils/gameCalculations.ts";
import type { Rng } from "./random.ts";

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
  if (!classInfo) throw new Error(`INVALID_HERO_CLASS:${classType}`);
  if (classInfo.tier > 0 && classInfo.mainStats.length === 0) {
    throw new Error(`EMPTY_CLASS_MAIN_STATS:${classType}`);
  }
  const prioritized = classInfo.tier > 0
    ? classInfo.mainStats
    : [...keys].sort((a, b) => baseStats[b] - baseStats[a]).slice(0, 3);
  const fallback = keys.filter((key) => !prioritized.includes(key));
  const points = classInfo.tier > 0 ? 8 : 5;
  const next = { ...baseStats };
  for (let index = 0; index < points; index += 1) {
    const pool = rng.next() < 0.8 ? prioritized : fallback;
    const selected = pool[rng.nextInt(pool.length)];
    next[selected] += 1;
  }
  return next;
}

export type HeroExperienceResult = {
  hero: Hero;
  levels: number[];
  classChange?: { from: ClassType; to: ClassType; reason: string };
  classStayed?: { classType: ClassType; reason: string };
};

function requiredTier1Class(classType: ClassType) {
  const classInfo = CLASS_INFO_LIST.find((entry) => entry.type === classType && entry.tier === 1);
  if (!classInfo) throw new Error(`INVALID_TIER1_CLASS:${classType}`);
  return classInfo;
}

function requiredSkillPool(
  skillIds: string[],
  expectedType: "active" | "passive",
  classType: ClassType,
): string[] {
  const invalid = skillIds.filter((skillId) => getSkillById(skillId)?.type !== expectedType);
  if (invalid.length > 0) {
    throw new Error(`INVALID_CLASS_SKILL_CATALOG:${classType}:${invalid.join(",")}`);
  }
  if (skillIds.length === 0) {
    throw new Error(`EMPTY_CLASS_SKILL_CATALOG:${classType}:${expectedType}`);
  }
  return [...skillIds];
}

function drawDistinctSkills(skillIds: string[], count: number, rng: Rng): string[] {
  if (skillIds.length < count) throw new Error("INSUFFICIENT_DISTINCT_CLASS_SKILLS");
  const available = [...skillIds];
  const selected: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const selectedIndex = rng.nextInt(available.length);
    selected.push(available[selectedIndex]);
    available.splice(selectedIndex, 1);
  }
  return selected;
}

export function assignTier1Skills(hero: Hero, classType: ClassType, rng: Rng): Pick<Hero, "activeSkills" | "passiveSkills"> {
  const classInfo = requiredTier1Class(classType);
  const activePool = requiredSkillPool(classInfo.activeSkills, "active", classType);
  const passivePool = requiredSkillPool(classInfo.passiveSkills, "passive", classType);
  const noviceClass = CLASS_INFO_LIST.find((entry) => entry.type === "Novice");
  const retainedNovicePassives = hero.passiveSkills.filter((skillId) => {
    return noviceClass?.passiveSkills.includes(skillId) === true;
  });

  if (classType === "Mage") {
    return {
      activeSkills: drawDistinctSkills(activePool, 2, rng),
      passiveSkills: [...retainedNovicePassives, ...drawDistinctSkills(passivePool, 1, rng)],
    };
  }

  if (classType === "Acolyte") {
    const guaranteedHeal = getSkillById("minor_heal");
    if (!guaranteedHeal || guaranteedHeal.type !== "active") {
      throw new Error("INVALID_ACOLYTE_GUARANTEED_SKILL:minor_heal");
    }
    return {
      activeSkills: ["minor_heal", ...drawDistinctSkills(activePool, 1, rng)],
      passiveSkills: [...retainedNovicePassives, ...drawDistinctSkills(passivePool, 1, rng)],
    };
  }

  return {
    activeSkills: drawDistinctSkills(activePool, 1, rng),
    passiveSkills: [...retainedNovicePassives, ...drawDistinctSkills(passivePool, 1, rng)],
  };
}

export function addHeroExperienceDetailed(
  hero: Hero,
  xpEarned: number,
  rng: Rng,
  buildings: Record<string, number> = {},
): HeroExperienceResult {
  if (!Number.isFinite(xpEarned) || xpEarned < 0) return { hero, levels: [] };
  let next = { ...hero, baseStats: { ...hero.baseStats }, xp: hero.xp + xpEarned };
  const levels: number[] = [];
  while (next.xp >= next.xpNeeded) {
    next.xp -= next.xpNeeded;
    next.level += 1;
    next.baseStats = growHeroStats(next.baseStats, next.classType, rng);
    next.xpNeeded = calculateXpNeeded(next.level + 1, next.classType);
    levels.push(next.level);
  }
  if (levels.length === 0) {
    next.currentHp = Math.min(hero.calculatedStats.maxHp, hero.currentHp);
    next.currentMana = Math.min(hero.calculatedStats.maxMana, hero.currentMana);
    return { hero: next, levels };
  }
  next = refreshHeroDerivedStats(next);
  next.currentHp = Math.min(next.calculatedStats.maxHp, hero.currentHp + Math.floor(next.calculatedStats.maxHp * 0.2));
  next.currentMana = Math.min(
    next.calculatedStats.maxMana,
    hero.currentMana + Math.floor(next.calculatedStats.maxMana * 0.3),
  );
  if (next.classType === "Novice" && next.level >= 10) {
    const evolution = evaluateAutomaticClassChange(next, buildings);
    if (evolution.newClass) {
      const from = next.classType;
      const skills = assignTier1Skills(next, evolution.newClass, rng);
      next = refreshHeroDerivedStats({
        ...next,
        classType: evolution.newClass,
        ...skills,
        cooldowns: {},
      });
      next.currentHp = next.calculatedStats.maxHp;
      next.currentMana = next.calculatedStats.maxMana;
      return {
        hero: next,
        levels,
        classChange: { from, to: evolution.newClass, reason: evolution.reason },
      };
    }
    return {
      hero: next,
      levels,
      classStayed: { classType: next.classType, reason: evolution.reason },
    };
  }
  return { hero: next, levels };
}

export function addHeroExperience(
  hero: Hero,
  xpEarned: number,
  rng: Rng,
  buildings: Record<string, number> = {},
): Hero {
  return addHeroExperienceDetailed(hero, xpEarned, rng, buildings).hero;
}

export function chooseAutomaticClass(hero: Hero, buildings: Record<string, number>): ClassType | null {
  return evaluateAutomaticClassChange(hero, buildings).newClass;
}
