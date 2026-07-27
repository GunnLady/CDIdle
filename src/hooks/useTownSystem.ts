import { useState, useCallback, useEffect, useMemo } from "react";
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

const INITIAL_RESOURCES: Resources = {
  gold: 75,
  food: 50,
  wood: 20,
  stone: 0,
  ore: 0
};

const INITIAL_CITIZENS: CitizenAllocation = {
  farmers: 0,
  woodcutters: 0,
  quarrymen: 0,
  miners: 0,
  unassigned: 3
};

const INITIAL_BUILDINGS = createInitialBuildingLevels();

export function useTownSystem(
  currentUser: unknown,
  isOnline: boolean,
  timeAnchor: AuthoritativeTimeAnchor | null,
) {
  const [resources, setCanonicalResources] = useState<Resources>(INITIAL_RESOURCES);
  const [buildings, setBuildings] = useState<{ [key: string]: number }>(INITIAL_BUILDINGS);
  const [citizens, setCitizens] = useState<CitizenAllocation>(INITIAL_CITIZENS);
  const [totalCitizens, setTotalCitizens] = useState<number>(3);
  const [citizenGrowthProgress, setCitizenGrowthProgress] = useState<number>(0);
  const [projectionNow, setProjectionNow] = useState(() => globalThis.performance?.now() ?? 0);
  const setResources = useCallback((next: Resources) => {
    setCanonicalResources(next);
  }, []);
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
    elapsedSeconds: isOnline ? projectAuthoritativeElapsedSeconds(timeAnchor, projectionNow) : 0,
    totalCitizens,
    habitationLevel: buildings.habitation ?? 0,
    citizenGrowthProgress,
  }), [
    buildings.habitation,
    citizenGrowthProgress,
    getRates,
    isOnline,
    projectionNow,
    resources,
    timeAnchor,
    totalCitizens,
  ]);

  const resetTownSystem = useCallback(() => {
    setResources({ gold: 75, food: 50, wood: 20, stone: 0, ore: 0 });
    setBuildings(createInitialBuildingLevels());
    setCitizens(INITIAL_CITIZENS);
    setTotalCitizens(3);
    setCitizenGrowthProgress(0);
  }, [setResources]);

  return {
    resources,
    displayResources: displayProjection.resources,
    displayTotalCitizens: displayProjection.totalCitizens,
    displayCitizenGrowthProgress: displayProjection.citizenGrowthProgress,
    setResources,
    buildings,
    setBuildings,
    citizens,
    setCitizens,
    totalCitizens,
    setTotalCitizens,
    citizenGrowthProgress,
    setCitizenGrowthProgress,
    getRates,
    resetTownSystem
  };
}
