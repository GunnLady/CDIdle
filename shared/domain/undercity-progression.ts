import type {
  CanonicalDungeonProgress,
  CanonicalDungeonHeroProgress,
  CanonicalDungeonExpedition,
} from "../contracts/authoritative.ts";
import {
  UNDERCITY_DUNGEON_ID,
  UNDERCITY_MAX_FLOOR,
  UNDERCITY_ZONES,
  getUndercityCheckpoint,
  getUndercityFixedVictoryId,
} from "./undercity.ts";

export function createUndercityHeroProgress(completedFloor = 0): CanonicalDungeonHeroProgress {
  const completed = Math.max(0, Math.min(UNDERCITY_MAX_FLOOR, Math.floor(completedFloor)));
  const fixedVictoryIds = Array.from({ length: Math.floor(completed / 5) }, (_, index) => {
    const floor = (index + 1) * 5;
    return UNDERCITY_DUNGEON_ID + ":" + (floor % 10 === 0 ? "boss" : "elite") + ":" + String(floor).padStart(2, "0");
  });
  return { completedFloor: completed, fixedVictoryIds };
}

export function createUndercityProgress(heroIds: readonly string[] = [], completedFloor = 0): CanonicalDungeonProgress {
  return {
    dungeonId: UNDERCITY_DUNGEON_ID,
    heroes: Object.fromEntries(heroIds.map((heroId) => [heroId, createUndercityHeroProgress(completedFloor)])),
    expedition: {
      dungeonId: UNDERCITY_DUNGEON_ID,
      mode: "progression",
      zoneId: null,
      floor: Math.min(UNDERCITY_MAX_FLOOR, Math.max(1, completedFloor + 1)),
      room: 1,
      halted: false,
      haltReason: null,
      phase: "preparing",
      segmentHeroIds: [],
      knockedOutHeroIds: [],
      checkpointFloor: null,
      autoExploreBeforeCheckpoint: false,
    },
  };
}

export function ensureUndercityHeroes(progress: CanonicalDungeonProgress, heroIds: readonly string[]): CanonicalDungeonProgress {
  const heroes = { ...progress.heroes };
  for (const heroId of heroIds) heroes[heroId] ??= createUndercityHeroProgress();
  return { ...progress, heroes };
}

export function getUndercityCommonCheckpoint(progress: CanonicalDungeonProgress, heroIds: readonly string[]): number {
  return getUndercityCheckpoint(heroIds.map((heroId) => progress.heroes[heroId]?.completedFloor ?? 0));
}

export function canFarmUndercity(progress: CanonicalDungeonProgress, heroIds: readonly string[]): boolean {
  const ratKingId = UNDERCITY_DUNGEON_ID + ":boss:50";
  return heroIds.length > 0 && heroIds.every((heroId) => {
    const hero = progress.heroes[heroId];
    return hero?.completedFloor === UNDERCITY_MAX_FLOOR && hero.fixedVictoryIds.includes(ratKingId);
  });
}

export function isUndercityProgressionComplete(
  progress: CanonicalDungeonProgress,
  heroIds: readonly string[],
): boolean {
  return progress.expedition.mode === 'progression' && canFarmUndercity(progress, heroIds);
}

