import { Building, Resources } from "../types";

export const BUILDINGS_LIST: Omit<Building, "level">[] = [
  {
    id: "habitation",
    name: "Cabane",
    description: "Augmente la population maximale de la colonie de +3 par niveau.",
    category: "housing",
    icon: "Home",
    bonusPerLevel: 3
  },
  {
    id: "ferme",
    name: "Ferme",
    description: "Construit la ferme. Permet d'assigner des habitants pour produire de la nourriture.",
    category: "production",
    icon: "Grape"
  },
  {
    id: "scierie",
    name: "Maison de bûcheron",
    description: "Construit le camp de Bûcheron. Permet d'assigner des habitants pour produire du bois.",
    category: "production",
    icon: "Trees"
  },
  {
    id: "carriere",
    name: "Carrière",
    description: "Construit la carrière. Permet d'assigner des habitants pour produire de la pierre.",
    category: "production",
    icon: "Hammer"
  },
  {
    id: "mine",
    name: "Mine",
    description: "Construit la mine. Permet d'assigner des habitants pour extraire du minerai.",
    category: "production",
    icon: "Pickaxe"
  },
  {
    id: "maison_chef",
    name: "Maison du chef",
    description: "Centre névralgique de votre colonie. Augmente la production globale de toutes les ressources de 3% par niveau.",
    category: "social",
    icon: "Store",
    bonusPerLevel: 0.03
  },
  {
    id: "guilde",
    name: "Campement",
    description: "Débloque le recrutement et permet d'embaucher +2 champion par niveau.",
    category: "social",
    icon: "ShieldAlert",
    bonusPerLevel: 2
  },
  {
    id: "temple",
    name: "Église",
    description: "Permet au novice de choisir une carrière d'Acolyte.",
    category: "military",
    icon: "Heart"
  },
  {
    id: "caserne",
    name: "Caserne",
    description: "Permet au novice de choisir une carrière de Guerrier ou de Pugiliste.",
    category: "military",
    icon: "Swords"
  },
  {
    id: "poste_chasse",
    name: "Poste de chasse",
    description: "Permet au novice de choisir une carrière d'Archer.",
    category: "military",
    icon: "Target"
  },
  {
    id: "academie",
    name: "Atelier d'arcane",
    description: "Permet au novice de choisir une carrière de Mage ou d'Aède.",
    category: "military",
    icon: "BookOpen"
  },
  {
    id: "cercle",
    name: "Cercle druidique",
    description: "Permet au novice de choisir une carrière de Druide.",
    category: "military",
    icon: "Leaf"
  },
  {
    id: "lair",
    name: "Repaire discret",
    description: "Permet au novice de choisir une carrière de Voleur.",
    category: "military",
    icon: "EyeOff"
  },
  {
    id: "forge",
    name: "Forge rustique",
    description: "Débloque la forge et la fabrication d'équipements pour vos champions. Permet au novice de choisir une carrière d'Artificier.",
    category: "production",
    icon: "Flame"
  }
];

export const getBuildingMaxLevel = (buildingId: string): number => {
  switch (buildingId) {
    case "habitation":  // Cabane
    case "ferme":       // Ferme
    case "scierie":     // Maison de bûcheron
    case "carriere":    // Carrière
    case "mine":        // Mine
      return 10;
    case "maison_chef": // Maison du chef
    case "guilde":      // Campement (was guilde)
    return 5;
    case "guilde":      // Campement (was guilde)
    case "academie":    // Atelier d'arcane (was caserne)
    case "temple":      // Église (was temple)
    case "cercle":      // Cercle druidique (was academie)      
    case "forge":       // Forge rustique
    case "lair":
    case "caserne":
    case "poste_chasse":
      return 1;
    default:
      return 10;
  }
};

