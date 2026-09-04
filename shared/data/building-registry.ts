import type { Building, Resources } from "../contracts/game.ts";
import { FORGE_PROGRESSION_LEVELS } from "./forge-progression.ts";

export interface UnlockRequirement {
  requiredBuildings?: Record<string, number>;
  requiredFloor?: number;
  desc: string;
}

export type BuildingDefinition = Omit<Building, "level"> & {
  maxLevel: number;
  upgradeCosts: readonly Resources[];
  requirementsByTargetLevel: Readonly<Record<number, UnlockRequirement>>;
};

const available: UnlockRequirement = { desc: "Disponible dès le départ." };
const vocationRequirement: UnlockRequirement = {
  requiredBuildings: { guilde: 1, mine: 1 },
  requiredFloor: 3,
  desc: "Campement Niv. 1, Mine Niv. 1 et Étage atteint 3",
};

function defineBuilding(
  building: Omit<Building, "level">,
  upgradeCosts: readonly Resources[],
  requirement: UnlockRequirement,
  requirementForTarget?: (targetLevel: number) => UnlockRequirement,
): BuildingDefinition {
  return {
    ...building,
    maxLevel: upgradeCosts.length,
    upgradeCosts,
    requirementsByTargetLevel: Object.fromEntries(upgradeCosts.map((_, index) => {
      const targetLevel = index + 1;
      return [targetLevel, requirementForTarget?.(targetLevel) ?? requirement];
    })),
  };
}

