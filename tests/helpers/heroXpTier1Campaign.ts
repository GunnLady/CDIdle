import {
  resolveAuthoritativeDungeonEncounter,
  type AuthoritativeDungeonState,
} from "../../shared/domain/authoritative-dungeon";
import { applyClassTransition } from "../../shared/domain/class-transition";
import { CLASS_INFO_LIST } from "../../shared/data/game-data";
import { isMajorBossFloor } from "../../shared/domain/dungeon-progression";
import {
  type DungeonXpRewardSource,
} from "../../shared/domain/dungeon-xp-rewards";
import { refreshHeroProgressionThreshold } from "../../shared/domain/hero-xp";
import type { ClassType, DungeonEncounterType, Hero } from "../../src/types";
import {
  forkCanonicalRng,
  restoreCanonicalRng,
  type CanonicalRng,
} from "../../supabase/functions/game-api/authoritative-rng";
import { applyInventoryCommand } from "../../supabase/functions/game-api/inventory-authority";
import { applyIdleAuthority } from "../../supabase/functions/game-api/idle-authority";
import { generateAuthoritativeNovice } from "../../supabase/functions/game-api/novice-authority";
import { initialTownState } from "../../supabase/functions/game-api/town-authority";
import { HARMONIZED_T0_T1_XP_CURVE } from "../fixtures/xpProgression";

export const TARGET_LEVEL = 40;
export const MAX_EXPLORATIONS = 100_000;
const BOSS_ATTEMPTS_BEFORE_GRIND = 3;
export const SEED_COUNT = Math.max(1, Number.parseInt(process.env.XP_SEED_COUNT ?? "1", 10));
const SEED_OFFSET = Math.max(0, Number.parseInt(process.env.XP_SEED_OFFSET ?? "0", 10));
export const SEEDS = Array.from(
  { length: SEED_COUNT },
  (_, index) => 0x515050 + SEED_OFFSET + index,
);
export const MILESTONES = [10, 20, 30, 35, 40] as const;
export const CHALLENGE_LEVEL_BANDS = ["1-9", "10-19", "20-29", "30-34", "35-40"] as const;
export type ChallengeLevelBand = (typeof CHALLENGE_LEVEL_BANDS)[number];
export type ChallengeBandResult = { attempts: number; successes: number; zeroChance: number };
export type ChallengeCalibrationResult = ChallengeBandResult & {
  partyLevelSum: number;
  difficultySum: number;
  probabilitySum: number;
};
export type XpLevelResult = { xp: number; exposures: number };
export const CHALLENGE_KINDS = ["trap", "enigma", "ambush", "ritual", "obstacle", "negotiation"] as const;
export type ChallengeKind = (typeof CHALLENGE_KINDS)[number];

export type RewardProfile = { id: "canonical"; label: string };
export const CANONICAL_PROFILE: RewardProfile = { id: "canonical", label: "Canonique" };
export const ACTIVE_REWARD_PROFILES = [CANONICAL_PROFILE] as const;

export type LongCampaignReport = {
  profile: RewardProfile["id"];
  seed: number;
  explorations: number;
  fights: number;
  nonCombat: number;
  elites: number;
  majorBosses: number;
  firstClears: number;
  defeats: number;
  wipes: number;
  grindRuns: number;
  recoveryWaitSeconds: number;
  simulatedSeconds: number;
  highestFloor: number;
  transcriptEvents: number;
  itemLoots: number;
  equipmentChanges: number;
  vocationChoices: number;
  finalLevels: number[];
  finalClasses: ClassType[];
  milestoneExplorations: Partial<Record<(typeof MILESTONES)[number], number>>;
  kinds: Record<DungeonEncounterType, number>;
  xpBySource: Record<DungeonXpRewardSource, number>;
  xpByHero: Record<string, number>;
  challengeAttempts: number;
  challengeSuccesses: number;
  challengeZeroChance: number;
  challengeProbabilitySum: number;
  challengeByLevelBand: Record<ChallengeLevelBand, ChallengeBandResult>;
  challengeByKindAndLevelBand: Record<ChallengeKind, Record<ChallengeLevelBand, ChallengeBandResult>>;
  challengeByFloorAndKind: Record<string, ChallengeCalibrationResult>;
  challengeCandidateHistogram: Record<string, number>;
  xpByHeroLevel: Record<number, XpLevelResult>;
  blockedReason?: string;
};

