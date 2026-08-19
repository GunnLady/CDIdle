import type { BattleLogEntry, CitizenAllocation, ResourceRates, Resources } from "../types";
import { BUILDINGS_LIST, BUILDING_UNLOCKS, checkBuildingUnlocked, getBuildingMaxLevel, getBuildingUpgradeCost } from "../data/gameData";

export type CityJobId = keyof Omit<CitizenAllocation, "unassigned">;

export interface CityBuildingView {
  id: string; name: string; description: string; icon: string; categoryLabel: string;
  level: number; maxLevel: number; unlocked: boolean; prerequisite?: string;
  cost: Resources; affordable: boolean; atMaxLevel: boolean;
}

export interface CityJobView {
  id: CityJobId; label: string; buildingLabel: string; buildingLevel: number;
  productionLabel: string; count: number; canAdd: boolean; canRemove: boolean;
}

export interface CityDashboardView {
  buildings: CityBuildingView[];
  jobs: CityJobView[];
  unassignedCitizens: number;
  totalCitizens: number;
  maxCitizens: number;
  citizenGrowthProgress: number;
}

export interface CityHistoryView {
  entries: BattleLogEntry[];
  emptyMessage: string;
}

const categoryLabels = { housing: "Logement", production: "Production", military: "Vocation", social: "Communauté" } as const;

const affordable = (resources: Resources, cost: Resources) =>
  resources.gold >= cost.gold && resources.food >= cost.food && resources.wood >= cost.wood
  && resources.stone >= cost.stone && resources.ore >= cost.ore;

export function createCityDashboardView(input: {
  resources: Resources; buildings: Record<string, number>; citizens: CitizenAllocation;
  totalCitizens: number; citizenGrowthProgress: number; highestFloorReached: number; rates?: ResourceRates;
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
  const formatRate = (rate: number) => rate.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const job = (id: CityJobId, label: string, buildingLabel: string, buildingId: string, resourceLabel: string, rate: number | undefined): CityJobView => {
    const buildingLevel = input.buildings[buildingId] ?? 0;
    const count = input.citizens[id];
    const resolvedRate = rate ?? count * buildingLevel;
    return { id, label, buildingLabel, buildingLevel, count, canAdd: input.citizens.unassigned > 0 && buildingLevel > 0, canRemove: count > 0, productionLabel: buildingLevel > 0 ? `+${formatRate(resolvedRate)} ${resourceLabel}/s` : "Bâtiment non construit" };
  };
  const jobs: CityJobView[] = [
    job("farmers", "Fermiers", "Ferme", "ferme", "Nourriture", input.rates?.food),
    job("woodcutters", "Bûcherons", "Maison de bûcheron", "scierie", "Bois", input.rates?.wood),
    job("quarrymen", "Tailleurs de pierre", "Carrière", "carriere", "Pierre", input.rates?.stone),
    job("miners", "Mineurs", "Mine", "mine", "Minerai", input.rates?.ore),
  ];
  return {
    buildings, jobs, unassignedCitizens: input.citizens.unassigned, totalCitizens: input.totalCitizens,
    maxCitizens: (input.buildings.habitation ?? 0) * 3, citizenGrowthProgress: input.citizenGrowthProgress,
  };
}

export function createCityHistoryView(logs: BattleLogEntry[]): CityHistoryView {
  return {
    entries: [...logs].filter((entry) => entry.category === "colony").reverse(),
    emptyMessage: "Aucune action de la cité enregistrée.",
  };
}
