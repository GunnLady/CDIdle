import type { ClassType, Hero, HeroStats } from "../types";
import { CLASS_INFO_LIST } from "../data/gameData";
import { calculateXpNeeded, evaluateAutomaticClassChange, refreshHeroDerivedStats } from "../utils/gameCalculations";
import type { Rng } from "./random";

export const recruitmentCost = (heroCount: number): number => 100 + Math.max(0, heroCount) * 150;

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

export function addHeroExperience(hero: Hero, xpEarned: number, rng: Rng): Hero {
  if (!Number.isFinite(xpEarned) || xpEarned < 0) return hero;
  let next = { ...hero, baseStats: { ...hero.baseStats }, xp: hero.xp + xpEarned };
  while (next.xp >= next.xpNeeded) {
    next.xp -= next.xpNeeded;
    next.level += 1;
    next.baseStats = growHeroStats(next.baseStats, next.classType, rng);
    next.xpNeeded = calculateXpNeeded(next.level + 1, next.classType);
  }
  return refreshHeroDerivedStats(next);
}

export function chooseAutomaticClass(hero: Hero, buildings: Record<string, number>): ClassType | null {
  return evaluateAutomaticClassChange(hero, buildings).newClass;
}
