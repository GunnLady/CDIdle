import { describe, expect, it } from "vitest";
import {
  resolveAuthoritativeDungeonEncounter,
  type AuthoritativeDungeonState,
} from "../shared/domain/authoritative-dungeon";
import {
  calculateXpNeeded,
  type XpProgressionCurve,
} from "../shared/domain/game-calculations";
import { LEGACY_HERO_PROGRESSION_MODEL } from "../shared/data/hero-progression-models";
import { seededRng } from "../shared/domain/random";
import type { Hero } from "../src/types";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { HARMONIZED_HERO_XP_CURVE } from "./fixtures/xpProgression";

type RecoveryMode = "isolated" | "attrition";
type ProfileId = "legacy" | "moderate" | "fluid" | "harmonized";
type Milestone = 5 | 10 | 15 | 20 | 25 | 30;

type CurveProfile = {
  id: ProfileId;
  label: string;
  curve: XpProgressionCurve;
};

type CampaignResult = {
  profile: ProfileId;
  mode: RecoveryMode;
  encounters: number;
  defeats: number;
  wipes: number;
  transcriptEvents: number;
  highestFloor: number;
  completedTarget: boolean;
  blockedFloor?: number;
  finalLevels: number[];
  milestoneFloors: Partial<Record<Milestone, number>>;
};

const PROFILES: readonly CurveProfile[] = [
  {
    id: "legacy",
    label: "Historique (x1.50, T1 x1.25)",
    curve: LEGACY_HERO_PROGRESSION_MODEL.xpCurve,
  },
  {
    id: "moderate",
    label: "Moderee (x1.35, T1 x1.15)",
    curve: {
      kind: "global",
      growthFactor: 1.35,
      tierMultipliers: { 0: 1, 1: 1.15, 2: 1.6, 3: 2 },
    },
  },
  {
    id: "fluid",
    label: "Fluide (x1.30, T1 x1.10)",
    curve: {
      kind: "global",
      growthFactor: 1.3,
      tierMultipliers: { 0: 1, 1: 1.1, 2: 1.6, 3: 2 },
    },
  },
  {
    id: "harmonized",
    label: "Harmonisee (niveaux 2-10 x1.30, 11+ x1.20)",
    curve: HARMONIZED_HERO_XP_CURVE,
  },
] as const;

const MODES: readonly RecoveryMode[] = ["isolated", "attrition"];
const MILESTONES: readonly Milestone[] = [5, 10, 15, 20, 25, 30];
const SEEDS = Array.from({ length: 20 }, (_, index) => 0x510001 + index);
const TARGET_FLOOR = 30;
const MAX_ENCOUNTERS = 2_000;
const MAX_STALLED_ENCOUNTERS = 50;

function recoverParty(state: AuthoritativeDungeonState): AuthoritativeDungeonState {
  return {
    ...state,
    heroes: state.heroes?.map((hero) => ({
      ...hero,
      isActive: true,
      status: "idle",
      currentHp: hero.calculatedStats.maxHp,
      currentMana: hero.calculatedStats.maxMana,
    })),
  };
}

function initialCampaignState(seed: number): AuthoritativeDungeonState {
  const defaults = initialTownState(seed);
  const heroes = Array.from({ length: 4 }, (_, index) => ({
    ...generateAuthoritativeNovice(`xp-simulation-${seed}-${index}`, `xp-hero-${index}`),
    isActive: true,
    status: "idle" as const,
  })) as unknown as Hero[];

  return {
    ...defaults,
    activeDungeonFloor: 1,
    activeDungeonRoom: 1,
    highestFloorReached: 1,
    buildings: { ...defaults.buildings, lair: 1 },
    heroes,
    storedItems: [],
    forgeMaterials: [],
    encounterHistory: [],
    pendingClassTransitions: [],
    autoExplore: true,
  };
}

function recordMilestones(result: CampaignResult, heroes: readonly Hero[], floor: number): void {
  for (const milestone of MILESTONES) {
    if (result.milestoneFloors[milestone] === undefined && heroes.every((hero) => hero.level >= milestone)) {
      result.milestoneFloors[milestone] = floor;
    }
  }
}