export const getBuildingUpgradeCost = (buildingId: string, currentLevel: number): Resources => {
  if (buildingId === "habitation") {
    switch (currentLevel) {
      case 0: return { gold: 15, food: 10, wood: 0, stone: 0, ore: 0 };
      case 1: return { gold: 25, food: 15, wood: 0, stone: 0, ore: 0 };
      case 2: return { gold: 45, food: 30, wood: 0, stone: 0, ore: 0 };
      case 3: return { gold: 75, food: 50, wood: 0, stone: 0, ore: 0 };
      case 4: return { gold: 125, food: 85, wood: 0, stone: 0, ore: 0 };
      case 5: return { gold: 215, food: 145, wood: 90, stone: 0, ore: 0 };
      case 6: return { gold: 365, food: 245, wood: 155, stone: 0, ore: 0 };
      case 7: return { gold: 620, food: 415, wood: 260, stone: 0, ore: 0 };
      case 8: return { gold: 1050, food: 700, wood: 440, stone: 110, ore: 0 };
      case 9: return { gold: 1790, food: 1195, wood: 750, stone: 260, ore: 50 };
      default: return { gold: 1790, food: 1195, wood: 750, stone: 260, ore: 150 };
    }
  } else if (buildingId === "ferme") {
    switch (currentLevel) {
      case 0: return { gold: 10, food: 10, wood: 0, stone: 0, ore: 0 };
      case 1: return { gold: 20, food: 20, wood: 0, stone: 0, ore: 0 };
      case 2: return { gold: 40, food: 30, wood: 0, stone: 0, ore: 0 };
      case 3: return { gold: 80, food: 60, wood: 0, stone: 0, ore: 0 };
      case 4: return { gold: 160, food: 105, wood: 70, stone: 0, ore: 0 };
      case 5: return { gold: 320, food: 190, wood: 105, stone: 0, ore: 0 };
      case 6: return { gold: 640, food: 340, wood: 160, stone: 0, ore: 0 };
      case 7: return { gold: 1280, food: 610, wood: 235, stone: 0, ore: 0 };
      case 8: return { gold: 2560, food: 1100, wood: 355, stone: 75, ore: 0 };
      case 9: return { gold: 5120, food: 1985, wood: 535, stone: 150, ore: 55 };
      default: return { gold: 5120, food: 1985, wood: 535, stone: 215, ore: 135 };
    }
  } else if (buildingId === "scierie") {
    switch (currentLevel) {
      case 0: return { gold: 15, food: 10, wood: 20, stone: 0, ore: 0 };
      case 1: return { gold: 25, food: 15, wood: 40, stone: 0, ore: 0 };
      case 2: return { gold: 45, food: 25, wood: 70, stone: 0, ore: 0 };
      case 3: return { gold: 75, food: 40, wood: 135, stone: 0, ore: 0 };
      case 4: return { gold: 125, food: 65, wood: 260, stone: 55, ore: 0 };
      case 5: return { gold: 215, food: 105, wood: 495, stone: 90, ore: 0 };
      case 6: return { gold: 360, food: 170, wood: 940, stone: 140, ore: 105 };
      case 7: return { gold: 615, food: 270, wood: 1790, stone: 225, ore: 220 };
      case 8: return { gold: 1045, food: 430, wood: 3395, stone: 360, ore: 465 };
      case 9: return { gold: 1780, food: 685, wood: 6455, stone: 575, ore: 970 };
      default: return { gold: 2370, food: 515, wood: 2720, stone: 5190, ore: 240 };
    }
  } else if (buildingId === "carriere") {
    switch (currentLevel) {
      case 0: return { gold: 20, food: 10, wood: 30, stone: 0, ore: 0 };
      case 1: return { gold: 35, food: 15, wood: 50, stone: 0, ore: 0 };
      case 2: return { gold: 60, food: 25, wood: 80, stone: 70, ore: 0 };
      case 3: return { gold: 100, food: 35, wood: 135, stone: 130, ore: 0 };
      case 4: return { gold: 165, food: 60, wood: 220, stone: 240, ore: 0 };
      case 5: return { gold: 285, food: 90, wood: 365, stone: 445, ore: 0 };
      case 6: return { gold: 485, food: 140, wood: 605, stone: 820, ore: 155 };
      case 7: return { gold: 820, food: 215, wood: 1000, stone: 1515, ore: 355 };
      case 8: return { gold: 1395, food: 335, wood: 1650, stone: 2805, ore: 735 };
      case 9: return { gold: 2370, food: 515, wood: 2720, stone: 5190, ore: 1240 };
      default: return { gold: 2370, food: 515, wood: 2720, stone: 5190, ore: 2240 };
    }
  } else if (buildingId === "mine") {
    switch (currentLevel) {
      case 0: return { gold: 50, food: 20, wood: 60, stone: 65, ore: 0 };
      case 1: return { gold: 85, food: 30, wood: 105, stone: 105, ore: 95 };
      case 2: return { gold: 145, food: 50, wood: 185, stone: 165, ore: 180 };
      case 3: return { gold: 245, food: 80, wood: 320, stone: 265, ore: 345 };
      case 4: return { gold: 420, food: 130, wood: 565, stone: 425, ore: 650 };
      case 5: return { gold: 710, food: 210, wood: 985, stone: 680, ore: 1240 };
      case 6: return { gold: 1205, food: 335, wood: 1725, stone: 1090, ore: 2350 };
      case 7: return { gold: 2050, food: 535, wood: 3015, stone: 1745, ore: 4470 };
      case 8: return { gold: 3490, food: 860, wood: 5275, stone: 2790, ore: 8490 };
      case 9: return { gold: 5930, food: 1375, wood: 9235, stone: 4465, ore: 16135 };
      default: return { gold: 5930, food: 1375, wood: 9235, stone: 4465, ore: 16135 };
    }
  } else if (buildingId === "maison_chef") {
    switch (currentLevel) {
      case 0: return { gold: 50, food: 35, wood: 80, stone: 60, ore: 20 };
      case 1: return { gold: 135, food: 100, wood: 210, stone: 160, ore: 60 };
      case 2: return { gold: 365, food: 295, wood: 540, stone: 420, ore: 180 };
      case 3: return { gold: 985, food: 855, wood: 1405, stone: 1115, ore: 540 };
      case 4: return { gold: 2655, food: 2475, wood: 3655, stone: 2960, ore: 1620 };
      default: return { gold: 2655, food: 2475, wood: 3655, stone: 2960, ore: 1620 };
    }
  } else if (buildingId === "guilde") {
    switch (currentLevel) {
      case 0: return { gold: 200, food: 100, wood: 250, stone: 150, ore: 50 };
      case 1: return { gold: 540, food: 290, wood: 650, stone: 400, ore: 150 };
      case 2: return { gold: 1460, food: 840, wood: 1690, stone: 1055, ore: 450 };
      case 3: return { gold: 3935, food: 2440, wood: 4395, stone: 2790, ore: 1350 };
      case 4: return { gold: 10630, food: 7075, wood: 11425, stone: 7400, ore: 4050 };
      default: return { gold: 10630, food: 7075, wood: 11425, stone: 7400, ore: 4050 };
    }
  } else if (buildingId === "academie") {
    switch (currentLevel) {
      default: return { gold: 1595, food: 1260, wood: 2030, stone: 2105, ore: 1800 };
    }
  } else if (buildingId === "temple") {
    switch (currentLevel) {
      default: return { gold: 1325, food: 1170, wood: 1150, stone: 1810, ore: 750  };
    }
  } else if (buildingId === "cercle") {
    switch (currentLevel) {
      default: return { gold: 1785, food: 2525, wood: 3080, stone: 1755, ore: 450 };
    }
  } else if (buildingId === "lair") {
    switch (currentLevel) {
      default: return { gold: 1345, food: 1260, wood: 2030, stone: 1805, ore: 800 };
    }
  } else if (buildingId === "caserne") {
    switch (currentLevel) {
      default: return { gold: 1275, food: 1270, wood: 1050, stone: 980, ore: 800 };
    }
  } else if (buildingId === "poste_chasse") {
    switch (currentLevel) {
      default: return { gold: 1185, food: 1435, wood: 2380, stone: 1355, ore: 450 };
    }
  } else if (buildingId === "forge") {
    switch (currentLevel) {
      default: return { gold: 2000, food: 500, wood: 2500, stone: 1500, ore: 1500 };
    }
  } 
};

