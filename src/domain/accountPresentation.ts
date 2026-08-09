import type { BattleLogEntry, Resources } from "../types";

export interface SystemHistoryView {
  entries: BattleLogEntry[];
  emptyMessage: string;
}

export interface RealmSummaryMetricView {
  id: "buildings" | "citizens" | "heroes" | "floor";
  label: string;
  value: string;
}

export interface RealmResourceView {
  id: keyof Resources;
  label: string;
  value: number;
}

export interface RealmSummaryView {
  metrics: RealmSummaryMetricView[];
  resources: RealmResourceView[];
}

export interface CreateRealmSummaryViewInput {
  resources: Resources;
  buildings: Record<string, number>;
  totalCitizensCount: number;
  heroesCount: number;
  highestFloorReached: number;
}

export function createRealmSummaryView(input: CreateRealmSummaryViewInput): RealmSummaryView {
  const buildingLevels = Object.values(input.buildings).reduce((total, level) => total + level, 0);
  return {
    metrics: [
      { id: "buildings", label: "Bâtiments", value: `${buildingLevels} niv.` },
      { id: "citizens", label: "Citoyens", value: `${input.totalCitizensCount}` },
      { id: "heroes", label: "Aventuriers", value: `${input.heroesCount}` },
      { id: "floor", label: "Étage record", value: `${input.highestFloorReached}` },
    ],
    resources: [
      { id: "gold", label: "Or", value: input.resources.gold },
      { id: "food", label: "Nourriture", value: input.resources.food },
      { id: "wood", label: "Bois", value: input.resources.wood },
      { id: "stone", label: "Pierre", value: input.resources.stone },
      { id: "ore", label: "Minerai", value: input.resources.ore },
    ],
  };
}

export function createSystemHistoryView(logs: BattleLogEntry[]): SystemHistoryView {
  return {
    entries: [...logs].filter((entry) => entry.category === undefined).reverse(),
    emptyMessage: "Aucun événement système enregistré.",
  };
}
