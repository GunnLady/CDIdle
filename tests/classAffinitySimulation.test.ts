import { describe, expect, it } from "vitest";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import {
  CLASS_CALIBRATION,
  calculateRawClassAffinity,
  evaluateTier1ClassAffinities,
  selectTier1VocationCandidates,
} from "../src/domain/classAffinity";
import { applyHeroExperienceLevels } from "../src/domain/hero";
import { seededRng } from "../src/domain/random";
import type { ClassType, Hero } from "../src/types";

const TIER1_CLASSES = [
  "Guerrier", "Voleur", "Archer", "Mage", "Acolyte",
  "A\u00e8de", "Druide", "Artificier", "Pugiliste",
] as const;

const ALL_CLASS_BUILDINGS = {
  caserne: 1,
  lair: 1,
  poste_chasse: 1,
  academie: 1,
  temple: 1,
  cercle: 1,
  forge: 1,
};

function levelTenNovice(index: number): Hero {
  let hero = generateAuthoritativeNovice(`affinity-${index}`, `hero-${index}`) as unknown as Hero;
  const rng = seededRng(0x51f15e + index * 7919);
  while (hero.level < 10) {
    hero = applyHeroExperienceLevels(hero, hero.xpNeeded, rng).hero;
  }
  return hero;
}


describe("Tier 1 class affinity calibration", () => {
  it("keeps the calibrated 10,000-Novice distribution balanced and mostly decisive", () => {
    const wins = new Map<ClassType, number>(TIER1_CLASSES.map((classType) => [classType, 0]));
    let multipleChoiceLists = 0;
    let shortlistContainsNaturalTopThree = 0;
    const trainingScores = new Map<ClassType, number[]>(TIER1_CLASSES.map((classType) => [classType, []]));

    for (let index = 0; index < 10_000; index += 1) {
      const hero = levelTenNovice(index);
      const ranked = evaluateTier1ClassAffinities(hero, ALL_CLASS_BUILDINGS);
      const shortlist = selectTier1VocationCandidates(hero, ALL_CLASS_BUILDINGS);
      wins.set(ranked[0].classType, (wins.get(ranked[0].classType) ?? 0) + 1);
      if (index < 5_000) {
        for (const classType of TIER1_CLASSES) {
          trainingScores.get(classType)?.push(calculateRawClassAffinity(hero, classType));
        }
      }
      if (shortlist.length > 1) multipleChoiceLists += 1;
      const naturalTopThree = [...TIER1_CLASSES]
        .map((classType) => ({ classType, score: calculateRawClassAffinity(hero, classType) }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 3)
        .map((entry) => entry.classType);
      if (shortlist.some((candidate) => naturalTopThree.includes(candidate.classType as typeof TIER1_CLASSES[number]))) {
        shortlistContainsNaturalTopThree += 1;
      }
    }

    const shares = [...wins.values()].map((count) => count / 10_000);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(0.03);
    const singleChoiceShare = 1 - multipleChoiceLists / 10_000;
    expect(Math.round(singleChoiceShare * 1_000) / 1_000).toBeGreaterThanOrEqual(0.8);
    expect(shortlistContainsNaturalTopThree / 10_000).toBeGreaterThanOrEqual(0.98);
    for (const classType of TIER1_CLASSES) {
      const values = trainingScores.get(classType) ?? [];
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
      expect(mean).toBeCloseTo(CLASS_CALIBRATION[classType].mean, 8);
      expect(deviation).toBeCloseTo(CLASS_CALIBRATION[classType].deviation, 8);
    }
  }, 60_000);

});