export interface UnlockRequirement {
  requiredBuildings?: { [key: string]: number };
  requiredFloor?: number;
  desc: string;
}

export const BUILDING_UNLOCKS: { [key: string]: UnlockRequirement } = {
  habitation: {
    desc: "Disponible dès le départ."
  },
  maison_chef: {
    requiredBuildings: { guilde : 1},
    desc: "Campement Niv. 1"
  },
  ferme: {
    desc: "Disponible dès le départ."
  },
  scierie: {
    requiredBuildings: { habitation: 1, ferme: 1 },
    desc: "Cabane Niv. 1 et Ferme Niv. 1"
  },
  carriere: {
    requiredBuildings: { scierie: 1 },
    desc: "Maison de bûcheron Niv. 1"
  },
  guilde: {
    requiredBuildings: { carriere: 1 },
    desc: "Carrière Niv. 1"
  },
  mine: {
    requiredBuildings: { carriere: 1 },
    requiredFloor: 2,
    desc: "Carrière Niv. 1 et Étage atteint 2"
  },  
  caserne: {
    requiredBuildings: { guilde: 1, mine: 1 },
    requiredFloor: 3,
    desc: "Campement Niv. 1, Mine Niv. 1 et Étage atteint 3"
  },
  cercle: {
    requiredBuildings: { temple: 1 },
    requiredFloor: 6,
    desc: "Église Niv. 1 Étage atteint 6"
  },
  poste_chasse: {
    requiredBuildings: { caserne: 1 },
    requiredFloor: 4,
    desc: "Caserne Niv. 1 et Étage atteint 4"
  },
  lair: {
    requiredBuildings: { caserne: 1 },
    requiredFloor: 4,
    desc: "Caserne Niv. 1 et Étage atteint 4"
  },
  temple: {
    requiredBuildings: { guilde: 1 },
    requiredFloor: 5,
    desc: "Campement Niv. 1 et Étage atteint 5"
  },
  academie: {
    requiredBuildings: { temple: 1 },
    requiredFloor: 6,
    desc: "Église Niv. 1 et Étage atteint 6"
  },
  forge: {
    requiredBuildings: { guilde: 1, maison_chef: 1 },
    requiredFloor: 7,
    desc: "Campement Niv. 1, Maison du chef Niv. 1 et Étage atteint 7"
  }
};

export function checkBuildingUnlocked(
  buildingId: string,
  buildings: { [key: string]: number },
  highestFloorReached: number
): boolean {
  const req = BUILDING_UNLOCKS[buildingId];
  if (!req) return true;

  if (req.requiredFloor && highestFloorReached < req.requiredFloor) {
    return false;
  }

  if (req.requiredBuildings) {
    for (const [reqId, reqLvl] of Object.entries(req.requiredBuildings)) {
      if ((buildings[reqId] || 0) < reqLvl) {
        return false;
      }
    }
  }

  return true;
}
