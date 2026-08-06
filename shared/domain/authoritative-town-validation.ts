import {
  BUILDINGS_LIST,
  getBuildingMaxLevel,
} from "../data/buildings.ts";

const RESOURCE_FIELDS = ["gold", "food", "wood", "stone", "ore"] as const;
export const ALLOCATABLE_CITIZEN_ROLES = [
  "farmers",
  "woodcutters",
  "quarrymen",
  "miners",
] as const;
const CITIZEN_FIELDS = [...ALLOCATABLE_CITIZEN_ROLES, "unassigned"] as const;
const BUILDING_IDS = new Set(BUILDINGS_LIST.map((building) => building.id));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validateAuthoritativeTownState(
  input: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  const resources = input.resources;
  if (!isRecord(resources)) {
    errors.push("resources must be an object");
  } else {
    for (const field of RESOURCE_FIELDS) {
      const value = resources[field];
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        errors.push(`resources.${field} must be a finite number >= 0`);
      }
    }
    for (const field of Object.keys(resources)) {
      if (!(RESOURCE_FIELDS as readonly string[]).includes(field)) errors.push(`resources.${field} is not a canonical resource`);
    }
  }

  const buildings = input.buildings;
  if (!isRecord(buildings)) {
    errors.push("buildings must be an object");
  } else {
    for (const buildingId of BUILDING_IDS) {
      const level = buildings[buildingId];
      if (!Number.isInteger(level) || Number(level) < 0 || Number(level) > getBuildingMaxLevel(buildingId)) {
        errors.push(`buildings.${buildingId} must be an integer between 0 and ${getBuildingMaxLevel(buildingId)}`);
      }
    }
    for (const buildingId of Object.keys(buildings)) {
      if (!BUILDING_IDS.has(buildingId)) errors.push(`buildings.${buildingId} is not a canonical building`);
    }
  }

  const citizens = input.citizens;
  let allocationTotal = 0;
  if (!isRecord(citizens)) {
    errors.push("citizens must be an object");
  } else {
    for (const field of CITIZEN_FIELDS) {
      const value = citizens[field];
      if (!Number.isInteger(value) || Number(value) < 0) {
        errors.push(`citizens.${field} must be an integer >= 0`);
      } else {
        allocationTotal += Number(value);
      }
    }
    for (const field of Object.keys(citizens)) {
      if (!(CITIZEN_FIELDS as readonly string[]).includes(field)) errors.push(`citizens.${field} is not a canonical citizen role`);
    }
  }

  const totalCitizens = input.totalCitizensCount;
  if (!Number.isInteger(totalCitizens) || Number(totalCitizens) < 0) {
    errors.push("totalCitizensCount must be an integer >= 0");
  } else {
    if (isRecord(citizens) && allocationTotal !== Number(totalCitizens)) errors.push("citizen allocations must equal totalCitizensCount");
    if (isRecord(buildings) && Number(totalCitizens) > Number(buildings.habitation ?? 0) * 3) {
      errors.push("totalCitizensCount must not exceed habitation capacity");
    }
  }

  const growthProgress = input.citizenGrowthProgress;
  if (!Number.isInteger(growthProgress) || Number(growthProgress) < 0 || Number(growthProgress) >= 100) {
    errors.push("citizenGrowthProgress must be an integer between 0 and 99");
  }

  const districts = input.districts;
  if (!isRecord(districts)) {
    errors.push("districts must be an object");
  } else {
    for (const [districtId, unlocked] of Object.entries(districts)) {
      if (typeof unlocked !== "boolean") errors.push(`districts.${districtId} must be a boolean`);
    }
  }

  return errors;
}

