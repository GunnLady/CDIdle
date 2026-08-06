import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Resources,
  CitizenAllocation,
  ResourceRates
} from "../types";
import { calculateRates } from "../utils/gameCalculations";
import { createInitialBuildingLevels } from "../data/buildings";
import { projectTownDisplay } from "../domain/townProjection";
import {
  projectAuthoritativeElapsedSeconds,
  type AuthoritativeTimeAnchor,
} from "../domain/authoritativeTimeProjection";

export const EMPTY_TOWN_RESOURCES: Resources = {
  gold: 0,
  food: 0,
  wood: 0,
  stone: 0,
  ore: 0,
};

export const INITIAL_TOWN_RESOURCES: Resources = {
  gold: 75,
  food: 50,
  wood: 20,
  stone: 0,
  ore: 0
};

export const INITIAL_TOWN_CITIZENS: CitizenAllocation = {
  farmers: 0,
  woodcutters: 0,
  quarrymen: 0,
  miners: 0,
  unassigned: 3
};

export const INITIAL_TOWN_BUILDINGS = createInitialBuildingLevels();

export function useTownSystem(options: {
  currentUser: unknown;
  isOnline: boolean;
  timeAnchor: AuthoritativeTimeAnchor | null;
  resources: Resources;
  buildings: { [key: string]: number };
  citizens: CitizenAllocation;
  totalCitizens: number;
  citizenGrowthProgress: number;
}) {
  const {
    buildings,
    citizenGrowthProgress,
    citizens,
    currentUser,
    isOnline,
    resources,
    timeAnchor,
    totalCitizens,
  } = options;
  const [projectionNow, setProjectionNow] = useState(() => globalThis.performance?.now() ?? 0);
  const getRates = useCallback((): ResourceRates => {
    return calculateRates(citizens, buildings, !!currentUser);
  }, [citizens, buildings, currentUser]);

  useEffect(() => {
    if (!currentUser || !isOnline) return;
    const interval = window.setInterval(() => setProjectionNow(globalThis.performance?.now() ?? 0), 1_000);
    return () => window.clearInterval(interval);
  }, [currentUser, isOnline]);

  const displayProjection = useMemo(() => projectTownDisplay({
    resources,
    rates: getRates(),
    // When transport drops, projectionNow stops advancing but the last
    // read-only projection remains visible until the server reconciles.
    elapsedSeconds: projectAuthoritativeElapsedSeconds(timeAnchor, projectionNow),
    totalCitizens,
    habitationLevel: buildings.habitation ?? 0,
    citizenGrowthProgress,
  }), [
    buildings.habitation,
    citizenGrowthProgress,
    getRates,
    projectionNow,
    resources,
    timeAnchor,
    totalCitizens,
  ]);

  return {
    resources,
    displayResources: displayProjection.resources,
    displayTotalCitizens: displayProjection.totalCitizens,
    displayCitizenGrowthProgress: displayProjection.citizenGrowthProgress,
    hasPendingImmigration: displayProjection.hasPendingImmigration,
    buildings,
    citizens,
    totalCitizens,
    citizenGrowthProgress,
    getRates,
  };
}