function challengeLevelBand(level: number): ChallengeLevelBand {
  if (level < 10) return "1-9";
  if (level < 20) return "10-19";
  if (level < 30) return "20-29";
  if (level < 35) return "30-34";
  return "35-40";
}

function initialState(seed: number): AuthoritativeDungeonState {
  const defaults = initialTownState(seed);
  const tierOneBuildings = Object.fromEntries(CLASS_INFO_LIST.flatMap((classInfo) => (
    classInfo.tier === 1 && classInfo.jobChangeBuildingId
      ? [[classInfo.jobChangeBuildingId, 1]]
      : []
  )));
  const heroes = Array.from({ length: 4 }, (_, index) => ({
    ...generateAuthoritativeNovice(`xp-level-40-${seed}-${index}`, `xp-level-40-hero-${index}`),
    isActive: true,
    status: "idle" as const,
  })) as unknown as Hero[];
  return {
    ...defaults,
    activeDungeonFloor: 1,
    activeDungeonRoom: 1,
    highestFloorReached: 1,
    buildings: { ...defaults.buildings, ...tierOneBuildings },
    heroes,
    storedItems: [],
    forgeMaterials: [],
    encounterHistory: [],
    pendingClassTransitions: [],
    autoExplore: true,
  };
}

function allHeroesReached(state: AuthoritativeDungeonState, level: number): boolean {
  return (state.heroes?.length ?? 0) === 4
    && state.heroes!.every((hero) => hero.level >= level);
}

function selectPreviousFloor(state: AuthoritativeDungeonState): AuthoritativeDungeonState {
  return {
    ...state,
    activeDungeonFloor: Math.max(1, state.activeDungeonFloor - 1),
    activeDungeonRoom: 1,
    autoExplore: true,
  };
}

function reactivateRecoveredHeroes(state: AuthoritativeDungeonState): AuthoritativeDungeonState {
  let activeCount = (state.heroes ?? []).filter((hero) => hero.isActive).length;
  const heroes = (state.heroes ?? []).map((hero) => {
    if (hero.isActive || hero.status !== "idle" || hero.currentHp <= 0 || activeCount >= 4) return hero;
    activeCount += 1;
    return { ...hero, isActive: true, status: "idle" as const };
  });
  return {
    ...state,
    heroes,
    autoExplore: heroes.some((hero) => hero.isActive && hero.currentHp > 0),
  };
}

function secondsUntilPartyRecovered(state: AuthoritativeDungeonState): number {
  return Math.max(0, ...(state.heroes ?? []).map((hero) => {
    if (hero.status !== "resting") return 0;
    const hpSeconds = hero.currentHp >= hero.calculatedStats.maxHp
      ? 0
      : (hero.calculatedStats.maxHp - hero.currentHp) / (hero.calculatedStats.maxHp * 0.02);
    const manaSeconds = hero.currentMana >= hero.calculatedStats.maxMana
      ? 0
      : (hero.calculatedStats.maxMana - hero.currentMana) / (hero.calculatedStats.maxMana * 0.02);
    return Math.ceil(Math.max(hpSeconds, manaSeconds));
  }));
}

