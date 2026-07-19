import { describe, expect, it } from "vitest";
import { applyTownCommand, initialTownState } from "../supabase/functions/game-api/town-authority";

describe("authoritative town commands", () => {
  it("applies a building upgrade atomically", () => {
    const current = initialTownState();
    current.resources.gold = 100;
    current.resources.food = 100;
    const result = applyTownCommand(current, { type: "building.upgrade", buildingId: "ferme" });
    expect(result.state).toMatchObject({ buildings: { ferme: 1 }, resources: { gold: 90, food: 90 } });
    expect(result.events).toEqual([{ type: "building.upgraded", buildingId: "ferme", level: 1 }]);
  });

  it("rejects allocation until its profession building exists", () => {
    expect(() => applyTownCommand(initialTownState(), { type: "citizens.allocate", role: "farmers", amount: 1 })).toThrow("profession building");
  });

  it("rejects a district without enough resources and preserves the state", () => {
    const current = initialTownState();
    expect(() => applyTownCommand(current, { type: "district.unlock", districtId: "quartier_ferme" })).toThrow("insufficient resources");
    expect(current.districts).toEqual({});
  });

  it("handles authoritative hero recruitment, dismissal and activity", () => {
    const current = initialTownState();
    current.buildings.guilde = 1;
    current.resources.gold = 500;
    const recruited = applyTownCommand(current, { type: "hero.recruit", commandId: "hero-command" });
    expect(recruited.state).toMatchObject({ resources: { gold: 400 }, heroes: [{ id: "hero-hero-command", isActive: false }] });
    const dismissed = applyTownCommand(recruited.state, { type: "hero.dismiss", heroId: "hero-hero-command" });
    expect(dismissed.state).toMatchObject({ heroes: [] });
  });
});
