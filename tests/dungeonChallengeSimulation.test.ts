import { describe, expect, it } from "vitest";
import {
  DUNGEON_CHALLENGE_DEFINITIONS,
  getDungeonChallengeDifficulty,
  getDungeonChallengeSuccessProbability,
  selectBestDungeonChallengeCandidate,
  type DungeonChallengeKind,
  type DungeonChallengeStat,
} from "../shared/domain/dungeon-challenges";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { growHeroStats } from "../src/domain/hero";
import { seededRng } from "../src/domain/random";
import type { ClassType, HeroStats } from "../src/types";

const CHALLENGES = Object.entries(DUNGEON_CHALLENGE_DEFINITIONS).map(([kind, definition]) => [
  kind as DungeonChallengeKind,
  definition.statA,
  definition.statB,
] as const);

const BALANCED_PARTY = ["Voleur", "Aède", "Acolyte", "Pugiliste"] as const;
const TIER_ONE_CLASSES = [
  "Guerrier", "Voleur", "Archer", "Mage", "Acolyte", "Aède", "Druide", "Artificier", "Pugiliste",
] as const satisfies readonly ClassType[];

type SimulatedHero = {
  id: string;
  classType: ClassType;
  baseStats: HeroStats;
};

function simulateHero(seed: number, targetClass: ClassType, level: number): SimulatedHero {
  const generated = generateAuthoritativeNovice(`challenge-simulation-${seed}`, `hero-${seed}`);
  let stats = { ...generated.baseStats };
  const growthRng = seededRng(0x6d2b79f5 ^ seed);
  for (let nextLevel = 2; nextLevel <= level; nextLevel += 1) {
    // A vocation is resolved after the level-10 Novice growth.
    const growthClass = nextLevel <= 10 ? "Novice" : targetClass;
    stats = growHeroStats(stats, growthClass, growthRng);
  }
  return { id: `hero-${seed}`, classType: targetClass, baseStats: stats };
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function recommendedDifficulty(
  floor: number,
  kind: string,
  _statA: DungeonChallengeStat,
  _statB: DungeonChallengeStat,
): number {
  return getDungeonChallengeDifficulty(
    floor,
    DUNGEON_CHALLENGE_DEFINITIONS[kind as DungeonChallengeKind].difficultyProfile,
  );
}

function simulateBalancedParties(
  level: number,
  floor: number,
  difficulty: (floor: number, kind: string, statA: DungeonChallengeStat, statB: DungeonChallengeStat) => number,
  sampleCount = 200,
) {
  const probabilities = new Map<string, number[]>();
  for (const [kind] of CHALLENGES) probabilities.set(kind, []);

  for (let sample = 0; sample < sampleCount; sample += 1) {
    const party = BALANCED_PARTY.map((classType, index) =>
      simulateHero(sample * 10 + index + 1, classType, level)
    );
    for (const [kind, statA, statB] of CHALLENGES) {
      const selected = selectBestDungeonChallengeCandidate(
        party,
        statA,
        statB,
        difficulty(floor, kind, statA, statB),
      );
      probabilities.get(kind)!.push(selected?.successProbability ?? 0);
    }
  }

  return Object.fromEntries(
    CHALLENGES.map(([kind]) => [kind, mean(probabilities.get(kind) ?? [])]),
  );
}

describe("dungeon challenge probability model", () => {
  it("keeps the exact score + 1dLUK probability", () => {
    expect(getDungeonChallengeSuccessProbability(10, 1, 12)).toBe(0);
    expect(getDungeonChallengeSuccessProbability(11, 1, 12)).toBe(1);
    expect(getDungeonChallengeSuccessProbability(9, 7, 12)).toBeCloseTo(5 / 7);
  });

  it("selects by actual success probability before raw score", () => {
    const selected = selectBestDungeonChallengeCandidate([
      { id: "raw-score", baseStats: { str: 10, agi: 1, end: 1, int: 1, wiz: 1, dex: 0, luk: 1 } },
      { id: "probability", baseStats: { str: 9, agi: 1, end: 1, int: 1, wiz: 1, dex: 0, luk: 7 } },
    ], "str", "dex", 12);

    expect(selected?.hero.id).toBe("probability");
    expect(selected?.successProbability).toBeCloseTo(5 / 7);
  });

  it("keeps weak, adapted and advanced parties ordered on the approved curve", () => {
    const floors = [10, 20, 30, 40, 50];
    const report = Object.fromEntries(floors.map((floor) => [
      floor,
      {
        weak: simulateBalancedParties(Math.max(1, floor - 5), floor, recommendedDifficulty),
        adapted: simulateBalancedParties(floor, floor, recommendedDifficulty),
        advanced: simulateBalancedParties(floor + 5, floor, recommendedDifficulty),
      },
    ]));

    for (const profiles of Object.values(report)) {
      const weak = mean(Object.values(profiles.weak));
      const adapted = mean(Object.values(profiles.adapted));
      const advanced = mean(Object.values(profiles.advanced));
      expect(weak).toBeLessThan(adapted);
      expect(adapted).toBeLessThan(advanced);
    }
  });

  it("measures the benefit of probability-aware hero selection", () => {
    let changedSelections = 0;
    let comparisons = 0;
    let probabilityGain = 0;

    for (const floor of [1, 5, 10, 20, 30, 40, 50]) {
      for (let sample = 0; sample < 200; sample += 1) {
        const party = BALANCED_PARTY.map((classType, index) =>
          simulateHero(sample * 10 + index + 1, classType, floor)
        );
        for (const [kind, statA, statB] of CHALLENGES) {
          const difficulty = recommendedDifficulty(floor, kind, statA, statB);
          const raw = [...party].sort((left, right) =>
            (right.baseStats[statA] + right.baseStats[statB])
            - (left.baseStats[statA] + left.baseStats[statB])
          )[0];
          const rawScore = raw.baseStats[statA] + raw.baseStats[statB];
          const rawProbability = getDungeonChallengeSuccessProbability(
            rawScore,
            raw.baseStats.luk,
            difficulty,
          );
          const selected = selectBestDungeonChallengeCandidate(party, statA, statB, difficulty)!;
          comparisons += 1;
          if (selected.hero.id !== raw.id) changedSelections += 1;
          probabilityGain += selected.successProbability - rawProbability;
        }
      }
    }

    const report = {
      comparisons,
      changedSelectionRate: changedSelections / comparisons,
      meanProbabilityGain: probabilityGain / comparisons,
      meanGainWhenSelectionChanges: probabilityGain / changedSelections,
    };
    expect(report.changedSelectionRate).toBeGreaterThan(0);
    expect(report.meanProbabilityGain).toBeGreaterThan(0);
  });

  it("identifies the expected specialist classes for every challenge", () => {
    const report: Record<string, Record<string, { classType: ClassType; probability: number }>> = {};
    for (const floor of [10, 30, 50]) {
      report[floor] = {};
      for (const [kind, statA, statB] of CHALLENGES) {
        const classResults = TIER_ONE_CLASSES.map((classType) => ({
          classType,
          probability: mean(Array.from({ length: 200 }, (_, sample) => {
            const hero = simulateHero(sample + 1, classType, floor);
            const score = hero.baseStats[statA] + hero.baseStats[statB];
            return getDungeonChallengeSuccessProbability(
              score,
              hero.baseStats.luk,
              recommendedDifficulty(floor, kind, statA, statB),
            );
          })),
        })).sort((left, right) => right.probability - left.probability);
        report[floor][kind] = classResults[0];
      }
    }

    expect(["Voleur", "Archer"]).toContain(report[50].trap.classType);
    expect(["Aède", "Druide"]).toContain(report[50].enigma.classType);
    expect(["Voleur", "Archer", "Pugiliste"]).toContain(report[50].ambush.classType);
    expect(report[50].ritual.classType).toBe("Acolyte");
    expect(report[50].obstacle.classType).toBe("Pugiliste");
    expect(["Acolyte", "Aède", "Druide"]).toContain(report[50].negotiation.classType);
  });
});
