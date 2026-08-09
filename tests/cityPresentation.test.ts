import { describe, expect, it } from "vitest";
import { createCityDashboardView, createCityHistoryView } from "../src/domain/cityPresentation";

const createView = (buildings: Record<string, number>) => createCityDashboardView({
  resources: { gold: 10_000, food: 10_000, wood: 10_000, stone: 10_000, ore: 10_000 },
  buildings,
  citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
  totalCitizens: 3,
  citizenGrowthProgress: 0,
  highestFloorReached: 1,
});

describe("createCityDashboardView", () => {
  it("keeps an already-built building available when its historical prerequisites are absent", () => {
    const view = createView({ habitation: 1, guilde: 2, caserne: 1, forge: 1 });

    for (const buildingId of ["guilde", "caserne", "forge"]) {
      expect(view.buildings.find((building) => building.id === buildingId)).toMatchObject({ unlocked: true });
      expect(view.buildings.find((building) => building.id === buildingId)?.prerequisite).toBeUndefined();
    }
  });

  it("projects precise building categories", () => {
    const buildings = createView({ habitation: 1 }).buildings;

    expect(buildings.find((building) => building.id === "forge")?.categoryLabel).toBe("Production");
    expect(buildings.find((building) => building.id === "guilde")?.categoryLabel).toBe("Communauté");
    expect(buildings.find((building) => building.id === "caserne")?.categoryLabel).toBe("Vocation");
  });

  it("derives assignment availability without mutating canonical inputs", () => {
    const buildings = { habitation: 1, ferme: 1 };
    const view = createView(buildings);

    expect(view.jobs.find((job) => job.id === "farmers")).toMatchObject({ canAdd: true, canRemove: false });
    expect(buildings).toEqual({ habitation: 1, ferme: 1 });
  });
});

describe("createCityHistoryView", () => {
  it("keeps only colony actions and displays the newest one first", () => {
    const view = createCityHistoryView([
      { id: "colony-old", timestamp: "10:00", message: "Ferme améliorée", type: "info", category: "colony" },
      { id: "dungeon", timestamp: "10:01", message: "Combat gagné", type: "victory", category: "dungeon" },
      { id: "colony-new", timestamp: "10:02", message: "Citoyen affecté", type: "info", category: "colony" },
    ]);

    expect(view.entries.map((entry) => entry.id)).toEqual(["colony-new", "colony-old"]);
  });
});
