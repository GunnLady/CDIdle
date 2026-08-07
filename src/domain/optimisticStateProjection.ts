import type { CanonicalGameState } from "../../shared/contracts/authoritative";
import type { Hero, HeroEquipment, StoredItemInstance } from "../types";
import { getBuildingUpgradeCost } from "../data/gameData";
import type { GameCommand } from "./commands";
import { equipItem, unequipItem } from "../utils/gameCalculations";
import { preserveResourceRatio } from "../../shared/domain/hero-stats";

export const OPTIMISTIC_COMMAND_TYPES = [
  "citizens.allocate",
  "building.upgrade",
  "hero.activity",
  "hero.equip",
  "hero.unequip",
  "dungeon.select_floor",
  "dungeon.auto_explore",
] as const;

export type OptimisticCommandType = typeof OPTIMISTIC_COMMAND_TYPES[number];
export type OptimisticGameCommand = Extract<GameCommand, { type: OptimisticCommandType }>;

export const OPTIMISTIC_PROJECTED_FIELDS = {
  "citizens.allocate": ["citizens"],
  "building.upgrade": ["resources", "buildings"],
  "hero.activity": ["heroes"],
  "hero.equip": ["heroes", "storedItems"],
  "hero.unequip": ["heroes", "storedItems"],
  "dungeon.select_floor": ["activeDungeonFloor", "activeDungeonRoom", "autoExplore"],
  "dungeon.auto_explore": ["autoExplore"],
} as const satisfies Record<OptimisticCommandType, readonly (keyof CanonicalGameState)[]>;

type OptimisticProjector<T extends OptimisticCommandType> = (
  state: CanonicalGameState,
  command: Extract<OptimisticGameCommand, { type: T }>,
) => CanonicalGameState;

type OptimisticProjectorRegistry = {
  [T in OptimisticCommandType]: OptimisticProjector<T>;
};

const projectors = {
  "citizens.allocate": (state, command) => {
    const citizens = { ...state.citizens };
    const nextRole = Number(citizens[command.role] ?? 0) + command.amount;
    const nextUnassigned = Number(citizens.unassigned ?? 0) - command.amount;
    if (nextRole < 0 || nextUnassigned < 0) return state;
    return { ...state, citizens: { ...citizens, [command.role]: nextRole, unassigned: nextUnassigned } };
  },
  "building.upgrade": (state, command) => {
    const buildings = { ...(state.buildings ?? {}) };
    let resources = { ...state.resources };
    let level = Number(buildings[command.buildingId] ?? 0);
    for (let index = 0; index < (command.levels ?? 1); index += 1) {
      const cost = getBuildingUpgradeCost(command.buildingId, level);
      // The UI authorizes the click from its live time projection. Canonical
      // resources can therefore still be lower until the server applies idle
      // production. Project the intent immediately; the server remains the
      // authority and restores the confirmed state if it rejects the command.
      resources = {
        ...resources,
        gold: resources.gold - cost.gold,
        food: resources.food - cost.food,
        wood: resources.wood - cost.wood,
        stone: resources.stone - cost.stone,
        ore: resources.ore - cost.ore,
      };
      level += 1;
    }
    return { ...state, resources, buildings: { ...buildings, [command.buildingId]: level } };
  },
  "hero.activity": (state, command) => ({
    ...state,
    heroes: (state.heroes ?? []).map((hero: Hero) => hero.id === command.heroId
      ? { ...hero, isActive: command.active, status: command.active ? "idle" : "resting" }
      : hero),
  }),
  "hero.equip": (state, command) => projectEquipment(state, command),
  "hero.unequip": (state, command) => projectEquipment(state, command),
  "dungeon.select_floor": (state, command) => ({
    ...state,
    activeDungeonFloor: command.floor,
    activeDungeonRoom: 1,
    autoExplore: false,
  }),
  "dungeon.auto_explore": (state, command) => ({ ...state, autoExplore: command.enabled }),
} satisfies OptimisticProjectorRegistry;

const optimisticCommandTypeSet = new Set<string>(OPTIMISTIC_COMMAND_TYPES);

export function isOptimisticCommand(command: GameCommand): command is OptimisticGameCommand {
  return optimisticCommandTypeSet.has(command.type);
}

export function projectOptimisticCommands(base: CanonicalGameState, commands: GameCommand[]): CanonicalGameState {
  let state = base;
  for (const command of commands) {
    if (!isOptimisticCommand(command)) continue;
    const projector = projectors[command.type] as (
      current: CanonicalGameState,
      projectedCommand: OptimisticGameCommand,
    ) => CanonicalGameState;
    state = projector(state, command);
  }
  return state;
}

function projectEquipment(
  state: CanonicalGameState,
  command: Extract<OptimisticGameCommand, { type: "hero.equip" | "hero.unequip" }>,
): CanonicalGameState {
  const heroes = structuredClone((state.heroes ?? []) as Hero[]);
  const storedItems = structuredClone((state.storedItems ?? []) as StoredItemInstance[]);
  const index = heroes.findIndex((hero) => hero.id === command.heroId);
  if (index < 0) return state;
  const previous = heroes[index];
  const projected = command.type === "hero.equip"
    ? equipItem(heroes[index], storedItems, command.instanceId)
    : unequipItem(heroes[index], storedItems, command.slot as keyof HeroEquipment);
  const equipment = { ...projected.equipment };
  if (command.type === "hero.unequip") equipment[command.slot as keyof HeroEquipment] = undefined;
  if (command.type === "hero.equip" && previous.equipment?.offHand && !projected.equipment?.offHand) {
    equipment.offHand = undefined;
  }
  heroes[index] = {
    ...projected,
    equipment,
    currentHp: preserveResourceRatio(
      previous.currentHp,
      previous.calculatedStats?.maxHp,
      projected.calculatedStats.maxHp,
      true,
    ),
    currentMana: preserveResourceRatio(
      previous.currentMana,
      previous.calculatedStats?.maxMana,
      projected.calculatedStats.maxMana,
      false,
    ),
  };
  return { ...state, heroes, storedItems };
}
