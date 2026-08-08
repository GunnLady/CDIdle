import type { CitizenAllocation, Resources } from "../types";
import { BUILDINGS_LIST, BUILDING_UNLOCKS, checkBuildingUnlocked, getBuildingMaxLevel, getBuildingUpgradeCost } from "../data/gameData";

export type CityJobId = keyof Omit<CitizenAllocation, "unassigned">;

export interface CityBuildingView {
  id: string; name: string; description: string; icon: string; categoryLabel: string;
  level: number; maxLevel: number; unlocked: boolean; prerequisite?: string;
  cost: Resources; affordable: boolean; atMaxLevel: boolean;
}

export interface CityJobView {
  id: CityJobId; label: string; buildingLabel: string; buildingLevel: number;
  count: number; canAdd: boolean; canRemove: boolean;
}

export interface CityDashboardView {
  buildings: CityBuildingView[];
  jobs: CityJobView[];
  unassignedCitizens: number;
  totalCitizens: number;
  maxCitizens: number;
  citizenGrowthProgress: number;
}

const categoryLabels = { housing: "Logement", production: "Production", military: "Vocation", social: "Communauté" } as const;

const affordable = (resources: Resources, cost: Resources) =>
  resources.gold >= cost.gold && resources.food >= cost.food && resources.wood >= cost.wood
  && resources.stone >= cost.stone && resources.ore >= cost.ore;

export function createCityDashboardView(input: {
  resources: Resources; buildings: Record<string, number>; citizens: CitizenAllocation;
  totalCitizens: number; citizenGrowthProgress: number; highestFloorReached: number;
}): CityDashboardView {
  const buildings = BUILDINGS_LIST.map((building): CityBuildingView => {
    const level = input.buildings[building.id] ?? 0;
    const maxLevel = getBuildingMaxLevel(building.id);
    const unlocked = level > 0 || checkBuildingUnlocked(building.id, input.buildings, input.highestFloorReached);
    const cost = getBuildingUpgradeCost(building.id, level);
    const atMaxLevel = level >= maxLevel;
    return {
      id: building.id, name: building.name, description: building.description, icon: building.icon,
      categoryLabel: categoryLabels[building.category], level, maxLevel, unlocked,
      ...(unlocked ? {} : { prerequisite: BUILDING_UNLOCKS[building.id]?.desc }),
      cost, atMaxLevel, affordable: unlocked && !atMaxLevel && affordable(input.resources, cost),
    };
  });
  const jobs: CityJobView[] = [
    { id: "farmers", label: "Fermiers", buildingLabel: "Ferme", buildingLevel: input.buildings.ferme ?? 0, count: input.citizens.farmers, canAdd: input.citizens.unassigned > 0 && (input.buildings.ferme ?? 0) > 0, canRemove: input.citizens.farmers > 0 },
    { id: "woodcutters", label: "Bûcherons", buildingLabel: "Maison de bûcheron", buildingLevel: input.buildings.scierie ?? 0, count: input.citizens.woodcutters, canAdd: input.citizens.unassigned > 0 && (input.buildings.scierie ?? 0) > 0, canRemove: input.citizens.woodcutters > 0 },
    { id: "quarrymen", label: "Tailleurs de pierre", buildingLabel: "Carrière", buildingLevel: input.buildings.carriere ?? 0, count: input.citizens.quarrymen, canAdd: input.citizens.unassigned > 0 && (input.buildings.carriere ?? 0) > 0, canRemove: input.citizens.quarrymen > 0 },
    { id: "miners", label: "Mineurs", buildingLabel: "Mine", buildingLevel: input.buildings.mine ?? 0, count: input.citizens.miners, canAdd: input.citizens.unassigned > 0 && (input.buildings.mine ?? 0) > 0, canRemove: input.citizens.miners > 0 },
  ];
  return {
    buildings, jobs, unassignedCitizens: input.citizens.unassigned, totalCitizens: input.totalCitizens,
    maxCitizens: (input.buildings.habitation ?? 0) * 3, citizenGrowthProgress: input.citizenGrowthProgress,
  };
}
