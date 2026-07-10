import { useState, useCallback, useRef, useEffect } from "react";
import {
  Resources,
  CitizenAllocation,
  ResourceRates
} from "../types";
import {
  BUILDINGS_LIST,
  DISTRICTS_LIST,
  checkBuildingUnlocked,
  getBuildingMaxLevel,
  getBuildingUpgradeCost
} from "../data/gameData";
import { calculateRates } from "../utils/gameCalculations";

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

const INITIAL_BUILDINGS: { [key: string]: number } = {
  habitation: 1,
  ferme: 0,
  scierie: 0,
  carriere: 0,
  mine: 0,
  maison_chef: 0,
  guilde: 0,
  caserne: 0,
  temple: 0,
  academie: 0,
  forge: 0
};

export function useTownSystem(
  addLog: (message: string, type?: "info" | "victory" | "defeat" | "loot" | "combat-hero" | "combat-enemy") => void,
  highestFloorReached: number,
  currentUser: any
) {
  const [resources, setResources] = useState<Resources>(INITIAL_RESOURCES);
  const [buildings, setBuildings] = useState<{ [key: string]: number }>(INITIAL_BUILDINGS);
  const [citizens, setCitizens] = useState<CitizenAllocation>(INITIAL_CITIZENS);
  const [totalCitizens, setTotalCitizens] = useState<number>(3);
  const [unlockedDistricts, setUnlockedDistricts] = useState<{ [key: string]: boolean }>({});
  const [citizenGrowthProgress, setCitizenGrowthProgress] = useState<number>(0);
  const [isMigrationPending, setIsMigrationPending] = useState<boolean>(false);
  const isMigrationPendingRef = useRef(false);

  const resourcesRef = useRef(resources);
  const buildingsRef = useRef(buildings);
  const totalCitizensRef = useRef(totalCitizens);
  const citizenGrowthProgressRef = useRef(citizenGrowthProgress);

  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => {
    buildingsRef.current = buildings;
  }, [buildings]);

  useEffect(() => {
    totalCitizensRef.current = totalCitizens;
  }, [totalCitizens]);

  useEffect(() => {
    citizenGrowthProgressRef.current = citizenGrowthProgress;
  }, [citizenGrowthProgress]);

  const triggerCitizenMigration = useCallback(() => {
    // Before generating a new migrating citizen, the system must check if another migration is already pending or being processed.
    if (isMigrationPending || isMigrationPendingRef.current) {
      return false; // If a migration already exists, no new citizen must be generated.
    }

    const maxBeds = (buildingsRef.current["habitation"] || 0) * 3;
    if (totalCitizensRef.current >= maxBeds) {
      return false;
    }

    // Set migration as pending/processing
    setIsMigrationPending(true);
    isMigrationPendingRef.current = true;

    // Complete the migration: add exactly one citizen
    setTotalCitizens((tot) => tot + 1);
    setCitizens((cz) => ({ ...cz, unassigned: cz.unassigned + 1 }));
    addLog("🆕 IMMIGRATION : Un nouveau paysan libre rejoint les comptoirs de votre colonie !", "info");

    // Fully completed and cleared with a small timeout to let the state transition complete and flush, preventing double triggers!
    setTimeout(() => {
      setIsMigrationPending(false);
      isMigrationPendingRef.current = false;
    }, 100);

    return true;
  }, [isMigrationPending, addLog]);

  const performImmigrationTick = useCallback(() => {
    const maxBeds = (buildingsRef.current["habitation"] || 0) * 3;
    if (totalCitizensRef.current < maxBeds) {
      if (resourcesRef.current.food >= 1) {
        // 1. Consume food
        setResources((prev) => ({ ...prev, food: prev.food - 1 }));

        // 2. Calculate next progress outside state updater!
        const currentProg = citizenGrowthProgressRef.current;
        const nextProg = currentProg + 5;
        
        if (nextProg >= 100) {
          if (isMigrationPendingRef.current) {
            setCitizenGrowthProgress(100); // Hold at 100%
          } else {
            // Trigger the migration safely and synchronously here!
            triggerCitizenMigration();
            setCitizenGrowthProgress(0);
          }
        } else {
          setCitizenGrowthProgress(nextProg);
        }
      }
    } else {
      setCitizenGrowthProgress(0); // beds filled
    }
  }, [triggerCitizenMigration]);

  const getRates = useCallback((): ResourceRates => {
    return calculateRates(citizens, buildings, unlockedDistricts, !!currentUser);
  }, [citizens, buildings, unlockedDistricts, currentUser]);

  const handleUpgradeBuilding = useCallback((buildingId: string) => {
    if (!checkBuildingUnlocked(buildingId, buildings, highestFloorReached)) {
      addLog(`❌ Ce bâtiment est verrouillé par votre progression de cité et de donjon.`, "defeat");
      return;
    }

    const building = BUILDINGS_LIST.find((b) => b.id === buildingId)!;
    const currentLvl = buildings[buildingId] || 0;
    const maxLvl = getBuildingMaxLevel(buildingId);

    if (currentLvl >= maxLvl) {
      addLog(`❌ Le bâtiment ${building.name} a déjà atteint son niveau maximum de ${maxLvl}.`, "defeat");
      return;
    }

    const cost = getBuildingUpgradeCost(buildingId, currentLvl);

    const affordable =
      resources.gold >= cost.gold &&
      resources.food >= cost.food &&
      resources.wood >= cost.wood &&
      resources.stone >= cost.stone &&
      resources.ore >= cost.ore;

    if (!affordable) {
      addLog(`❌ Ressources insuffisantes pour perfectionner le bâtiment : ${building.name}`, "defeat");
      return;
    }

    setResources((prev) => ({
      gold: prev.gold - cost.gold,
      food: prev.food - cost.food,
      wood: prev.wood - cost.wood,
      stone: prev.stone - cost.stone,
      ore: prev.ore - cost.ore
    }));

    setBuildings((prev) => ({
      ...prev,
      [buildingId]: currentLvl + 1
    }));

    addLog(`🏢 CHANTIER : '${building.name}' passe au Niveau ${currentLvl + 1} ! Les retours et capacités augmentent de concert.`, "victory");
  }, [buildings, highestFloorReached, resources, addLog]);

  const handleAllocateCitizen = useCallback((job: keyof Omit<CitizenAllocation, "unassigned">, amount: number) => {
    const jobToBuildingMap: { [key: string]: string } = {
      farmers: "ferme",
      woodcutters: "scierie",
      quarrymen: "carriere",
      miners: "mine"
    };

    const targetBuildingId = jobToBuildingMap[job];
    if (amount > 0 && targetBuildingId && (buildings[targetBuildingId] || 0) < 1) {
      addLog(`❌ Vous devez construire et posséder au moins le Niveau 1 d'infrastructure requis avant d'attribuer ce travail.`, "defeat");
      return;
    }

    setCitizens((cz) => {
      const currentJobCount = cz[job] || 0;
      const nextJobCount = currentJobCount + amount;

      if (amount > 0 && cz.unassigned <= 0) return cz;
      if (amount < 0 && currentJobCount <= 0) return cz;

      return {
        ...cz,
        [job]: nextJobCount,
        unassigned: cz.unassigned - amount
      };
    });
  }, [buildings, addLog]);

  const handleUnlockDistrict = useCallback((districtId: string) => {
    const district = DISTRICTS_LIST.find((d) => d.id === districtId)!;
    const affordable =
      resources.gold >= district.cost.gold &&
      resources.food >= district.cost.food &&
      resources.wood >= district.cost.wood &&
      resources.stone >= district.cost.stone &&
      resources.ore >= district.cost.ore;

    if (unlockedDistricts[districtId]) return;

    if (!affordable) {
      addLog(`❌ Ressources insuffisantes pour acheter la spécialisation : ${district.name}`, "defeat");
      return;
    }

    setResources((prev) => ({
      gold: prev.gold - district.cost.gold,
      food: prev.food - district.cost.food,
      wood: prev.wood - district.cost.wood,
      stone: prev.stone - district.cost.stone,
      ore: prev.ore - district.cost.ore
    }));

    setUnlockedDistricts((prev) => ({
      ...prev,
      [districtId]: true
    }));

    addLog(`🗺️ EXPANSION : Vous avez inauguré le '${district.name}' ! Multiplicateurs de travail passifs activés.`, "victory");
  }, [resources, unlockedDistricts, addLog]);

  const resetTownSystem = useCallback(() => {
    setResources({ gold: 75, food: 50, wood: 20, stone: 0, ore: 0 });
    setBuildings(INITIAL_BUILDINGS);
    setCitizens(INITIAL_CITIZENS);
    setTotalCitizens(3);
    setUnlockedDistricts({});
    setCitizenGrowthProgress(0);
    setIsMigrationPending(false);
    isMigrationPendingRef.current = false;
  }, [INITIAL_CITIZENS, INITIAL_BUILDINGS]);

  return {
    resources,
    setResources,
    buildings,
    setBuildings,
    citizens,
    setCitizens,
    totalCitizens,
    setTotalCitizens,
    unlockedDistricts,
    setUnlockedDistricts,
    citizenGrowthProgress,
    setCitizenGrowthProgress,
    isMigrationPending,
    setIsMigrationPending,
    triggerCitizenMigration,
    performImmigrationTick,
    getRates,
    handleUpgradeBuilding,
    handleAllocateCitizen,
    handleUnlockDistrict,
    resetTownSystem,
    INITIAL_CITIZENS
  };
}