const BUILDING_DEFINITIONS: readonly BuildingDefinition[] = [
  defineBuilding({
    id: "habitation", name: "Cabane",
    description: "Augmente la population maximale de la colonie de +3 par niveau.",
    category: "housing", icon: "Home", bonusPerLevel: 3,
  }, [
    { gold: 15, food: 10, wood: 0, stone: 0, ore: 0 },
    { gold: 25, food: 15, wood: 0, stone: 0, ore: 0 },
    { gold: 45, food: 30, wood: 0, stone: 0, ore: 0 },
    { gold: 75, food: 50, wood: 0, stone: 0, ore: 0 },
    { gold: 125, food: 85, wood: 0, stone: 0, ore: 0 },
    { gold: 215, food: 145, wood: 90, stone: 0, ore: 0 },
    { gold: 365, food: 245, wood: 155, stone: 0, ore: 0 },
    { gold: 620, food: 415, wood: 260, stone: 0, ore: 0 },
    { gold: 1050, food: 700, wood: 440, stone: 110, ore: 0 },
    { gold: 1790, food: 1195, wood: 750, stone: 260, ore: 50 },
  ], available),
  defineBuilding({
    id: "ferme", name: "Ferme",
    description: "Construit la ferme. Permet d'assigner des habitants pour produire de la nourriture.",
    category: "production", icon: "Grape",
  }, [
    { gold: 10, food: 10, wood: 0, stone: 0, ore: 0 },
    { gold: 20, food: 20, wood: 0, stone: 0, ore: 0 },
    { gold: 40, food: 30, wood: 0, stone: 0, ore: 0 },
    { gold: 80, food: 60, wood: 0, stone: 0, ore: 0 },
    { gold: 160, food: 105, wood: 70, stone: 0, ore: 0 },
    { gold: 320, food: 190, wood: 105, stone: 0, ore: 0 },
    { gold: 640, food: 340, wood: 160, stone: 0, ore: 0 },
    { gold: 1280, food: 610, wood: 235, stone: 0, ore: 0 },
    { gold: 2560, food: 1100, wood: 355, stone: 75, ore: 0 },
    { gold: 5120, food: 1985, wood: 535, stone: 150, ore: 55 },
  ], available),
  defineBuilding({
    id: "scierie", name: "Maison de bûcheron",
    description: "Construit le camp de Bûcheron. Permet d'assigner des habitants pour produire du bois.",
    category: "production", icon: "Trees",
  }, [
    { gold: 15, food: 10, wood: 20, stone: 0, ore: 0 },
    { gold: 25, food: 15, wood: 40, stone: 0, ore: 0 },
    { gold: 45, food: 25, wood: 70, stone: 0, ore: 0 },
    { gold: 75, food: 40, wood: 135, stone: 0, ore: 0 },
    { gold: 125, food: 65, wood: 260, stone: 55, ore: 0 },
    { gold: 215, food: 105, wood: 495, stone: 90, ore: 0 },
    { gold: 360, food: 170, wood: 940, stone: 140, ore: 105 },
    { gold: 615, food: 270, wood: 1790, stone: 225, ore: 220 },
    { gold: 1045, food: 430, wood: 3395, stone: 360, ore: 465 },
    { gold: 1780, food: 685, wood: 6455, stone: 575, ore: 970 },
  ], { requiredBuildings: { habitation: 1, ferme: 1 }, desc: "Cabane Niv. 1 et Ferme Niv. 1" }),
  defineBuilding({
    id: "carriere", name: "Carrière",
    description: "Construit la carrière. Permet d'assigner des habitants pour produire de la pierre.",
    category: "production", icon: "Hammer",
  }, [
    { gold: 20, food: 10, wood: 30, stone: 0, ore: 0 },
    { gold: 35, food: 15, wood: 50, stone: 0, ore: 0 },
    { gold: 60, food: 25, wood: 80, stone: 70, ore: 0 },
    { gold: 100, food: 35, wood: 135, stone: 130, ore: 0 },
    { gold: 165, food: 60, wood: 220, stone: 240, ore: 0 },
    { gold: 285, food: 90, wood: 365, stone: 445, ore: 0 },
    { gold: 485, food: 140, wood: 605, stone: 820, ore: 155 },
    { gold: 820, food: 215, wood: 1000, stone: 1515, ore: 355 },
    { gold: 1395, food: 335, wood: 1650, stone: 2805, ore: 735 },
    { gold: 2370, food: 515, wood: 2720, stone: 5190, ore: 1240 },
  ], { requiredBuildings: { scierie: 1 }, desc: "Maison de bûcheron Niv. 1" }),
  defineBuilding({
    id: "mine", name: "Mine",
    description: "Construit la mine. Permet d'assigner des habitants pour extraire du minerai.",
    category: "production", icon: "Pickaxe",
  }, [
    { gold: 50, food: 20, wood: 60, stone: 65, ore: 0 },
    { gold: 85, food: 30, wood: 105, stone: 105, ore: 95 },
    { gold: 145, food: 50, wood: 185, stone: 165, ore: 180 },
    { gold: 245, food: 80, wood: 320, stone: 265, ore: 345 },
    { gold: 420, food: 130, wood: 565, stone: 425, ore: 650 },
    { gold: 710, food: 210, wood: 985, stone: 680, ore: 1240 },
    { gold: 1205, food: 335, wood: 1725, stone: 1090, ore: 2350 },
    { gold: 2050, food: 535, wood: 3015, stone: 1745, ore: 4470 },
    { gold: 3490, food: 860, wood: 5275, stone: 2790, ore: 8490 },
    { gold: 5930, food: 1375, wood: 9235, stone: 4465, ore: 16135 },
  ], { requiredBuildings: { carriere: 1 }, requiredFloor: 2, desc: "Carrière Niv. 1 et Étage atteint 2" }),
  defineBuilding({
    id: "maison_chef", name: "Maison du chef",
    description: "Centre névralgique de votre colonie. Augmente la production globale de toutes les ressources de 3% par niveau.",
    category: "social", icon: "Store", bonusPerLevel: 0.03,
  }, [
    { gold: 50, food: 35, wood: 80, stone: 60, ore: 20 },
    { gold: 135, food: 100, wood: 210, stone: 160, ore: 60 },
    { gold: 365, food: 295, wood: 540, stone: 420, ore: 180 },
    { gold: 985, food: 855, wood: 1405, stone: 1115, ore: 540 },
    { gold: 2655, food: 2475, wood: 3655, stone: 2960, ore: 1620 },
  ], { requiredBuildings: { guilde: 1 }, desc: "Campement Niv. 1" }),
  defineBuilding({
    id: "guilde", name: "Campement",
    description: "Débloque le recrutement et ajoute 1 emplacement de héros par niveau, en plus des 2 emplacements initiaux.",
    category: "social", icon: "ShieldAlert", bonusPerLevel: 1,
  }, [
    { gold: 200, food: 100, wood: 250, stone: 150, ore: 50 },
    { gold: 540, food: 290, wood: 650, stone: 400, ore: 150 },
    { gold: 1460, food: 840, wood: 1690, stone: 1055, ore: 450 },
    { gold: 3935, food: 2440, wood: 4395, stone: 2790, ore: 1350 },
    { gold: 10630, food: 7075, wood: 11425, stone: 7400, ore: 4050 },
  ], { requiredBuildings: { carriere: 1 }, desc: "Carrière Niv. 1" }),
  defineBuilding({ id: "temple", name: "Église", description: "Permet au novice de choisir une carrière d'Acolyte.", category: "military", icon: "Heart" }, [
    { gold: 350, food: 250, wood: 180, stone: 220, ore: 80 },
  ], vocationRequirement),
  defineBuilding({ id: "caserne", name: "Caserne", description: "Permet au novice de choisir une carrière de Guerrier ou de Pugiliste.", category: "military", icon: "Swords" }, [
    { gold: 400, food: 200, wood: 180, stone: 120, ore: 80 },
  ], vocationRequirement),
  defineBuilding({ id: "poste_chasse", name: "Poste de chasse", description: "Permet au novice de choisir une carrière d'Archer.", category: "military", icon: "Target" }, [
    { gold: 300, food: 250, wood: 300, stone: 100, ore: 50 },
  ], vocationRequirement),
  defineBuilding({ id: "academie", name: "Atelier d'arcane", description: "Permet au novice de choisir une carrière de Mage ou d'Aède.", category: "military", icon: "BookOpen" }, [
    { gold: 450, food: 250, wood: 300, stone: 280, ore: 180 },
  ], vocationRequirement),
  defineBuilding({ id: "cercle", name: "Cercle druidique", description: "Permet au novice de choisir une carrière de Druide.", category: "military", icon: "Leaf" }, [
    { gold: 450, food: 350, wood: 400, stone: 200, ore: 80 },
  ], vocationRequirement),
  defineBuilding({ id: "lair", name: "Repaire discret", description: "Permet au novice de choisir une carrière de Voleur.", category: "military", icon: "EyeOff" }, [
    { gold: 350, food: 220, wood: 260, stone: 140, ore: 80 },
  ], vocationRequirement),
  defineBuilding({
    id: "forge", name: "Forge rustique",
    description: "Débloque la forge et la fabrication d'équipements pour vos champions. Permet au novice de choisir une carrière d'Artificier.",
    category: "production", icon: "Flame",
  }, FORGE_PROGRESSION_LEVELS.map((entry) => entry.upgradeCost), vocationRequirement, (targetLevel) => {
    const progression = FORGE_PROGRESSION_LEVELS[targetLevel - 1]!;
    return targetLevel === 1
      ? vocationRequirement
      : { requiredFloor: progression.requiredFloor, desc: `Étage atteint ${progression.requiredFloor}` };
  }),
];

