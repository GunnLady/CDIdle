import { describe, expect, it } from "vitest";
import { createRealmSummaryView, createSystemHistoryView } from "../src/domain/accountPresentation";

describe("createSystemHistoryView", () => {
  it("keeps only system entries and displays the newest one first", () => {
    const view = createSystemHistoryView([
      { id: "system-old", timestamp: "10:00", message: "Connexion", type: "info" },
      { id: "dungeon", timestamp: "10:01", message: "Combat", type: "victory", category: "dungeon" },
      { id: "system-new", timestamp: "10:02", message: "Synchronisation", type: "info" },
      { id: "colony", timestamp: "10:03", message: "Production", type: "info", category: "colony" },
    ]);

    expect(view.entries.map((entry) => entry.id)).toEqual(["system-new", "system-old"]);
  });
});

describe("createRealmSummaryView", () => {
  it("projects kingdom totals without making the page recompute them", () => {
    const view = createRealmSummaryView({
      resources: { gold: 12000, food: 80, wood: 40, stone: 20, ore: 5 },
      buildings: { farm: 2, sawmill: 3 },
      totalCitizensCount: 12,
      heroesCount: 4,
      highestFloorReached: 8,
    });

    expect(view.metrics.map((metric) => metric.value)).toEqual(["5 niv.", "12", "4", "8"]);
    expect(view.resources.map((resource) => resource.id)).toEqual(["gold", "food", "wood", "stone", "ore"]);
  });
});
