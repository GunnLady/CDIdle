import { describe, expect, it } from "vitest";
import {
  resolveAuthoritativeDungeonEncounter,
  type AuthoritativeDungeonState,
} from "../shared/domain/authoritative-dungeon";
import { applyClassTransition } from "../shared/domain/class-transition";
import { CLASS_INFO_LIST } from "../shared/data/game-data";
import { isMajorBossFloor } from "../shared/domain/dungeon-progression";
import { refreshHeroProgressionThreshold } from "../shared/domain/hero-xp";
import type { ClassType, DungeonEncounterType, Hero } from "../src/types";
import {
  forkCanonicalRng,
  restoreCanonicalRng,
  type CanonicalRng,
} from "../supabase/functions/game-api/authoritative-rng";
import { applyInventoryCommand } from "../supabase/functions/game-api/inventory-authority";
import { applyIdleAuthority } from "../supabase/functions/game-api/idle-authority";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { HARMONIZED_T0_T1_XP_CURVE } from "./fixtures/xpProgression";

const TARGET_LEVEL = 35;
const MAX_EXPLORATIONS = 100_000;
const BOSS_ATTEMPTS_BEFORE_GRIND = 3;
const SEED = 0x515050;
const MILESTONES = [10, 20, 30, 35] as const;

type LongCampaignReport = {
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
};

function initialState(): AuthoritativeDungeonState {
  const defaults = initialTownState(SEED);
  const tierOneBuildings = Object.fromEntries(CLASS_INFO_LIST.flatMap((classInfo) => (
    classInfo.tier === 1 && classInfo.jobChangeBuildingId
      ? [[classInfo.jobChangeBuildingId, 1]]
      : []
  )));
  const heroes = Array.from({ length: 4 }, (_, index) => ({
    ...generateAuthoritativeNovice(`xp-level-50-${SEED}-${index}`, `xp-level-50-hero-${index}`),
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

function runLevel50Campaign(): LongCampaignReport {
  let state = initialState();
  const masterRng = restoreCanonicalRng(state.rngState);
  const clock = { nowMs: Date.UTC(2026, 0, 1), lastProcessedAt: new Date(Date.UTC(2026, 0, 1)).toISOString() };
  let stalledBossAttempts = 0;
  const report: LongCampaignReport = {
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
    const resolution = resolveAuthoritativeDungeonEncounter(
      state,
      `xp-level-50-${report.explorations}`,
      forkCanonicalRng(masterRng),
      { xpCurve: HARMONIZED_T0_T1_XP_CURVE },
    );
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
        console.info(
          `[XPT1] niveau ${milestone} atteint après ${report.explorations} explorations, étage ${floor}.`,
        );
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

describe("complete Tier 1 XP campaign", () => {
  it("runs one full authoritative party until every hero reaches the Tier 1 target", () => {
    const report = runLevel50Campaign();
    console.table([{
      explorations: report.explorations,
      niveaux: report.finalLevels.join("/"),
      classes: report.finalClasses.join("/"),
      etage_max: report.highestFloor,
      combats: report.fights,
      non_combat: report.nonCombat,
      elites: report.elites,
      boss_majeurs: report.majorBosses,
      premiers_clears: report.firstClears,
      defaites: report.defeats,
      wipes: report.wipes,
      retours_farm: report.grindRuns,
      attente_recuperation_heures: Number((report.recoveryWaitSeconds / 3_600).toFixed(1)),
      temps_visible_heures: Number((report.simulatedSeconds / 3_600).toFixed(1)),
      evenements: report.transcriptEvents,
      objets_lootes: report.itemLoots,
      changements_equipement: report.equipmentChanges,
      choix_vocation: report.vocationChoices,
      niveau_10: report.milestoneExplorations[10],
      niveau_20: report.milestoneExplorations[20],
      niveau_30: report.milestoneExplorations[30],
      niveau_35: report.milestoneExplorations[35],
    }]);
    console.table(report.kinds);

    expect(report.explorations).toBeLessThan(MAX_EXPLORATIONS);
    expect(report.finalLevels.every((level) => level >= TARGET_LEVEL)).toBe(true);
    expect(report.fights).toBeGreaterThan(0);
    expect(report.nonCombat).toBeGreaterThan(0);
    expect(report.elites).toBeGreaterThan(0);
    expect(report.majorBosses).toBeGreaterThan(0);
    expect(report.firstClears).toBeGreaterThan(0);
    expect(report.itemLoots).toBeGreaterThan(0);
    expect(report.equipmentChanges).toBeGreaterThan(0);
  }, 1_800_000);
});