export function validateUndercityProgress(progress: CanonicalDungeonProgress): string[] {
  const errors: string[] = [];
  if (progress.dungeonId !== UNDERCITY_DUNGEON_ID) errors.push('dungeonProgress.dungeonId is unknown');
  if (progress.expedition.dungeonId !== UNDERCITY_DUNGEON_ID) errors.push('dungeonProgress.expedition.dungeonId is unknown');
  if (progress.expedition.mode === 'progression' && progress.expedition.zoneId !== null) {
    errors.push('dungeonProgress.expedition.zoneId must be null in progression mode');
  }
  if (progress.expedition.mode === 'farm') {
    const zone = UNDERCITY_ZONES.find((entry) => entry.id === progress.expedition.zoneId);
    if (!zone) errors.push('dungeonProgress.expedition.zoneId is unknown');
    else if (progress.expedition.floor < zone.floorMin || progress.expedition.floor > zone.floorMax) {
      errors.push('dungeonProgress.expedition.floor is outside the selected farm zone');
    }
  }
  if (progress.expedition.halted !== (progress.expedition.haltReason !== null)) {
    errors.push('dungeonProgress.expedition halt state is inconsistent');
  }
  if (!["preparing", "running", "checkpoint_decision"].includes(progress.expedition.phase)) {
    errors.push("dungeonProgress.expedition.phase is invalid");
  }
  if (typeof progress.expedition.autoExploreBeforeCheckpoint !== "boolean") {
    errors.push("dungeonProgress.expedition.autoExploreBeforeCheckpoint is invalid");
  }
  if (progress.expedition.checkpointFloor !== null
    && (!Number.isInteger(progress.expedition.checkpointFloor)
      || progress.expedition.checkpointFloor < 5
      || progress.expedition.checkpointFloor > UNDERCITY_MAX_FLOOR
      || progress.expedition.checkpointFloor % 5 !== 0)) {
    errors.push("dungeonProgress.expedition.checkpointFloor is invalid");
  }
  const heroIds = new Set(Object.keys(progress.heroes));
  const segmentIds = new Set(progress.expedition.segmentHeroIds);
  if (segmentIds.size !== progress.expedition.segmentHeroIds.length) {
    errors.push("dungeonProgress.expedition.segmentHeroIds contains duplicates");
  }
  if (progress.expedition.segmentHeroIds.length > 4) {
    errors.push("dungeonProgress.expedition.segmentHeroIds exceeds party capacity");
  }
  if (progress.expedition.segmentHeroIds.some((heroId) => !heroIds.has(heroId))) {
    errors.push("dungeonProgress.expedition.segmentHeroIds references an unknown hero");
  }
  if (new Set(progress.expedition.knockedOutHeroIds).size !== progress.expedition.knockedOutHeroIds.length
    || progress.expedition.knockedOutHeroIds.some((heroId) => !segmentIds.has(heroId))) {
    errors.push("dungeonProgress.expedition.knockedOutHeroIds is invalid");
  }
  if (progress.expedition.phase === "preparing"
    && (progress.expedition.segmentHeroIds.length > 0
      || progress.expedition.knockedOutHeroIds.length > 0
      || progress.expedition.checkpointFloor !== null)) {
    errors.push("dungeonProgress.expedition preparing state is inconsistent");
  }
  if (progress.expedition.phase === "running"
    && (progress.expedition.segmentHeroIds.length === 0
      || progress.expedition.checkpointFloor !== null)) {
    errors.push("dungeonProgress.expedition running state is inconsistent");
  }
  if (progress.expedition.phase === "checkpoint_decision"
    && (progress.expedition.mode !== "progression"
      || progress.expedition.segmentHeroIds.length === 0
      || progress.expedition.checkpointFloor === null)) {
    errors.push("dungeonProgress.expedition checkpoint state is inconsistent");
  }
  const fixedVictories = new Map(Array.from({ length: UNDERCITY_MAX_FLOOR / 5 }, (_, index) => {
    const floor = (index + 1) * 5;
    return [getUndercityFixedVictoryId(floor, 1, 1)!, floor] as const;
  }));
  for (const [heroId, heroProgress] of Object.entries(progress.heroes)) {
    for (const fixedVictoryId of heroProgress.fixedVictoryIds) {
      const floor = fixedVictories.get(fixedVictoryId);
      if (floor === undefined) errors.push(`dungeonProgress.heroes.${heroId}.fixedVictoryIds contains an unknown receipt`);
      else if (floor > heroProgress.completedFloor) errors.push(`dungeonProgress.heroes.${heroId}.fixedVictoryIds contains an unearned receipt`);
    }
  }
  return errors;
}

