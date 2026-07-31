import type { GameCommand } from "./commands";
import type { Hero, HeroEquipment, StoredItemInstance } from "../types";
import { getBuildingUpgradeCost } from "../data/gameData";
import { equipItem, unequipItem } from "../utils/gameCalculations";

type CanonicalRecord = Record<string, any>;

export function projectOptimisticCommands(base: CanonicalRecord, commands: GameCommand[]): CanonicalRecord {
  let state = base;
  for (const command of commands) state = projectCommand(state, command);
  return state;
}

function projectCommand(state: CanonicalRecord, command: GameCommand): CanonicalRecord {
  if (command.type === "citizens.allocate") {
    const citizens = { ...(state.citizens ?? {}) };
    const nextRole = Number(citizens[command.role] ?? 0) + command.amount;
    const nextUnassigned = Number(citizens.unassigned ?? 0) - command.amount;
    if (nextRole < 0 || nextUnassigned < 0) return state;
    return { ...state, citizens: { ...citizens, [command.role]: nextRole, unassigned: nextUnassigned } };
  }
  if (command.type === "building.upgrade") {
    const buildings = { ...(state.buildings ?? {}) };
    let resources = { ...(state.resources ?? {}) };
    let level = Number(buildings[command.buildingId] ?? 0);
    for (let index = 0; index < (command.levels ?? 1); index += 1) {
      const cost = getBuildingUpgradeCost(command.buildingId, level);
      if (Object.entries(cost).some(([resource, amount]) => Number(resources[resource] ?? 0) < Number(amount))) break;
      resources = Object.fromEntries(Object.entries(resources).map(([resource, amount]) => [resource, Number(amount) - Number(cost[resource as keyof typeof cost] ?? 0)]));
      level += 1;
    }
    return { ...state, resources, buildings: { ...buildings, [command.buildingId]: level } };
  }
  if (command.type === "hero.activity") {
    return {
      ...state,
      heroes: (state.heroes ?? []).map((hero: Hero) => hero.id === command.heroId
        ? { ...hero, isActive: command.active, status: command.active ? "idle" : "resting" }
        : hero),
    };
  }
  if (command.type === "hero.equip" || command.type === "hero.unequip") {
    const heroes = structuredClone((state.heroes ?? []) as Hero[]);
    const storedItems = structuredClone((state.storedItems ?? []) as StoredItemInstance[]);
    const index = heroes.findIndex((hero) => hero.id === command.heroId);
    if (index < 0) return state;
    heroes[index] = command.type === "hero.equip"
      ? equipItem(heroes[index], storedItems, command.instanceId)
      : unequipItem(heroes[index], storedItems, command.slot as keyof HeroEquipment);
    return { ...state, heroes, storedItems };
  }
  if (command.type === "dungeon.select_floor") {
    return { ...state, activeDungeonFloor: command.floor, activeDungeonRoom: 1, autoExplore: false };
  }
  if (command.type === "dungeon.auto_explore") return { ...state, autoExplore: command.enabled };
  return state;
}
