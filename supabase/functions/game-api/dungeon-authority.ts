import {
  resolveAuthoritativeDungeonEncounter,
  type AuthoritativeDungeonEncounter,
  type AuthoritativeDungeonState,
} from "../../../shared/domain/authoritative-dungeon.ts";
import type {
  CanonicalHero as Hero,
  CanonicalGameState,
  CanonicalStateTransition,
} from "../../../shared/contracts/authoritative.ts";
import { getDungeonRoomCount, isDungeonFinalRoom } from "../../../shared/domain/dungeon-progression.ts";
import {
  ensureUndercityHeroes,
  haltUndercityExpedition,
  isUndercityProgressionComplete,
  restartUndercityExpedition,
  selectUndercityFarmZone,
} from "../../../shared/domain/undercity-progression.ts";
import {
  UNDERCITY_DUNGEON_ID,
  UNDERCITY_MAX_FLOOR,
  UNDERCITY_ZONES,
} from "../../../shared/domain/undercity.ts";

export type DungeonHero = Hero;
export type DungeonState = CanonicalGameState;
export type DungeonCommand =
  | { type: "dungeon.explore"; dungeonId?: string; floor: number; commandId?: string }
  | { type: "dungeon.select_floor"; dungeonId?: string; floor: number; commandId?: string }
  | { type: "dungeon.resolve"; dungeonId?: string; commandId?: string }
  | { type: "dungeon.auto_explore"; dungeonId?: string; enabled: boolean; commandId?: string }
  | { type: "dungeon.retreat"; dungeonId?: string; commandId?: string }
  | { type: "dungeon.resume"; dungeonId: string; commandId?: string }
  | { type: "dungeon.select_farm_zone"; dungeonId: string; zoneId: string; commandId?: string };

export class DungeonCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}
export type ResolvedDungeonEncounter = AuthoritativeDungeonEncounter;
export type DungeonRng = { next(): number; nextInt(maxExclusive: number): number };

const clone = <T>(value: T): T => structuredClone(value);
const activeHeroes = (heroes: DungeonHero[]) => heroes.filter((hero) => hero.isActive === true && Number(hero.currentHp ?? 0) > 0);
const activeHeroIds = (state: DungeonState) => activeHeroes(state.heroes ?? []).map((hero) => hero.id);

function requireUndercity(command: DungeonCommand) {
  if ((command.dungeonId ?? UNDERCITY_DUNGEON_ID) !== UNDERCITY_DUNGEON_ID) {
    throw new DungeonCommandError("DUNGEON_NOT_FOUND", "unknown dungeon");
  }
}

function withProgress(state: DungeonState) {
  const ids = activeHeroIds(state);
  const dungeonProgress = ensureUndercityHeroes(state.dungeonProgress, state.heroes.map((hero) => hero.id));
  return { state: { ...state, dungeonProgress }, ids };
}

function projectExpedition(state: DungeonState, autoExplore = state.autoExplore) {
  const expedition = state.dungeonProgress.expedition;
  return {
    ...state,
    activeDungeonFloor: expedition.floor,
    activeDungeonRoom: expedition.room,
    autoExplore,
  };
}

function progress(state: DungeonState): { floor: number; room: number; highest: number } {
  const expedition = state.dungeonProgress.expedition;
  const floor = Number(expedition.floor);
  const persistedRoom = Number(expedition.room);
  const highest = Number(state.highestFloorReached ?? floor);
  if (!Number.isInteger(floor) || floor < 1 || floor > UNDERCITY_MAX_FLOOR
    || !Number.isInteger(persistedRoom) || persistedRoom < 1 || persistedRoom > 50
    || !Number.isInteger(highest) || highest < 1) {
    throw new DungeonCommandError("INVALID_DUNGEON_STATE", "dungeon progression is invalid");
  }
  const room = state.currentEncounter ? persistedRoom : Math.min(persistedRoom, getDungeonRoomCount(floor));
  state.dungeonProgress.expedition.room = room;
  state.activeDungeonFloor = floor;
  state.activeDungeonRoom = room;
  return { floor, room, highest };
}

function stoppedAtRestart(state: DungeonState, reason: "wipe" | "retreat", heroIds: readonly string[]) {
  const ids = [...heroIds];
  const restarted = restartUndercityExpedition(state.dungeonProgress, ids);
  return projectExpedition({
    ...state,
    dungeonProgress: haltUndercityExpedition(restarted, reason),
  }, false);
}

