import type { Resources, ResourceRates } from "../types";

type TownProjectionInput = {
  resources: Resources;
  rates: ResourceRates;
  elapsedSeconds: number;
  totalCitizens: number;
  habitationLevel: number;
  citizenGrowthProgress: number;
};

export type TownDisplayProjection = {
  resources: Resources;
  totalCitizens: number;
  citizenGrowthProgress: number;
};

/** Read-only UI projection. The authoritative snapshot is never mutated. */
export function projectTownDisplay(input: TownProjectionInput): TownDisplayProjection {
  const seconds = Math.max(0, Math.floor(input.elapsedSeconds));
  const resources: Resources = {
    ...input.resources,
    food: input.resources.food + input.rates.food * seconds,
    wood: input.resources.wood + input.rates.wood * seconds,
    stone: input.resources.stone + input.rates.stone * seconds,
    ore: input.resources.ore + input.rates.ore * seconds,
  };
  const capacity = Math.max(0, input.habitationLevel) * 3;
  let citizens = input.totalCitizens;
  let progress = input.citizenGrowthProgress;
  let completedOnLastSecond = false;
  for (let second = 0; second < seconds && citizens < capacity; second += 1) {
    completedOnLastSecond = false;
    if (resources.food < 1) break;
    resources.food -= 1;
    progress += 5;
    if (progress >= 100) {
      progress -= 100;
      citizens += 1;
      completedOnLastSecond = second === seconds - 1;
    }
  }
  return {
    resources,
    totalCitizens: completedOnLastSecond ? citizens - 1 : citizens,
    citizenGrowthProgress: completedOnLastSecond
      ? 100
      : citizens >= capacity ? 0 : progress,
  };
}

export const projectTownResources = (input: TownProjectionInput): Resources =>
  projectTownDisplay(input).resources;
