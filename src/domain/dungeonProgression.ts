export const DUNGEON_ROOMS_PER_FLOOR = 50;
export interface DungeonProgressState { activeFloor: number; activeRoom: number; highestFloorReached: number; }
export type ProgressionError = "INVALID_STATE" | "ALREADY_AT_LOWEST_FLOOR" | "FLOOR_NOT_REACHED";
export type ProgressionResult = { ok: true; state: DungeonProgressState } | { ok: false; error: ProgressionError };

export function validateDungeonProgress(state: DungeonProgressState): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(state.activeFloor) || state.activeFloor < 1) errors.push("activeFloor must be an integer >= 1");
  if (!Number.isInteger(state.activeRoom) || state.activeRoom < 1 || state.activeRoom > DUNGEON_ROOMS_PER_FLOOR) errors.push("activeRoom must be between 1 and 50");
  if (!Number.isInteger(state.highestFloorReached) || state.highestFloorReached < state.activeFloor) errors.push("highestFloorReached must be >= activeFloor");
  return errors;
}

export function advanceRoom(state: DungeonProgressState): ProgressionResult {
  if (validateDungeonProgress(state).length > 0) return { ok: false, error: "INVALID_STATE" };
  if (state.activeRoom < DUNGEON_ROOMS_PER_FLOOR) return { ok: true, state: { ...state, activeRoom: state.activeRoom + 1 } };
  const nextFloor = state.activeFloor + 1;
  return { ok: true, state: { activeFloor: nextFloor, activeRoom: 1, highestFloorReached: Math.max(state.highestFloorReached, nextFloor) } };
}

export function changeFloor(state: DungeonProgressState, direction: "prev" | "next"): ProgressionResult {
  if (validateDungeonProgress(state).length > 0) return { ok: false, error: "INVALID_STATE" };
  const target = direction === "prev" ? state.activeFloor - 1 : state.activeFloor + 1;
  if (target < 1) return { ok: false, error: "ALREADY_AT_LOWEST_FLOOR" };
  if (target > state.highestFloorReached) return { ok: false, error: "FLOOR_NOT_REACHED" };
  return { ok: true, state: { ...state, activeFloor: target, activeRoom: 1 } };
}
