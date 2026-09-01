import { describe, expect, it } from "vitest";
import { calculateXpNeeded } from "../shared/domain/game-calculations";
import {
  HARMONIZED_T0_T1_XP_CURVE,
  OBSERVED_T1_LEVEL_20_EXPLORATIONS,
  OBSERVED_T1_LEVEL_30_EXPLORATIONS,
  OBSERVED_VISIBLE_SECONDS_PER_EXPLORATION,
} from "./fixtures/xpProgression";

type GainProfile = "tier_steps" | "progressive";

type Projection = {
  profile: GainProfile;
  tier2Explorations: number;
  tier3Explorations: number;
  projectedExplorations: number;
  totalExplorationsFromLevel1: number;
  visibleHoursFromLevel1: number;
  minExplorationsPerLevel: number;
  maxExplorationsPerLevel: number;
  milestoneExplorations: Record<number, number>;
};

const TIER_2_FIRST_LEVEL = 31;
const TIER_2_LAST_LEVEL = 60;
const TIER_3_FIRST_LEVEL = 61;
const MAX_LEVEL = 99;
const PROMOTION_GAIN_MULTIPLIER = 2;
const STEPPED_LINEAR_GAIN_PER_LEVEL = 0.06;
const PROGRESSIVE_GAIN_FACTOR = 1.18;
const OBSERVED_T1_EXPLORATIONS_PER_LEVEL = (
  OBSERVED_T1_LEVEL_30_EXPLORATIONS - OBSERVED_T1_LEVEL_20_EXPLORATIONS
) / 10;

function projectedXpCost(destinationLevel: number): number {
  return calculateXpNeeded(destinationLevel, "Guerrier", HARMONIZED_T0_T1_XP_CURVE);
}

function projectGainEconomy(profile: GainProfile): Projection {
  const baselineGainPerExploration = projectedXpCost(TIER_2_FIRST_LEVEL)
    / OBSERVED_T1_EXPLORATIONS_PER_LEVEL;
  const tier2ProgressiveStart = baselineGainPerExploration * PROMOTION_GAIN_MULTIPLIER;
  const tier3ProgressiveStart = tier2ProgressiveStart
    * Math.pow(PROGRESSIVE_GAIN_FACTOR, TIER_2_LAST_LEVEL - TIER_2_FIRST_LEVEL)
    * PROMOTION_GAIN_MULTIPLIER;
  let tier2Explorations = 0;
  let tier3Explorations = 0;
  let projectedExplorations = 0;
  let minExplorationsPerLevel = Number.POSITIVE_INFINITY;
  let maxExplorationsPerLevel = 0;
  const milestoneExplorations: Record<number, number> = {};

  for (let destinationLevel = TIER_2_FIRST_LEVEL; destinationLevel <= MAX_LEVEL; destinationLevel += 1) {
    const tier = destinationLevel <= TIER_2_LAST_LEVEL ? 2 : 3;
    const tierIndex = tier === 2
      ? destinationLevel - TIER_2_FIRST_LEVEL
      : destinationLevel - TIER_3_FIRST_LEVEL;
    const gainPerExploration = profile === "tier_steps"
      ? baselineGainPerExploration
        * Math.pow(PROMOTION_GAIN_MULTIPLIER, tier - 1)
        * (1 + STEPPED_LINEAR_GAIN_PER_LEVEL * tierIndex)
      : (tier === 2 ? tier2ProgressiveStart : tier3ProgressiveStart)
        * Math.pow(PROGRESSIVE_GAIN_FACTOR, tierIndex);
    const explorations = Math.ceil(projectedXpCost(destinationLevel) / gainPerExploration);

    projectedExplorations += explorations;
    if (tier === 2) tier2Explorations += explorations;
    else tier3Explorations += explorations;
    minExplorationsPerLevel = Math.min(minExplorationsPerLevel, explorations);
    maxExplorationsPerLevel = Math.max(maxExplorationsPerLevel, explorations);
    if ([35, 60, 65, 99].includes(destinationLevel)) {
      milestoneExplorations[destinationLevel] = projectedExplorations;
    }
  }

  const totalExplorationsFromLevel1 = OBSERVED_T1_LEVEL_30_EXPLORATIONS + projectedExplorations;
  return {
    profile,
    tier2Explorations,
    tier3Explorations,
    projectedExplorations,
    totalExplorationsFromLevel1,
    visibleHoursFromLevel1: totalExplorationsFromLevel1
      * OBSERVED_VISIBLE_SECONDS_PER_EXPLORATION / 3_600,
    minExplorationsPerLevel,
    maxExplorationsPerLevel,
    milestoneExplorations,
  };
}

describe("projected Tier 2 and Tier 3 XP gain economies", () => {
  it("compares tier-only gain jumps with compounding gains", () => {
    const stepped = projectGainEconomy("tier_steps");
    const progressive = projectGainEconomy("progressive");

    console.table([stepped, progressive].map((result) => ({
      modele: result.profile,
      explorations_T2: result.tier2Explorations,
      explorations_T3: result.tier3Explorations,
      explorations_30_99: result.projectedExplorations,
      explorations_1_99: result.totalExplorationsFromLevel1,
      heures_visibles_1_99: Number(result.visibleHoursFromLevel1.toFixed(1)),
      min_par_niveau: result.minExplorationsPerLevel,
      max_par_niveau: result.maxExplorationsPerLevel,
      niveau_35: result.milestoneExplorations[35],
      niveau_60: result.milestoneExplorations[60],
      niveau_65: result.milestoneExplorations[65],
      niveau_99: result.milestoneExplorations[99],
    })));

    expect(stepped.projectedExplorations).toBeGreaterThan(1_000_000);
    expect(progressive.projectedExplorations).toBeLessThan(10_000);
    expect(progressive.maxExplorationsPerLevel).toBeLessThan(stepped.maxExplorationsPerLevel);
    expect(projectedXpCost(MAX_LEVEL)).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });
});