function runCampaign(profile: CurveProfile, mode: RecoveryMode, seed: number): CampaignResult {
  const rng = seededRng(seed);
  let state = initialCampaignState(seed);
  const result: CampaignResult = {
    profile: profile.id,
    mode,
    encounters: 0,
    defeats: 0,
    wipes: 0,
    transcriptEvents: 0,
    highestFloor: 1,
    completedTarget: false,
    finalLevels: [],
    milestoneFloors: {},
  };
  let stalledEncounters = 0;

  while (
    state.activeDungeonFloor <= TARGET_FLOOR
    && result.encounters < MAX_ENCOUNTERS
    && stalledEncounters < MAX_STALLED_ENCOUNTERS
  ) {
    if (mode === "isolated") state = recoverParty(state);
    if (!state.heroes?.some((hero) => hero.isActive && hero.currentHp > 0)) {
      result.wipes += 1;
      state = recoverParty(state);
    }

    const floor = state.activeDungeonFloor;
    const room = state.activeDungeonRoom;
    const resolution = resolveAuthoritativeDungeonEncounter(
      state,
      `xp-${profile.id}-${mode}-${seed}-${result.encounters}`,
      rng,
      { xpCurve: profile.curve },
    );
    state = {
      ...resolution.state,
      encounterHistory: [...(state.encounterHistory ?? []), resolution.encounter].slice(-15),
    };
    stalledEncounters = state.activeDungeonFloor === floor && state.activeDungeonRoom === room
      ? stalledEncounters + 1
      : 0;
    result.encounters += 1;
    result.transcriptEvents += resolution.encounter.transcript.length;
    if (resolution.encounter.outcome === "defeat") result.defeats += 1;
    result.highestFloor = Math.max(result.highestFloor, floor, state.highestFloorReached);
    recordMilestones(result, state.heroes ?? [], floor);
  }

  result.completedTarget = state.activeDungeonFloor > TARGET_FLOOR;
  if (!result.completedTarget && stalledEncounters >= MAX_STALLED_ENCOUNTERS) {
    result.blockedFloor = state.activeDungeonFloor;
  }
  result.finalLevels = (state.heroes ?? []).map((hero) => hero.level).sort((a, b) => a - b);
  return result;
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function formatMilestone(results: readonly CampaignResult[], milestone: Milestone): string {
  const floors = results.flatMap((result) => {
    const floor = result.milestoneFloors[milestone];
    return floor === undefined ? [] : [floor];
  });
  return floors.length === 0 ? "-" : `${median(floors)} (${floors.length}/${results.length})`;
}

function summarize(results: readonly CampaignResult[]) {
  return PROFILES.flatMap((profile) => MODES.map((mode) => {
    const group = results.filter((result) => result.profile === profile.id && result.mode === mode);
    const heroLevels = group.flatMap((result) => result.finalLevels);
    const visibleHours = group.map((result) => (
      (result.encounters * 1_000 + result.transcriptEvents * 400) / 3_600_000
    ));
    return {
      courbe: profile.label,
      mode,
      niveau_final_median: median(heroLevels),
      niveau_final_min_max: `${Math.min(...heroLevels)}-${Math.max(...heroLevels)}`,
      etage_max_median: median(group.map((result) => result.highestFloor)),
      campagnes_terminees: `${group.filter((result) => result.completedTarget).length}/${group.length}`,
      etage_blocage_median: median(group.flatMap((result) => (
        result.blockedFloor === undefined ? [] : [result.blockedFloor]
      ))) || "-",
      rencontres_median: median(group.map((result) => result.encounters)),
      defaites_median: median(group.map((result) => result.defeats)),
      wipes_median: median(group.map((result) => result.wipes)),
      heures_UI_estimees: Number(median(visibleHours).toFixed(1)),
      niveau_5: formatMilestone(group, 5),
      niveau_10: formatMilestone(group, 10),
      niveau_15: formatMilestone(group, 15),
      niveau_20: formatMilestone(group, 20),
      niveau_25: formatMilestone(group, 25),
      niveau_30: formatMilestone(group, 30),
    };
  }));
}

describe("hero XP progression simulation", () => {
  it("locks the deterministic T0/T1 candidate anchors", () => {
    expect(calculateXpNeeded(10, "Novice", HARMONIZED_HERO_XP_CURVE)).toBe(816);
    expect(calculateXpNeeded(11, "Guerrier", HARMONIZED_HERO_XP_CURVE)).toBe(1_061);
    expect(calculateXpNeeded(30, "Guerrier", HARMONIZED_HERO_XP_CURVE)).toBe(33_897);
    expect(calculateXpNeeded(35, "Guerrier", HARMONIZED_HERO_XP_CURVE)).toBe(84_347);
  });

  it("compares the historical global curves with the harmonized T0/T1 curve", () => {
    const results = PROFILES.flatMap((profile) => MODES.flatMap((mode) => (
      SEEDS.map((seed) => runCampaign(profile, mode, seed))
    )));

    console.table(summarize(results));

    expect(results).toHaveLength(PROFILES.length * MODES.length * SEEDS.length);
    expect(results.every((result) => result.encounters > 0)).toBe(true);
    expect(results.every((result) => result.encounters < MAX_ENCOUNTERS)).toBe(true);
    expect(results.every((result) => result.finalLevels.length === 4)).toBe(true);
    expect(results.filter((result) => result.profile === "fluid" || result.profile === "harmonized")
      .every((result) => result.completedTarget)).toBe(true);

    for (const mode of MODES) {
      const levels = (profile: ProfileId) => results
        .filter((result) => result.profile === profile && result.mode === mode)
        .flatMap((result) => result.finalLevels);

      expect(median(levels("moderate"))).toBeGreaterThan(median(levels("legacy")));
      expect(median(levels("fluid"))).toBeGreaterThanOrEqual(median(levels("moderate")));
      expect(median(levels("harmonized"))).toBeGreaterThanOrEqual(median(levels("fluid")));
    }
  }, 300_000);
});
