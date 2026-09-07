import {
  BUILDINGS_LIST,
  BUILDING_UNLOCKS,
  checkBuildingUnlocked,
  getBuildingMaxLevel,
  getBuildingUpgradeCost,
} from "../../../shared/data/buildings.ts";
import { reconcileExistingVocations } from "./vocation-reconciliation.ts";
import { TownCommandError, type TownCommandHandler } from "./command-handler.ts";
import type { TownResources } from "./town-state.ts";
import { createUndercityHeroProgress } from "../../../shared/domain/undercity-progression.ts";
import { UNDERCITY_DUNGEON_ID, UNDERCITY_MAX_FLOOR } from "../../../shared/domain/undercity.ts";

const affordable = (resources: TownResources, cost: TownResources) =>
  Object.keys(cost).every((key) => resources[key as keyof TownResources] >= cost[key as keyof TownResources]);

const subtract = (resources: TownResources, cost: TownResources): TownResources => ({
  gold: resources.gold - cost.gold,
  food: resources.food - cost.food,
  wood: resources.wood - cost.wood,
  stone: resources.stone - cost.stone,
  ore: resources.ore - cost.ore,
});

export const upgradeBuilding: TownCommandHandler<"building.upgrade"> = (context, command) => {
  const town = context.town;
  const id = command.buildingId;
  if (!BUILDINGS_LIST.some((building) => building.id === id)) {
    throw new TownCommandError("INVALID_COMMAND", "unknown or unsupported building");
  }
  const levels = command.levels ?? 1;
  if (!Number.isInteger(levels) || levels < 1 || levels > 5) {
    throw new TownCommandError("INVALID_COMMAND", "invalid building upgrade count");
  }
  let level = town.buildings[id] ?? 0;
  if (level >= getBuildingMaxLevel(id)) {
    throw new TownCommandError("MAX_LEVEL", "building reached its maximum level");
  }
  const requirement = BUILDING_UNLOCKS[id];
  for (const [required, requiredLevel] of Object.entries(requirement?.requiredBuildings ?? {})) {
    if ((town.buildings[required] ?? 0) < requiredLevel) {
      throw new TownCommandError("BUILDING_REQUIRED", "building prerequisite is missing");
    }
  }
  let resources = { ...town.resources };
  for (let index = 0; index < levels; index += 1) {
    if (level >= getBuildingMaxLevel(id)) {
      throw new TownCommandError("MAX_LEVEL", "building reached its maximum level");
    }
    const targetLevel = level + 1;
    if (!checkBuildingUnlocked(id, town.buildings, town.highestFloorReached ?? 1, targetLevel)) {
      throw new TownCommandError("FLOOR_REQUIRED", "dungeon floor prerequisite is missing");
    }
    const cost = getBuildingUpgradeCost(id, level);
    if (!affordable(resources, cost)) {
      throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient resources");
    }
    resources = subtract(resources, cost);
    level += 1;
  }
  const reconciled = reconcileExistingVocations({
    ...town,
    resources,
    buildings: { ...town.buildings, [id]: level },
  });
  return {
    state: reconciled,
    events: [{ type: "building.upgraded", buildingId: id, level, ...(levels > 1 ? { levels } : {}) }],
  };
};

export const rejectDistrictUnlock: TownCommandHandler<"district.unlock"> = () => {
  throw new TownCommandError("DISTRICTS_DISABLED", "districts are disabled pending redesign");
};

export const grantCheatResources: TownCommandHandler<"cheat.grant_resources"> = (context, command) => {
  if (!context.allowCheats) throw new TownCommandError("CHEATS_DISABLED", "cheats are disabled");
  const resources = { ...context.town.resources };
  for (const [resource, amount] of Object.entries(command.amounts)) {
    if (!(resource in resources) || !Number.isFinite(amount) || Number(amount) < 0 || Number(amount) > 1_000_000_000) {
      throw new TownCommandError("INVALID_COMMAND", "invalid cheat resource amount");
    }
    resources[resource as keyof TownResources] += Number(amount);
  }
  return {
    state: { ...context.town, resources },
    events: [{ type: "cheat.resources_granted", amounts: command.amounts }],
  };
};

export const setCheatHighestFloor: TownCommandHandler<"cheat.set_highest_floor"> = (context, command) => {
  if (!context.allowCheats) throw new TownCommandError("CHEATS_DISABLED", "cheats are disabled");
  if (!Number.isInteger(command.floor) || command.floor < 1 || command.floor > UNDERCITY_MAX_FLOOR) {
    throw new TownCommandError("INVALID_COMMAND", "invalid cheat floor");
  }
  const completedFloor = command.floor - 1;
  const dungeonProgress = {
    dungeonId: UNDERCITY_DUNGEON_ID,
    heroes: Object.fromEntries(context.town.heroes.map((hero) => [hero.id, createUndercityHeroProgress(completedFloor)])),
    expedition: {
      dungeonId: UNDERCITY_DUNGEON_ID,
      mode: "progression" as const,
      zoneId: null,
      floor: command.floor,
      room: 1,
      halted: false,
      haltReason: null,
    },
  };
  return {
    state: {
      ...context.town,
      highestFloorReached: command.floor,
      activeDungeonFloor: command.floor,
      activeDungeonRoom: 1,
      autoExplore: false,
      dungeonProgress,
    },
    events: [{ type: "cheat.highest_floor_set", floor: command.floor }],
  };
};
