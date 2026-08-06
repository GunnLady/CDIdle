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
import { getDungeonRoomCount } from "../../../shared/domain/dungeon-progression.ts";

export type DungeonHero = Hero;

export type DungeonState = CanonicalGameState;

export type DungeonCommand =
  | { type: "dungeon.explore"; floor: number; commandId?: string }
  | { type: "dungeon.select_floor"; floor: number; commandId?: string }
  | { type: "dungeon.resolve"; commandId?: string }
  | { type: "dungeon.auto_explore"; enabled: boolean; commandId?: string }
  | { type: "dungeon.retreat"; commandId?: string };

export class DungeonCommandError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export type ResolvedDungeonEncounter = AuthoritativeDungeonEncounter;

export type DungeonRng = {
  next(): number;
  nextInt(maxExclusive: number): number;
};

const clone = <T>(value: T): T => structuredClone(value);
const activeHeroes = (heroes: DungeonHero[]) =>
  heroes.filter((hero) => hero.isActive === true && Number(hero.currentHp ?? 0) > 0);

function progress(state: DungeonState): { floor: number; room: number; highest: number } {
  const floor = Number(state.activeDungeonFloor ?? 1);
  const persistedRoom = Number(state.activeDungeonRoom ?? 1);
  const highest = Number(state.highestFloorReached ?? floor);
  if (
    !Number.isInteger(floor)
    || floor < 1
    || !Number.isInteger(persistedRoom)
    || persistedRoom < 1
    || persistedRoom > 50
    || !Number.isInteger(highest)
    || highest < floor
  ) {
    throw new DungeonCommandError("INVALID_DUNGEON_STATE", "dungeon progression is invalid");
  }
  const room = state.currentEncounter
    ? persistedRoom
    : Math.min(persistedRoom, getDungeonRoomCount(floor));
  state.activeDungeonRoom = room;
  return { floor, room, highest };
}

function resolveEncounter(state: DungeonState, rng: DungeonRng) {
  const encounterId = String(state.currentEncounter?.encounterId ?? "encounter-unknown");
  let resolved;
  try {
    resolved = resolveAuthoritativeDungeonEncounter(
      state as unknown as AuthoritativeDungeonState,
      encounterId,
      rng,
    );
  } catch (error) {
    if (error instanceof DungeonCommandError) throw error;
    const code = error instanceof Error ? error.message : "DUNGEON_RESOLUTION_FAILED";
    if (code === "NO_ACTIVE_HERO") {
      throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");
    }
    if (code === "COMBAT_LIMIT_REACHED") {
      throw new DungeonCommandError("COMBAT_LIMIT_REACHED", "combat action limit reached");
    }
    if (code === "INVALID_GAME_STATE") {
      throw new DungeonCommandError("INVALID_GAME_STATE", "canonical hero state is invalid");
    }
    throw error;
  }
  const encounterHistory = [...(state.encounterHistory ?? []), resolved.encounter].slice(-15);
  return {
    state: {
      ...resolved.state,
      currentEncounter: null,
      encounterHistory,
    } as unknown as DungeonState,
    events: [{ type: "dungeon.encounter_resolved", encounter: resolved.encounter }],
  };
}

export function applyDungeonCommand(
  current: CanonicalGameState,
  command: Record<string, unknown>,
  rng?: DungeonRng,
): CanonicalStateTransition {
  const state = clone(current);
  const typed = command as DungeonCommand;
  const { floor, room, highest } = progress(state);

  if (typed.type === "dungeon.auto_explore") {
    if (typed.enabled && activeHeroes(state.heroes ?? []).length === 0) {
      throw new DungeonCommandError("NO_ACTIVE_HERO", "at least one active hero is required");
    }
    return {
      state: { ...state, autoExplore: typed.enabled },
      events: [{ type: "dungeon.auto_explore_changed", enabled: typed.enabled }],
    };
  }

  if (typed.type === "dungeon.select_floor") {
    if (!Number.isInteger(typed.floor) || typed.floor < 1 || typed.floor > highest) {
      throw new DungeonCommandError("FLOOR_NOT_REACHED", "requested dungeon floor is not available");
    }
    if (state.currentEncounter) {
      throw new DungeonCommandError("ENCOUNTER_ACTIVE", "an encounter is already active");
    }
    return {
      state: {
        ...state,
        activeDungeonFloor: typed.floor,
        activeDungeonRoom: 1,
        autoExplore: false,
      },
      events: [{ type: "dungeon.floor_selected", floor: typed.floor }],
    };
  }

  if (typed.type === "dungeon.retreat") {
    const encounterId = state.currentEncounter?.encounterId ?? null;
    const heroes = (state.heroes ?? []).map((hero) => hero.isActive
      ? { ...hero, isActive: false, status: "resting" as const }
      : hero);
    return {
      state: { ...state, heroes, currentEncounter: null, autoExplore: false },
      events: [{
        type: "dungeon.retreat",
        encounterId,
        floor,
        room,
      }],
    };
  }

  if (typed.type === "dungeon.resolve") {
    if (!state.currentEncounter || state.currentEncounter.status !== "active") {
      throw new DungeonCommandError("NO_ACTIVE_ENCOUNTER", "there is no active encounter");
    }
    if (!rng) {
      throw new DungeonCommandError("RNG_REQUIRED", "canonical RNG is required");
    }
    return resolveEncounter(state, rng);
  }

  if (
    typed.type !== "dungeon.explore"
    || !Number.isInteger(typed.floor)
    || typed.floor !== floor
    || typed.floor > highest
  ) {
    throw new DungeonCommandError("FLOOR_NOT_REACHED", "requested dungeon floor is not available");
  }
  if (state.currentEncounter) {
    throw new DungeonCommandError("ENCOUNTER_ACTIVE", "an encounter is already active");
  }

  const commandId = typed.commandId ?? "dungeon-command";
  const encounterId = `encounter-${commandId}`;
  const currentEncounter = {
    encounterId,
    kind: "pending",
    status: "active",
    floor,
    room,
    commandId,
  } as const;
  return {
    state: {
      ...state,
      currentEncounter,
      autoExplore: state.autoExplore ?? false,
    },
    events: [{ type: "dungeon.encounter_started", encounterId, floor, room }],
  };
}