export function restartUndercityExpedition(
  progress: CanonicalDungeonProgress,
  heroIds: readonly string[],
): CanonicalDungeonProgress {
  const expedition: CanonicalDungeonExpedition = progress.expedition.mode === "farm"
    ? {
        ...progress.expedition,
        floor: UNDERCITY_ZONES.find((zone) => zone.id === progress.expedition.zoneId)?.floorMin ?? 1,
        room: 1,
        halted: false,
        haltReason: null,
        phase: "preparing",
        segmentHeroIds: [],
        knockedOutHeroIds: [],
        checkpointFloor: null,
        autoExploreBeforeCheckpoint: false,
      }
    : {
        ...progress.expedition,
        floor: Math.min(UNDERCITY_MAX_FLOOR, getUndercityCommonCheckpoint(progress, heroIds) + 1),
        room: 1,
        halted: false,
        haltReason: null,
        phase: "preparing",
        segmentHeroIds: [],
        knockedOutHeroIds: [],
        checkpointFloor: null,
        autoExploreBeforeCheckpoint: false,
      };
  return { ...progress, expedition };
}

export function haltUndercityExpedition(
  progress: CanonicalDungeonProgress,
  reason: "wipe" | "retreat",
): CanonicalDungeonProgress {
  return {
    ...progress,
    expedition: {
      ...progress.expedition,
      halted: true,
      haltReason: reason,
      phase: "preparing",
      segmentHeroIds: [],
      knockedOutHeroIds: [],
      checkpointFloor: null,
      autoExploreBeforeCheckpoint: false,
    },
  };
}

export function selectUndercityFarmZone(
  progress: CanonicalDungeonProgress,
  heroIds: readonly string[],
  zoneId: string,
): CanonicalDungeonProgress {
  if (!canFarmUndercity(progress, heroIds)) throw new Error("UNDERCITY_FARM_LOCKED");
  const zone = UNDERCITY_ZONES.find((entry) => entry.id === zoneId);
  if (!zone) throw new Error("UNDERCITY_ZONE_UNKNOWN");
  return {
    ...progress,
    expedition: {
      dungeonId: UNDERCITY_DUNGEON_ID,
      mode: "farm",
      zoneId,
      floor: zone.floorMin,
      room: 1,
      halted: false,
      haltReason: null,
      phase: "running",
      segmentHeroIds: [...heroIds],
      knockedOutHeroIds: [],
      checkpointFloor: null,
      autoExploreBeforeCheckpoint: false,
    },
  };
}


export const UNDERCITY_PERSONAL_REWARD_PARAMETERS = {
  eliteXpFactor: 0.5,
  bossXpFactor: 1,
  materialPerBand: 1,
} as const;

export function settleUndercityVictory(
  progress: CanonicalDungeonProgress,
  participantHeroIds: readonly string[],
  floor: number,
  room: number,
  roomCount: number,
): {
  progress: CanonicalDungeonProgress;
  fixedVictoryId: string | null;
  firstVictoryHeroIds: string[];
} {
  const prepared = ensureUndercityHeroes(progress, participantHeroIds);
  const heroes = structuredClone(prepared.heroes);
  const fixedVictoryId = getUndercityFixedVictoryId(floor, room, roomCount);
  const firstVictoryHeroIds: string[] = [];
  for (const heroId of participantHeroIds) {
    const hero = heroes[heroId];
    if (!hero) continue;
    if (room === roomCount && hero.completedFloor === floor - 1) hero.completedFloor = floor;
    if (fixedVictoryId && !hero.fixedVictoryIds.includes(fixedVictoryId)) {
      hero.fixedVictoryIds.push(fixedVictoryId);
      firstVictoryHeroIds.push(heroId);
    }
  }
  return {
    progress: { ...prepared, heroes },
    fixedVictoryId,
    firstVictoryHeroIds,
  };
}


export function synchronizeUndercityParty(
  progress: CanonicalDungeonProgress,
  heroIds: readonly string[],
): CanonicalDungeonProgress {
  const prepared = ensureUndercityHeroes(progress, heroIds);
  const route = prepared.expedition.mode === "farm" && !canFarmUndercity(prepared, heroIds)
    ? {
        ...prepared,
        expedition: { ...prepared.expedition, mode: "progression" as const, zoneId: null },
      }
    : prepared;
  const restarted = restartUndercityExpedition(route, heroIds);
  return prepared.expedition.halted
    ? { ...restarted, expedition: { ...restarted.expedition, halted: true, haltReason: prepared.expedition.haltReason } }
    : restarted;
}