function applySimulatedIdle(
  state: AuthoritativeDungeonState,
  clock: { nowMs: number; lastProcessedAt: string },
  elapsedMs: number,
): AuthoritativeDungeonState {
  clock.nowMs += elapsedMs;
  const idle = applyIdleAuthority(state, clock.lastProcessedAt, new Date(clock.nowMs));
  clock.lastProcessedAt = idle.lastProcessedAt;
  return idle.state as AuthoritativeDungeonState;
}

function choosePendingVocations(
  source: AuthoritativeDungeonState,
  masterRng: CanonicalRng,
): { state: AuthoritativeDungeonState; choices: number } {
  let state = source;
  let choices = 0;
  const rolePriority: ClassType[] = ["Acolyte", "Guerrier", "Mage", "Voleur", "Aède", "Druide", "Archer", "Pugiliste", "Artificier"];

  for (const pending of [...(state.pendingClassTransitions ?? [])]) {
    const heroIndex = (state.heroes ?? []).findIndex((hero) => hero.id === pending.heroId);
    if (heroIndex < 0) continue;
    const existingClasses = new Set((state.heroes ?? [])
      .filter((hero) => hero.id !== pending.heroId && hero.classType !== "Novice")
      .map((hero) => hero.classType));
    const candidate = [...pending.candidates].sort((left, right) => {
      const leftMissing = existingClasses.has(left.classType) ? 1 : 0;
      const rightMissing = existingClasses.has(right.classType) ? 1 : 0;
      return leftMissing - rightMissing
        || rolePriority.indexOf(left.classType as ClassType) - rolePriority.indexOf(right.classType as ClassType)
        || right.affinity - left.affinity;
    })[0];
    if (!candidate) continue;
    const hero = state.heroes![heroIndex] as Hero;
    const applied = applyClassTransition(
      hero,
      {
        fromClass: pending.fromClass,
        toClass: candidate.classType as ClassType,
        fromTier: pending.fromTier,
        toTier: pending.toTier,
        reason: pending.reason,
      },
      forkCanonicalRng(masterRng),
      state.storedItems ?? [],
    );
    const heroes = [...state.heroes!];
    heroes[heroIndex] = refreshHeroProgressionThreshold(applied.hero, HARMONIZED_T0_T1_XP_CURVE);
    state = {
      ...state,
      heroes,
      storedItems: applied.storedItems,
      pendingClassTransitions: (state.pendingClassTransitions ?? [])
        .filter((entry) => entry.heroId !== pending.heroId),
    };
    choices += 1;
  }
  return { state, choices };
}

function combatEquipmentScore(hero: Hero): number {
  const stats = hero.calculatedStats;
  const resistances = Object.values(stats.resistances).reduce((sum, value) => sum + value, 0);
  return stats.estimatedDps * 12
    + stats.maxHp * 1.5
    + stats.physicalDefense * 6
    + stats.magicDefense * 4
    + stats.speed * 2
    + stats.criticalChance * 3
    + stats.dodgeChance * 3
    + stats.maxMana * 0.25
    + resistances;
}

function optimizeEquipment(
  source: AuthoritativeDungeonState,
  candidateInstanceIds: readonly string[],
): { state: AuthoritativeDungeonState; changes: number } {
  let state = source;
  let changes = 0;
  const queue = [...new Set(candidateInstanceIds)];
  let attempts = 0;

  while (queue.length > 0 && attempts < 1_000) {
    attempts += 1;
    const instanceId = queue.shift()!;
    if (!state.storedItems?.some((item) => item.instanceId === instanceId)) continue;
    let best: { state: AuthoritativeDungeonState; gain: number } | null = null;

    for (const hero of state.heroes ?? []) {
      try {
        const transition = applyInventoryCommand(state, {
          type: "hero.equip",
          heroId: hero.id,
          instanceId,
        });
        const nextState = transition.state as AuthoritativeDungeonState;
        const equippedHero = nextState.heroes?.find((entry) => entry.id === hero.id);
        if (!equippedHero) continue;
        const gain = combatEquipmentScore(equippedHero as Hero) - combatEquipmentScore(hero as Hero);
        if (gain > 0.01 && (!best || gain > best.gain)) {
          best = { state: nextState, gain };
        }
      } catch {
        // The authoritative command rejects level, slot and handedness conflicts.
      }
    }

    if (!best) continue;
    const storedBefore = new Set((state.storedItems ?? []).map((item) => item.instanceId));
    state = best.state;
    changes += 1;
    for (const stored of state.storedItems ?? []) {
      if (!storedBefore.has(stored.instanceId)) queue.push(stored.instanceId);
    }
  }

  return { state, changes };
}