export const BUILDING_REGISTRY: Readonly<Record<string, BuildingDefinition>> = Object.fromEntries(
  BUILDING_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export const BUILDINGS_LIST: Omit<Building, "level">[] = BUILDING_DEFINITIONS.map((definition) => {
  const { maxLevel: _maxLevel, upgradeCosts: _upgradeCosts, requirementsByTargetLevel: _requirements, ...building } = definition;
  return building;
});

export const BUILDING_UNLOCKS: Readonly<Record<string, UnlockRequirement>> = Object.fromEntries(
  BUILDING_DEFINITIONS.map((definition) => [definition.id, definition.requirementsByTargetLevel[1]]),
);

export const createInitialBuildingLevels = (): Record<string, number> =>
  Object.fromEntries(BUILDING_DEFINITIONS.map((building) => [building.id, building.id === "habitation" ? 1 : 0]));

export const getBuildingMaxLevel = (buildingId: string): number =>
  BUILDING_REGISTRY[buildingId]?.maxLevel ?? 10;

export const getBuildingUpgradeCost = (buildingId: string, currentLevel: number): Resources => {
  const costs = BUILDING_REGISTRY[buildingId]?.upgradeCosts;
  const cost = costs?.[currentLevel] ?? costs?.at(-1);
  return cost ? { ...cost } : { gold: 0, food: 0, wood: 0, stone: 0, ore: 0 };
};

export function getBuildingUpgradeRequirement(
  buildingId: string,
  targetLevel: number,
): UnlockRequirement | undefined {
  return BUILDING_REGISTRY[buildingId]?.requirementsByTargetLevel[targetLevel];
}

export function checkBuildingUnlocked(
  buildingId: string,
  buildings: Record<string, number>,
  highestFloorReached: number,
  targetLevel = 1,
): boolean {
  const requirement = getBuildingUpgradeRequirement(buildingId, targetLevel);
  if (!requirement) return true;
  if (requirement.requiredFloor && highestFloorReached < requirement.requiredFloor) return false;
  return Object.entries(requirement.requiredBuildings ?? {})
    .every(([requiredId, requiredLevel]) => (buildings[requiredId] ?? 0) >= requiredLevel);
}
