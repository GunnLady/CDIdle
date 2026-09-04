import { describe, expect, it } from "vitest";
import { calculateXpNeeded } from "../shared/domain/hero-xp";
import type { DungeonXpRewardSource } from "../shared/domain/dungeon-xp-rewards";
import { HARMONIZED_HERO_XP_CURVE } from "./fixtures/xpProgression";
import {
  ACTIVE_REWARD_PROFILES,
  CANONICAL_PROFILE,
  CHALLENGE_KINDS,
  CHALLENGE_LEVEL_BANDS,
  ITEM_LEVEL_BANDS,
  MAX_EXPLORATIONS,
  MILESTONES,
  SEEDS,
  SEED_COUNT,
  TARGET_LEVEL,
  runLevel40Campaign,
  type ChallengeCalibrationResult,
} from "./helpers/heroXpTier1Campaign";

describe("complete Tier 1 XP campaign", () => {
  it("simulates the canonical reward and challenge curves to hero level 40", () => {
    const reports = ACTIVE_REWARD_PROFILES.flatMap((profile) => (
      SEEDS.map((seed) => runLevel40Campaign(profile, seed))
    ));
    if (SEED_COUNT <= 3) console.table(reports.map((report) => ({
      profil: CANONICAL_PROFILE.label,
      graine: report.seed,
      explorations: report.explorations,
      niveaux: report.finalLevels.join("/"),
      etage_max: report.highestFloor,
      combats: report.fights,
      non_combat: report.nonCombat,
      elites: report.elites,
      boss_majeurs: report.majorBosses,
      premiers_clears: report.firstClears,
      defaites: report.defeats,
      wipes: report.wipes,
      temps_visible_heures: Number((report.simulatedSeconds / 3_600).toFixed(1)),
      niveau_10: report.milestoneExplorations[10],
      niveau_20: report.milestoneExplorations[20],
      niveau_30: report.milestoneExplorations[30],
      niveau_35: report.milestoneExplorations[35],
      niveau_40: report.milestoneExplorations[40],
      xp_total: Object.values(report.xpBySource).reduce((sum, xp) => sum + xp, 0),
      ecart_xp_heros: Math.max(...Object.values(report.xpByHero)) - Math.min(...Object.values(report.xpByHero)),
      defis_tentes: report.challengeAttempts,
      defis_reussis: report.challengeSuccesses,
      defis_chance_nulle: report.challengeZeroChance,
      chance_moyenne_defi: report.challengeAttempts === 0
        ? 0
        : Number((report.challengeProbabilitySum / report.challengeAttempts).toFixed(3)),
      blocage: report.blockedReason ?? "-",
    })));

    for (const report of reports) {
      if (SEED_COUNT <= 3) {
        console.info(`[XPT1:${report.profile}:${report.seed}] XP by source`);
        console.table(report.xpBySource);
      }
      expect(report.explorations).toBeLessThan(MAX_EXPLORATIONS);
      if (!report.blockedReason) {
        expect(report.finalLevels.every((level) => level >= TARGET_LEVEL)).toBe(true);
      } else if (!report.forgeCandidate) {
        expect(report.blockedReason).toBeUndefined();
      }
      expect(report.fights).toBeGreaterThan(0);
      expect(report.nonCombat).toBeGreaterThan(0);
      expect(report.elites).toBeGreaterThan(0);
      expect(report.majorBosses).toBeGreaterThan(0);
      expect(report.firstClears).toBeGreaterThan(0);
      expect(report.itemLoots).toBeGreaterThan(0);
      expect(report.equipmentChanges).toBeGreaterThan(0);
      expect(ITEM_LEVEL_BANDS.reduce(
        (sum, band) => sum + report.itemByLevelBand[band].drops,
        0,
      )).toBe(report.itemLoots);
      expect(ITEM_LEVEL_BANDS.reduce(
        (sum, band) => sum + report.equipmentByLevelBand[band].changes,
        0,
      )).toBe(report.equipmentChanges);
      expect(ITEM_LEVEL_BANDS.reduce(
        (sum, band) => sum + report.equipmentByLevelBand[band].exposures,
        0,
      )).toBe(report.explorations);
      for (const band of ITEM_LEVEL_BANDS) {
        const itemResult = report.itemByLevelBand[band];
        expect(itemResult.immediatelyLevelUsable + itemResult.futureLevelLocked).toBe(itemResult.drops);
      }
      expect(report.challengeAttempts).toBeGreaterThan(0);
      expect(report.challengeSuccesses).toBeLessThanOrEqual(report.challengeAttempts);
      for (const source of [
        "regular_combat", "elite", "major_boss", "floor_first_clear", "treasure", "rest", "challenge",
      ] as const) {
        expect(report.xpBySource[source]).toBeGreaterThan(0);
      }
    }

    for (const profile of ACTIVE_REWARD_PROFILES) {
      const completed = reports.filter((report) => (
        report.profile === profile.id
        && !report.blockedReason
        && report.finalLevels.every((level) => level >= TARGET_LEVEL)
      ));
      if (!reports.some((report) => report.forgeCandidate)) {
        expect(completed.length).toBe(reports.filter((report) => report.profile === profile.id).length);
      }
      expect(reports
        .filter((report) => report.profile === profile.id)
        .reduce((sum, report) => sum + report.challengeSuccesses, 0)).toBeGreaterThan(0);
    }

    const balancedReports = reports;
    const balancedAttempts = balancedReports.reduce((sum, report) => sum + report.challengeAttempts, 0);
    const balancedSuccesses = balancedReports.reduce((sum, report) => sum + report.challengeSuccesses, 0);
    const balancedSuccessRate = balancedSuccesses / balancedAttempts;
    expect(balancedSuccessRate).toBeGreaterThan(0);
    console.table(CHALLENGE_LEVEL_BANDS.map((band) => {
      const attempts = balancedReports.reduce(
        (sum, report) => sum + report.challengeByLevelBand[band].attempts,
        0,
      );
      const successes = balancedReports.reduce(
        (sum, report) => sum + report.challengeByLevelBand[band].successes,
        0,
      );
      const zeroChance = balancedReports.reduce(
        (sum, report) => sum + report.challengeByLevelBand[band].zeroChance,
        0,
      );
      return {
        niveaux_heros: band,
        tentatives: attempts,
        reussites: successes,
        taux_reussite: attempts === 0 ? 0 : Number((successes / attempts).toFixed(3)),
        chance_nulle: zeroChance,
      };
    }));
    console.table(CHALLENGE_LEVEL_BANDS.flatMap((band) => CHALLENGE_KINDS.map((kind) => {
      const attempts = balancedReports.reduce(
        (sum, report) => sum + report.challengeByKindAndLevelBand[kind][band].attempts,
        0,
      );
      const successes = balancedReports.reduce(
        (sum, report) => sum + report.challengeByKindAndLevelBand[kind][band].successes,
        0,
      );
      const zeroChance = balancedReports.reduce(
        (sum, report) => sum + report.challengeByKindAndLevelBand[kind][band].zeroChance,
        0,
      );
      return {
        niveaux_heros: band,
        defi: kind,
        tentatives: attempts,
        taux_reussite: attempts === 0 ? 0 : Number((successes / attempts).toFixed(3)),
        taux_chance_nulle: attempts === 0 ? 0 : Number((zeroChance / attempts).toFixed(3)),
      };
    })));

    console.info("[XPT1] progression aggregate");
    console.table(ACTIVE_REWARD_PROFILES.map((profile) => {
      const profileReports = reports.filter((report) => report.profile === profile.id);
      const summary = (milestone: (typeof MILESTONES)[number]) => {
        const values = profileReports.flatMap((report) => {
          const value = report.milestoneExplorations[milestone];
          return value === undefined ? [] : [value];
        }).sort((left, right) => left - right);
        const at = (ratio: number) => values[Math.round((values.length - 1) * ratio)] ?? 0;
        return `${at(0.1)} / ${at(0.5)} / ${at(0.9)}`;
      };
      return {
        profil: profile.label,
        runs: profileReports.length,
        niveau_10_p10_mediane_p90: summary(10),
        niveau_20_p10_mediane_p90: summary(20),
        niveau_30_p10_mediane_p90: summary(30),
        niveau_35_p10_mediane_p90: summary(35),
        niveau_40_p10_mediane_p90: summary(40),
      };
    }));

    console.info("[XPT1] courbes XP gagnee et XP necessaire");
    console.table(ACTIVE_REWARD_PROFILES.flatMap((profile) => {
      const profileReports = reports.filter((report) => report.profile === profile.id);
      return Array.from({ length: TARGET_LEVEL - 1 }, (_, index) => index + 1).map((level) => {
        const gains = profileReports.map((report) => {
          const result = report.xpByHeroLevel[level]!;
          return result.exposures === 0 ? 0 : result.xp / result.exposures;
        }).sort((left, right) => left - right);
        const gainAt = (ratio: number) => gains[Math.round((gains.length - 1) * ratio)] ?? 0;
        const medianGain = gainAt(0.5);
        const xpNeeded = calculateXpNeeded(level + 1, "Novice", HARMONIZED_HERO_XP_CURVE);
        return {
          profil: profile.label,
          niveau_depart: level,
          xp_necessaire: xpNeeded,
          xp_gain_p10: Number(gainAt(0.1).toFixed(1)),
          xp_gain_mediane: Number(medianGain.toFixed(1)),
          xp_gain_p90: Number(gainAt(0.9).toFixed(1)),
          explorations_equivalentes: medianGain === 0 ? 0 : Number((xpNeeded / medianGain).toFixed(1)),
        };
      });
    }));

    console.info("[XPT1] XP gagnee par source");
    console.table(ACTIVE_REWARD_PROFILES.flatMap((profile) => {
      const profileReports = reports.filter((report) => report.profile === profile.id);
      const total = profileReports.reduce((sum, report) => (
        sum + Object.values(report.xpBySource).reduce((xpSum, xp) => xpSum + xp, 0)
      ), 0);
      return (Object.keys(profileReports[0]!.xpBySource) as DungeonXpRewardSource[]).map((source) => {
        const xp = profileReports.reduce((sum, report) => sum + report.xpBySource[source], 0);
        return {
          profil: profile.label,
          source,
          xp,
          part: Number((xp / total).toFixed(3)),
        };
      });
    }));

    const machineResult = {
      reports: reports.map((report) => ({
        seed: report.seed,
        explorations: report.explorations,
        simulatedSeconds: report.simulatedSeconds,
        highestFloor: report.highestFloor,
        finalLevels: report.finalLevels,
        blockedReason: report.blockedReason,
        itemLoots: report.itemLoots,
        equipmentChanges: report.equipmentChanges,
        combatLimitRetreats: report.combatLimitRetreats,
        forgeCandidate: report.forgeCandidate,
        milestones: report.milestoneExplorations,
      })),
      xpByHeroLevel: Object.fromEntries(Array.from({ length: TARGET_LEVEL - 1 }, (_, index) => [
        index + 1,
        {
          xp: reports.reduce((sum, report) => sum + report.xpByHeroLevel[index + 1]!.xp, 0),
          exposures: reports.reduce(
            (sum, report) => sum + report.xpByHeroLevel[index + 1]!.exposures,
            0,
          ),
        },
      ])),
      challengeByLevelBand: Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => [band, {
        attempts: reports.reduce((sum, report) => sum + report.challengeByLevelBand[band].attempts, 0),
        successes: reports.reduce((sum, report) => sum + report.challengeByLevelBand[band].successes, 0),
        zeroChance: reports.reduce((sum, report) => sum + report.challengeByLevelBand[band].zeroChance, 0),
      }])),
      challengeByKindAndLevelBand: Object.fromEntries(CHALLENGE_KINDS.map((kind) => [kind,
        Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => [band, {
          attempts: reports.reduce(
            (sum, report) => sum + report.challengeByKindAndLevelBand[kind][band].attempts,
            0,
          ),
          successes: reports.reduce(
            (sum, report) => sum + report.challengeByKindAndLevelBand[kind][band].successes,
            0,
          ),
          zeroChance: reports.reduce(
            (sum, report) => sum + report.challengeByKindAndLevelBand[kind][band].zeroChance,
            0,
          ),
        }]))
      ])),
      challengeByFloorAndKind: reports.reduce<Record<string, ChallengeCalibrationResult>>((combined, report) => {
        for (const [key, result] of Object.entries(report.challengeByFloorAndKind)) {
          const target = combined[key] ??= {
            attempts: 0,
            successes: 0,
            zeroChance: 0,
            partyLevelSum: 0,
            difficultySum: 0,
            probabilitySum: 0,
          };
          for (const field of Object.keys(target) as (keyof ChallengeCalibrationResult)[]) {
            target[field] += result[field];
          }
        }
        return combined;
      }, {}),
      challengeCandidateHistogram: reports.reduce<Record<string, number>>((combined, report) => {
        for (const [key, count] of Object.entries(report.challengeCandidateHistogram)) {
          combined[key] = (combined[key] ?? 0) + count;
        }
        return combined;
      }, {}),
      itemByLevelBand: Object.fromEntries(ITEM_LEVEL_BANDS.map((band) => [band, {
        drops: reports.reduce((sum, report) => sum + report.itemByLevelBand[band].drops, 0),
        immediatelyLevelUsable: reports.reduce(
          (sum, report) => sum + report.itemByLevelBand[band].immediatelyLevelUsable,
          0,
        ),
        futureLevelLocked: reports.reduce(
          (sum, report) => sum + report.itemByLevelBand[band].futureLevelLocked,
          0,
        ),
        requiredLevelSum: reports.reduce(
          (sum, report) => sum + report.itemByLevelBand[band].requiredLevelSum,
          0,
        ),
        rarity: Object.fromEntries([
          "common", "uncommon", "rare", "epic", "legendary",
        ].map((rarity) => [rarity, reports.reduce(
          (sum, report) => sum + report.itemByLevelBand[band].rarity[
            rarity as keyof typeof report.itemByLevelBand[typeof band]["rarity"]
          ],
          0,
        )])),
      }])),
      equipmentByLevelBand: Object.fromEntries(ITEM_LEVEL_BANDS.map((band) => [band, {
        changes: reports.reduce((sum, report) => sum + report.equipmentByLevelBand[band].changes, 0),
        absoluteGain: reports.reduce(
          (sum, report) => sum + report.equipmentByLevelBand[band].absoluteGain,
          0,
        ),
        relativeGain: reports.reduce(
          (sum, report) => sum + report.equipmentByLevelBand[band].relativeGain,
          0,
        ),
        maxRelativeGain: Math.max(
          ...reports.map((report) => report.equipmentByLevelBand[band].maxRelativeGain),
        ),
        maxRareOrBetterRelativeGain: Math.max(
          ...reports.map((report) => report.equipmentByLevelBand[band].maxRareOrBetterRelativeGain),
        ),
        partyEquipmentScoreSum: reports.reduce(
          (sum, report) => sum + report.equipmentByLevelBand[band].partyEquipmentScoreSum,
          0,
        ),
        exposures: reports.reduce(
          (sum, report) => sum + report.equipmentByLevelBand[band].exposures,
          0,
        ),
      }])),
      xpBySource: Object.fromEntries((Object.keys(reports[0]!.xpBySource) as DungeonXpRewardSource[])
        .map((source) => [source, reports.reduce((sum, report) => sum + report.xpBySource[source], 0)])),
    };
    console.info(`[XPT1_RESULT_B64]${Buffer.from(JSON.stringify(machineResult)).toString("base64")}`);

  }, 1_800_000);
});