function rewardSource(
  encounter: ReturnType<typeof resolveAuthoritativeDungeonEncounter>["encounter"],
  eventType: string,
): DungeonXpRewardSource {
  if (eventType === "reward.floor_first_clear_xp") return "floor_first_clear";
  if (encounter.kind === "fight") {
    if (!encounter.enemy?.isBoss) return "regular_combat";
    return isMajorBossFloor(encounter.floor) ? "major_boss" : "elite";
  }
  if (encounter.kind === "treasure" || encounter.kind === "rest") return encounter.kind;
  return "challenge";
}

export function runLevel40Campaign(profile: RewardProfile, seed: number): LongCampaignReport {
  let state = initialState(seed);
  const masterRng = restoreCanonicalRng(state.rngState);
  const clock = { nowMs: Date.UTC(2026, 0, 1), lastProcessedAt: new Date(Date.UTC(2026, 0, 1)).toISOString() };
  let stalledBossAttempts = 0;
  const report: LongCampaignReport = {
    profile: profile.id,
    seed,
    explorations: 0,
    fights: 0,
    nonCombat: 0,
    elites: 0,
    majorBosses: 0,
    firstClears: 0,
    defeats: 0,
    wipes: 0,
    grindRuns: 0,
    recoveryWaitSeconds: 0,
    simulatedSeconds: 0,
    highestFloor: 1,
    transcriptEvents: 0,
    itemLoots: 0,
    equipmentChanges: 0,
    vocationChoices: 0,
    finalLevels: [],
    finalClasses: [],
    milestoneExplorations: {},
    kinds: {
      fight: 0,
      trap: 0,
      enigma: 0,
      ambush: 0,
      ritual: 0,
      obstacle: 0,
      negotiation: 0,
      treasure: 0,
      rest: 0,
    },
    xpBySource: {
      regular_combat: 0,
      elite: 0,
      major_boss: 0,
      floor_first_clear: 0,
      treasure: 0,
      rest: 0,
      challenge: 0,
    },
    xpByHero: {},
    challengeAttempts: 0,
    challengeSuccesses: 0,
    challengeZeroChance: 0,
    challengeProbabilitySum: 0,
    challengeByLevelBand: Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => (
      [band, { attempts: 0, successes: 0, zeroChance: 0 }]
    ))) as Record<ChallengeLevelBand, ChallengeBandResult>,
    challengeByKindAndLevelBand: Object.fromEntries(CHALLENGE_KINDS.map((kind) => (
      [kind, Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => (
        [band, { attempts: 0, successes: 0, zeroChance: 0 }]
      )))]
    ))) as Record<ChallengeKind, Record<ChallengeLevelBand, ChallengeBandResult>>,
    challengeByFloorAndKind: {},
    challengeCandidateHistogram: {},
    xpByHeroLevel: Object.fromEntries(Array.from({ length: TARGET_LEVEL - 1 }, (_, index) => (
      [index + 1, { xp: 0, exposures: 0 }]
    ))) as Record<number, XpLevelResult>,
  };

  while (!allHeroesReached(state, TARGET_LEVEL) && report.explorations < MAX_EXPLORATIONS) {
    if (!state.heroes?.some((hero) => hero.isActive && hero.currentHp > 0)) {
      const recoverySeconds = secondsUntilPartyRecovered(state);
      state = applySimulatedIdle(state, clock, recoverySeconds * 1_000);
      report.recoveryWaitSeconds += recoverySeconds;
      report.simulatedSeconds += recoverySeconds;
      state = reactivateRecoveredHeroes(state);
    }

    const floor = state.activeDungeonFloor;
    const room = state.activeDungeonRoom;
    const partyLevelBefore = Math.min(...(state.heroes ?? []).map((hero) => hero.level));
    const heroLevelsBefore = new Map((state.heroes ?? []).map((hero) => [hero.id, hero.level]));
    for (const hero of state.heroes ?? []) {
      if (hero.level < TARGET_LEVEL) report.xpByHeroLevel[hero.level]!.exposures += 1;
    }
    let resolution: ReturnType<typeof resolveAuthoritativeDungeonEncounter>;
    try {
      resolution = resolveAuthoritativeDungeonEncounter(
        state,
        `xp-level-40-${profile.id}-${seed}-${report.explorations}`,
        forkCanonicalRng(masterRng),
        {
          xpCurve: HARMONIZED_T0_T1_XP_CURVE,
        },
      );
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "COMBAT_LIMIT_REACHED") throw error;
      report.blockedReason = error.message;
      break;
    }
    const encounter = resolution.encounter;
    const partyWiped = !(resolution.state.heroes ?? [])
      .some((hero) => hero.isActive && hero.currentHp > 0);
    if (partyWiped) report.wipes += 1;
    state = {
      ...resolution.state,
      rngState: masterRng.snapshot(),
      encounterHistory: [...(state.encounterHistory ?? []), encounter].slice(-15),
    };
    const encounterElapsedMs = (encounter.transcript.length + 1) * 400 + 1_000;
    state = applySimulatedIdle(state, clock, encounterElapsedMs);
    report.simulatedSeconds += encounterElapsedMs / 1_000;
    state = reactivateRecoveredHeroes(state);
    const vocation = choosePendingVocations(state, masterRng);
    state = vocation.state;
    state.rngState = masterRng.snapshot();
    report.vocationChoices += vocation.choices;
    const itemLootIds = encounter.rewards.loot.flatMap((loot) => (
      loot.type === "item" && loot.instanceId ? [loot.instanceId] : []
    ));
    report.itemLoots += itemLootIds.length;
    const progressionChanged = encounter.transcript.some((event) => (
      event.type === "hero.level_up" || event.type === "hero.class_changed"
    ));
    const equipmentCandidates = progressionChanged
      ? (state.storedItems ?? []).map((item) => item.instanceId)
      : itemLootIds;
    if (equipmentCandidates.length > 0) {
      const optimized = optimizeEquipment(state, equipmentCandidates);
      state = optimized.state;
      report.equipmentChanges += optimized.changes;
    }
    report.explorations += 1;
    report.kinds[encounter.kind] += 1;
    report.transcriptEvents += encounter.transcript.length;
    const challengeAttempt = encounter.transcript.find((event) => event.type === "challenge.attempted");
    if (challengeAttempt) {
      const probability = typeof challengeAttempt.successProbability === "number"
        ? challengeAttempt.successProbability
        : 0;
      report.challengeAttempts += 1;
      report.challengeProbabilitySum += probability;
      if (probability === 0) report.challengeZeroChance += 1;
      const bandResult = report.challengeByLevelBand[challengeLevelBand(partyLevelBefore)];
      const kindResult = report.challengeByKindAndLevelBand[encounter.kind as ChallengeKind][
        challengeLevelBand(partyLevelBefore)
      ];
      const calibrationKey = `${floor}:${encounter.kind}`;
      const calibrationResult = report.challengeByFloorAndKind[calibrationKey] ??= {
        attempts: 0,
        successes: 0,
        zeroChance: 0,
        partyLevelSum: 0,
        difficultySum: 0,
        probabilitySum: 0,
      };
      bandResult.attempts += 1;
      kindResult.attempts += 1;
      calibrationResult.attempts += 1;
      calibrationResult.partyLevelSum += partyLevelBefore;
      calibrationResult.difficultySum += typeof challengeAttempt.difficulty === "number"
        ? challengeAttempt.difficulty
        : 0;
      calibrationResult.probabilitySum += probability;
      const score = typeof challengeAttempt.score === "number" ? challengeAttempt.score : 0;
      const luck = typeof challengeAttempt.luck === "number" ? challengeAttempt.luck : 1;
      const histogramKey = `${floor}:${encounter.kind}:${score}:${luck}`;
      report.challengeCandidateHistogram[histogramKey] = (
        report.challengeCandidateHistogram[histogramKey] ?? 0
      ) + 1;
      if (probability === 0) bandResult.zeroChance += 1;
      if (probability === 0) kindResult.zeroChance += 1;
      if (probability === 0) calibrationResult.zeroChance += 1;
      if (encounter.transcript.some((event) => event.type === "challenge.succeeded")) {
        report.challengeSuccesses += 1;
        bandResult.successes += 1;
        kindResult.successes += 1;
        calibrationResult.successes += 1;
      }
    }
    for (const event of encounter.transcript) {
      if (event.type !== "reward.xp" && event.type !== "reward.floor_first_clear_xp") continue;
      if (typeof event.xp !== "number" || typeof event.heroId !== "string") continue;
      const source = rewardSource(encounter, event.type);
      if (event.source !== source) throw new Error("XP_SOURCE_MISMATCH:" + event.source + ":" + source);
      report.xpBySource[source] += event.xp;
      report.xpByHero[event.heroId] = (report.xpByHero[event.heroId] ?? 0) + event.xp;
      const heroLevel = heroLevelsBefore.get(event.heroId);
      if (heroLevel !== undefined && heroLevel < TARGET_LEVEL) {
        report.xpByHeroLevel[heroLevel]!.xp += event.xp;
      }
    }
    report.highestFloor = Math.max(report.highestFloor, floor, state.highestFloorReached);
    if (encounter.kind === "fight") report.fights += 1;
    else report.nonCombat += 1;
    if (encounter.enemy?.isBoss) {
      if (isMajorBossFloor(floor)) report.majorBosses += 1;
      else report.elites += 1;
    }
    if (encounter.transcript.some((event) => event.type === "dungeon.floor_completed")) {
      report.firstClears += 1;
    }
    if (encounter.outcome === "defeat") report.defeats += 1;

    const stalled = state.activeDungeonFloor === floor && state.activeDungeonRoom === room;
    stalledBossAttempts = stalled && encounter.kind === "fight"
      ? stalledBossAttempts + 1
      : 0;
    if (stalledBossAttempts >= BOSS_ATTEMPTS_BEFORE_GRIND && floor > 1) {
      state = reactivateRecoveredHeroes(selectPreviousFloor(state));
      stalledBossAttempts = 0;
      report.grindRuns += 1;
    }

    for (const milestone of MILESTONES) {
      if (report.milestoneExplorations[milestone] === undefined && allHeroesReached(state, milestone)) {
        report.milestoneExplorations[milestone] = report.explorations;
        if (SEED_COUNT <= 3) {
          console.info(
            `[XPT1] niveau ${milestone} atteint après ${report.explorations} explorations, étage ${floor}.`,
          );
        }
      }
    }
    if (report.explorations % 25_000 === 0) {
      console.info(
        `[XPT1] ${report.explorations} explorations, niveaux ${state.heroes?.map((hero) => hero.level).join("/")}, étage max ${report.highestFloor}.`,
      );
    }
  }

  report.finalLevels = (state.heroes ?? []).map((hero) => hero.level);
  report.finalClasses = (state.heroes ?? []).map((hero) => hero.classType);
  return report;
}