function resolveEncounter(state: DungeonState, rng: DungeonRng) {
  const encounterId = String(state.currentEncounter?.encounterId ?? "encounter-unknown");
  const participantHeroIds = [...(state.currentEncounter?.participantHeroIds ?? activeHeroIds(state))];
  let resolved;
  try {
    resolved = resolveAuthoritativeDungeonEncounter(state as unknown as AuthoritativeDungeonState, encounterId, rng);
  } catch (error) {
    if (error instanceof DungeonCommandError) throw error;
    const code = error instanceof Error ? error.message : "DUNGEON_RESOLUTION_FAILED";
    if (code === "NO_ACTIVE_HERO") throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");
    if (code === "COMBAT_LIMIT_REACHED") throw new DungeonCommandError("COMBAT_LIMIT_REACHED", "combat action limit reached");
    if (code === "INVALID_GAME_STATE") throw new DungeonCommandError("INVALID_GAME_STATE", "canonical hero state is invalid");
    throw error;
  }
  const encounter = { ...resolved.encounter, dungeonId: UNDERCITY_DUNGEON_ID };
  const encounterHistory = [...(state.encounterHistory ?? []), encounter].slice(-15);
  let next = {
    ...resolved.state,
    currentEncounter: null,
    encounterHistory,
  } as unknown as DungeonState;
  next.dungeonProgress = ensureUndercityHeroes(next.dungeonProgress, next.heroes.map((hero) => hero.id));
  if (encounter.kind === "fight" && encounter.outcome === "defeat") {
    next = stoppedAtRestart(next, "wipe", participantHeroIds);
  } else {
    const expedition = { ...next.dungeonProgress.expedition };
    if (expedition.mode === "farm") {
      const zone = UNDERCITY_ZONES.find((entry) => entry.id === expedition.zoneId);
      if (!zone) throw new DungeonCommandError("INVALID_DUNGEON_STATE", "farm zone is invalid");
      if (encounter.floor === zone.floorMax && isDungeonFinalRoom(encounter.floor, encounter.room)) {
        expedition.floor = zone.floorMin;
        expedition.room = 1;
      } else {
        expedition.floor = Math.min(zone.floorMax, Number(next.activeDungeonFloor));
        expedition.room = Number(next.activeDungeonRoom);
      }
    } else {
      expedition.floor = Math.min(UNDERCITY_MAX_FLOOR, Number(next.activeDungeonFloor));
      expedition.room = Number(next.activeDungeonFloor) > UNDERCITY_MAX_FLOOR ? 1 : Number(next.activeDungeonRoom);
    }
    next = projectExpedition({ ...next, dungeonProgress: { ...next.dungeonProgress, expedition } }, next.autoExplore);
  }
  return { state: next, events: [{ type: "dungeon.encounter_resolved", dungeonId: UNDERCITY_DUNGEON_ID, encounter }] };
}

