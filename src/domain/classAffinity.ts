import { CLASS_INFO_LIST } from "../data/heroes.ts";
import type { CalculatedStats, ClassType, Hero, HeroStats } from "../types.ts";
import { getHeroAttributes, getHeroStats } from "../utils/gameCalculations.ts";

export const CLASS_AFFINITY_WINDOW = 0.01;

export type ClassAffinityCandidate = {
  classType: ClassType;
  affinity: number;
  rawScore: number;
};

type Tier1ClassInfo = (typeof CLASS_INFO_LIST)[number] & {
  jobChangeBuildingId: string;
  mainStats: [keyof HeroStats, keyof HeroStats];
  mainDerivedStats: (keyof CalculatedStats)[];
};

const DERIVED_WEIGHTS: Partial<Record<keyof CalculatedStats, number>> = {
  maxHp: 0.05,
  maxMana: 0.1,
  physicalDamage: 0.4,
  magicDamage: 0.4,
  physicalDefense: 0.4,
  magicDefense: 0.4,
  speed: 0.5,
  criticalChance: 0.5,
  dodgeChance: 0.5,
};

const tier1Classes = (): Tier1ClassInfo[] => CLASS_INFO_LIST.filter((entry) => (
  entry.tier === 1
  && typeof entry.jobChangeBuildingId === "string"
  && entry.mainStats.length === 2
  && Array.isArray(entry.mainDerivedStats)
  && entry.mainDerivedStats.length > 0
)) as Tier1ClassInfo[];

function derivedAffinity(
  derived: CalculatedStats,
  fields: (keyof CalculatedStats)[],
): number {
  const contributions = fields.map((field) => {
    const value = derived[field];
    const numeric = typeof value === "number" ? value : 0;
    return numeric * (DERIVED_WEIGHTS[field] ?? 0);
  });
  return contributions.reduce((sum, value) => sum + value, 0) / contributions.length;
}

export function calculateRawClassAffinity(
  hero: Hero,
  classType: ClassType,
): number {
  const info = tier1Classes().find((entry) => entry.type === classType);
  if (!info) throw new Error(`INVALID_TIER1_CLASS:${classType}`);
  const attributes = getHeroAttributes(hero);
  const derived = getHeroStats(hero);
  const [primary, secondary] = info.mainStats;
  const attributeAffinity = attributes[primary] * 0.6 + attributes[secondary] * 0.4;
  return attributeAffinity + derivedAffinity(derived, info.mainDerivedStats);
}

/**
 * Empirical level-10 Novice calibration. Values are populated from the fixed
 * 10 000-hero deterministic corpus covered by classAffinity.test.ts.
 */
export const CLASS_CALIBRATION: Record<Exclude<ClassType, "Novice">, {
  mean: number;
  deviation: number;
  offset: number;
}> = {
  Guerrier: { mean: 16.6796666667, deviation: 6.3447304732, offset: -0.1379824 },
  Voleur: { mean: 16.8806725, deviation: 5.5472834042, offset: -0.022274 },
  Archer: { mean: 18.1626366667, deviation: 5.6618825426, offset: -0.0209528 },
  Mage: { mean: 18.18271, deviation: 6.8454770064, offset: 0.0697166 },
  Acolyte: { mean: 16.1854833333, deviation: 5.4869293669, offset: -0.0213552 },
  "A\u00e8de": { mean: 17.9173333333, deviation: 7.5547409103, offset: 0.072152 },
  Druide: { mean: 17.9654933333, deviation: 7.8508390182, offset: 0.0783162 },
  Artificier: { mean: 18.08515, deviation: 6.1210040462, offset: 0.068637 },
  Pugiliste: { mean: 18.43442, deviation: 5.658954051, offset: -0.0862574 },
};

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

export function calculateCalibratedClassAffinity(
  hero: Hero,
  classType: Exclude<ClassType, "Novice">,
): number {
  const rawScore = calculateRawClassAffinity(hero, classType);
  const calibration = CLASS_CALIBRATION[classType];
  const zScore = (rawScore - calibration.mean) / calibration.deviation;
  // The percentile calibration balances ordinary Novices. Keeping a small
  // linear z-score component prevents the calibration offsets from reversing
  // an exceptionally strong, clearly oriented profile.
  return normalCdf(zScore) + zScore * 0.03 + calibration.offset;
}

export function evaluateTier1ClassAffinities(
  hero: Hero,
  buildings: Record<string, number>,
): ClassAffinityCandidate[] {
  if (hero.classType !== "Novice" || hero.level < 10) return [];
  return tier1Classes()
    .filter((entry) => (buildings[entry.jobChangeBuildingId] ?? 0) >= 1)
    .map((entry) => {
      const classType = entry.type as Exclude<ClassType, "Novice">;
      return {
        classType,
        affinity: calculateCalibratedClassAffinity(hero, classType),
        rawScore: calculateRawClassAffinity(hero, classType),
      };
    })
    .sort((left, right) => right.affinity - left.affinity
      || (left.classType < right.classType ? -1 : left.classType > right.classType ? 1 : 0));
}

export function selectTier1VocationCandidates(
  hero: Hero,
  buildings: Record<string, number>,
): ClassAffinityCandidate[] {
  const ranked = evaluateTier1ClassAffinities(hero, buildings);
  const best = ranked[0];
  if (!best) return [];
  const relativeWindow = best.affinity * CLASS_AFFINITY_WINDOW;
  return ranked.filter((candidate) => candidate === best
    || best.affinity - candidate.affinity < relativeWindow);
}
