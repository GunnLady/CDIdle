import type { CitizenAllocation, Resources, ResourceRates } from "../types";
import { DISTRICTS_LIST } from "../data/districts";
import { getBuildingMaxLevel, getBuildingUpgradeCost } from "../data/buildings";
import { calculateRates } from "../utils/gameCalculations";

export interface TownState {
  resources: Resources;
  buildings: Record<string, number>;
  citizens: CitizenAllocation;
  totalCitizensCount: number;
  districts: Record<string, boolean>;
}

export type TownMutationResult = { ok: true; state: TownState } | { ok: false; error: "INVALID_AMOUNT" | "BUILDING_REQUIRED" | "MAX_LEVEL" | "INSUFFICIENT_RESOURCES" | "ALREADY_UNLOCKED" | "UNKNOWN_DISTRICT" };

const JOB_BUILDING: Record<keyof Omit<CitizenAllocation, "unassigned">, string> = { farmers: "ferme", woodcutters: "scierie", quarrymen: "carriere", miners: "mine" };
const canAfford = (resources: Resources, cost: Resources) => Object.keys(cost).every((key) => resources[key as keyof Resources] >= cost[key as keyof Resources]);
const subtract = (resources: Resources, cost: Resources): Resources => ({ gold: resources.gold - cost.gold, food: resources.food - cost.food, wood: resources.wood - cost.wood, stone: resources.stone - cost.stone, ore: resources.ore - cost.ore });

export function townRates(state: TownState, hasUser = true): ResourceRates { return calculateRates(state.citizens, state.buildings, state.districts, hasUser); }

export function allocateCitizen(state: TownState, job: keyof Omit<CitizenAllocation, "unassigned">, amount: number): TownMutationResult {
  if (!Number.isInteger(amount) || amount === 0) return { ok: false, error: "INVALID_AMOUNT" };
  const building = JOB_BUILDING[job];
  if (amount > 0 && (state.buildings[building] ?? 0) < 1) return { ok: false, error: "BUILDING_REQUIRED" };
  const nextJob = state.citizens[job] + amount;
  const nextUnassigned = state.citizens.unassigned - amount;
  if (nextJob < 0 || nextUnassigned < 0) return { ok: false, error: "INVALID_AMOUNT" };
  return { ok: true, state: { ...state, citizens: { ...state.citizens, [job]: nextJob, unassigned: nextUnassigned } } };
}

export function upgradeBuilding(state: TownState, buildingId: string): TownMutationResult {
  const level = state.buildings[buildingId] ?? 0;
  if (level >= getBuildingMaxLevel(buildingId)) return { ok: false, error: "MAX_LEVEL" };
  const cost = getBuildingUpgradeCost(buildingId, level);
  if (!canAfford(state.resources, cost)) return { ok: false, error: "INSUFFICIENT_RESOURCES" };
  return { ok: true, state: { ...state, resources: subtract(state.resources, cost), buildings: { ...state.buildings, [buildingId]: level + 1 } } };
}

export function unlockDistrict(state: TownState, districtId: string): TownMutationResult {
  const district = DISTRICTS_LIST.find((entry) => entry.id === districtId);
  if (!district) return { ok: false, error: "UNKNOWN_DISTRICT" };
  if (state.districts[districtId]) return { ok: false, error: "ALREADY_UNLOCKED" };
  if (!canAfford(state.resources, district.cost)) return { ok: false, error: "INSUFFICIENT_RESOURCES" };
  return { ok: true, state: { ...state, resources: subtract(state.resources, district.cost), districts: { ...state.districts, [districtId]: true } } };
}
