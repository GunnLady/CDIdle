import { GameState, Resources, CitizenAllocation } from "../types";
import { DEFAULT_UNLOCKED_ITEM_BLUEPRINTS } from "../utils/gameCalculations";

export const TRANSIENT_GAME_STATE_FIELDS = ["combatTimer", "battleLogs", "currentMonster", "autoExplore"] as const;
export type PersistentGameState = Omit<GameState, (typeof TRANSIENT_GAME_STATE_FIELDS)[number]>;
export type TransientGameState = Pick<GameState, (typeof TRANSIENT_GAME_STATE_FIELDS)[number]>;

const INITIAL_RESOURCES: Resources = { gold: 75, food: 50, wood: 20, stone: 0, ore: 0 };
const INITIAL_CITIZENS: CitizenAllocation = { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 };
const INITIAL_BUILDINGS = { habitation: 1, ferme: 0, scierie: 0, carriere: 0, mine: 0, maison_chef: 0, guilde: 0, caserne: 0, temple: 0, academie: 0, forge: 0 };

export function createInitialGameState(): GameState {
  return {
    resources: { ...INITIAL_RESOURCES }, buildings: { ...INITIAL_BUILDINGS }, citizens: { ...INITIAL_CITIZENS },
    totalCitizensCount: 3, districts: {}, heroes: [], activeDungeonFloor: 1, activeDungeonRoom: 1,
    combatTimer: 2, battleLogs: [], currentMonster: null, autoExplore: true, highestFloorReached: 1,
    soundEnabled: true, storedItems: [], forgeMaterials: [],
    itemBlueprints: DEFAULT_UNLOCKED_ITEM_BLUEPRINTS.map((blueprint) => ({ ...blueprint }))
  };
}

export function resetGameState(): GameState { return createInitialGameState(); }

export function splitGameState(state: GameState): { persistent: PersistentGameState; transient: TransientGameState } {
  const { combatTimer, battleLogs, currentMonster, autoExplore, ...persistent } = state;
  return { persistent, transient: { combatTimer, battleLogs, currentMonster, autoExplore } };
}

export function validateGameState(state: GameState): string[] {
  const errors: string[] = [];
  const nonNegative = (value: number, path: string) => { if (!Number.isFinite(value) || value < 0) errors.push(`${path} must be a finite non-negative number`); };
  Object.entries(state.resources).forEach(([key, value]) => nonNegative(value, `resources.${key}`));
  Object.entries(state.buildings).forEach(([key, value]) => nonNegative(value, `buildings.${key}`));
  Object.entries(state.citizens).forEach(([key, value]) => nonNegative(value, `citizens.${key}`));
  nonNegative(state.totalCitizensCount, "totalCitizensCount"); nonNegative(state.activeDungeonFloor, "activeDungeonFloor"); nonNegative(state.highestFloorReached, "highestFloorReached");
  if (!Number.isInteger(state.activeDungeonFloor) || state.activeDungeonFloor < 1) errors.push("activeDungeonFloor must be an integer >= 1");
  if (!Number.isInteger(state.activeDungeonRoom) || state.activeDungeonRoom < 1 || state.activeDungeonRoom > 50) errors.push("activeDungeonRoom must be an integer between 1 and 50");
  if (state.highestFloorReached < state.activeDungeonFloor) errors.push("highestFloorReached must be >= activeDungeonFloor");
  const allocated = Object.values(state.citizens).reduce((sum, count) => sum + count, 0);
  if (allocated !== state.totalCitizensCount) errors.push("citizen allocations must equal totalCitizensCount");
  return errors;
}
