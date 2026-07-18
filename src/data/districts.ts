import { District } from "../types";

export const DISTRICTS_LIST: District[] = [
  {
    id: "quartier_foret",
    name: "Quartier des Sylves",
    description: "Une expansion vers la forêt dense. Augmente le taux de production naturelle de Bois de +25%.",
    cost: { gold: 500, food: 100, wood: 600, stone: 300, ore: 50 },
    isUnlocked: false,
    boostType: "wood",
    boostValue: 0.25
  },
  {
    id: "quartier_carriere",
    name: "Grandes Carrières",
    description: "Installe des échafaudages miniers imposants. Augmente la production de Pierre de +25%.",
    cost: { gold: 600, food: 150, wood: 400, stone: 700, ore: 150 },
    isUnlocked: false,
    boostType: "stone",
    boostValue: 0.25
  },
  {
    id: "quartier_ferme",
    name: "Plaines Agricoles",
    description: "Irrigue les terres proches avec un réseau de canaux. Augmente la production de Nourriture de +25%.",
    cost: { gold: 700, food: 500, wood: 500, stone: 500, ore: 100 },
    isUnlocked: false,
    boostType: "food",
    boostValue: 0.25
  },
  {
    id: "quartier_mine",
    name: "Fonderie Royale",
    description: "Optimise les forges et affineurs. Augmente la production de Minerai de Fer de +20%.",
    cost: { gold: 1000, food: 200, wood: 800, stone: 800, ore: 500 },
    isUnlocked: false,
    boostType: "ore",
    boostValue: 0.2
  }
];