export function applyDungeonCommand(current: CanonicalGameState, command: Record<string, unknown>, rng?: DungeonRng): CanonicalStateTransition {
  const prepared = withProgress(clone(current));
  let state = prepared.state;
  const typed = command as DungeonCommand;
  requireUndercity(typed);
  const { floor, room, highest } = progress(state);
  const progressionComplete = isUndercityProgressionComplete(state.dungeonProgress, prepared.ids);

  if (typed.type === "dungeon.resume") {
    if (state.currentEncounter) throw new DungeonCommandError("ENCOUNTER_ACTIVE", "an encounter is already active");
    if (prepared.ids.length === 0) throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");
    if (!state.dungeonProgress.expedition.halted) {
      throw new DungeonCommandError("EXPEDITION_NOT_HALTED", "the expedition is not halted");
    }
    const dungeonProgress = restartUndercityExpedition(state.dungeonProgress, prepared.ids);
    return {
      state: projectExpedition({ ...state, dungeonProgress }, false),
      events: [{ type: "dungeon.resumed", dungeonId: UNDERCITY_DUNGEON_ID, floor: dungeonProgress.expedition.floor }],
    };
  }

  if (typed.type === "dungeon.select_farm_zone") {
    if (state.currentEncounter) throw new DungeonCommandError("ENCOUNTER_ACTIVE", "an encounter is already active");
    let dungeonProgress;
    try {
      dungeonProgress = selectUndercityFarmZone(state.dungeonProgress, prepared.ids, typed.zoneId);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "UNDERCITY_FARM_LOCKED") throw new DungeonCommandError("FARM_LOCKED", "farm mode is not unlocked for the active party");
      if (code === "UNDERCITY_ZONE_UNKNOWN") throw new DungeonCommandError("ZONE_NOT_FOUND", "farm zone was not found");
      throw error;
    }
    return {
      state: projectExpedition({ ...state, dungeonProgress }, true),
      events: [{ type: "dungeon.farm_zone_selected", dungeonId: UNDERCITY_DUNGEON_ID, zoneId: typed.zoneId }],
    };
  }

  if (typed.type === "dungeon.auto_explore") {
    if (typed.enabled && progressionComplete) throw new DungeonCommandError("DUNGEON_COMPLETED", "select a farm zone to continue");
    if (typed.enabled && prepared.ids.length === 0) throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");
    if (typed.enabled && state.dungeonProgress.expedition.halted) throw new DungeonCommandError("EXPEDITION_HALTED", "resume the expedition first");
    return { state: { ...state, autoExplore: typed.enabled }, events: [{ type: "dungeon.auto_explore_changed", dungeonId: UNDERCITY_DUNGEON_ID, enabled: typed.enabled }] };
  }

  if (typed.type === "dungeon.select_floor") {
    if (progressionComplete) throw new DungeonCommandError('DUNGEON_COMPLETED', 'select a farm zone to continue');
    if (state.dungeonProgress.expedition.mode === "farm") {
      throw new DungeonCommandError("FARM_MODE_ACTIVE", "change the farm zone instead");
    }
    const personalCeiling = prepared.ids.length > 0
      ? Math.min(...prepared.ids.map((heroId) => (state.dungeonProgress.heroes[heroId]?.completedFloor ?? 0) + 1))
      : 0;
    if (!Number.isInteger(typed.floor) || typed.floor < 1 || typed.floor > highest || typed.floor > personalCeiling || typed.floor > UNDERCITY_MAX_FLOOR) {
      throw new DungeonCommandError("FLOOR_NOT_REACHED", "requested dungeon floor is not available");
    }
    if (state.currentEncounter) throw new DungeonCommandError("ENCOUNTER_ACTIVE", "an encounter is already active");
    if (state.dungeonProgress.expedition.halted) throw new DungeonCommandError("EXPEDITION_HALTED", "resume the expedition first");
    const expedition = { ...state.dungeonProgress.expedition, mode: "progression" as const, zoneId: null, floor: typed.floor, room: 1 };
    state = projectExpedition({ ...state, dungeonProgress: { ...state.dungeonProgress, expedition } }, false);
    return { state, events: [{ type: "dungeon.floor_selected", dungeonId: UNDERCITY_DUNGEON_ID, floor: typed.floor }] };
  }

  if (typed.type === "dungeon.retreat") {
    const encounterId = state.currentEncounter?.encounterId ?? null;
    const heroes = state.heroes.map((hero) => hero.isActive ? { ...hero, isActive: false, status: "resting" as const } : hero);
    state = stoppedAtRestart({ ...state, heroes, currentEncounter: null }, "retreat", prepared.ids);
    return { state, events: [{ type: "dungeon.retreat", dungeonId: UNDERCITY_DUNGEON_ID, encounterId, floor, room }] };
  }

  if (typed.type === "dungeon.resolve") {
    if (!state.currentEncounter || state.currentEncounter.status !== "active") throw new DungeonCommandError("NO_ACTIVE_ENCOUNTER", "there is no active encounter");
    if (!rng) throw new DungeonCommandError("RNG_REQUIRED", "canonical RNG is required");
    return resolveEncounter(state, rng);
  }

  if (progressionComplete) throw new DungeonCommandError('DUNGEON_COMPLETED', 'select a farm zone to continue');
  const personalCeiling = prepared.ids.length > 0
    ? Math.min(...prepared.ids.map((heroId) => (state.dungeonProgress.heroes[heroId]?.completedFloor ?? 0) + 1))
    : 0;
  if (typed.type !== "dungeon.explore" || !Number.isInteger(typed.floor) || typed.floor !== floor || typed.floor > highest || typed.floor > personalCeiling) {
    throw new DungeonCommandError("FLOOR_NOT_REACHED", "requested dungeon floor is not available");
  }
  if (state.dungeonProgress.expedition.halted) throw new DungeonCommandError("EXPEDITION_HALTED", "resume the expedition first");
  if (state.currentEncounter) throw new DungeonCommandError("ENCOUNTER_ACTIVE", "an encounter is already active");
  if (prepared.ids.length === 0) throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");

  const commandId = typed.commandId ?? "dungeon-command";
  const encounterId = "encounter-" + commandId;
  const currentEncounter = {
    encounterId,
    kind: "pending",
    status: "active",
    dungeonId: UNDERCITY_DUNGEON_ID,
    floor,
    room,
    participantHeroIds: prepared.ids,
    commandId,
  } as const;
  return {
    state: { ...state, currentEncounter, autoExplore: state.autoExplore ?? false },
    events: [{ type: "dungeon.encounter_started", dungeonId: UNDERCITY_DUNGEON_ID, encounterId, floor, room }],
  };
}
