import { describe, expect, it } from "vitest";
import { projectOptimisticCommands } from "../src/domain/optimisticStateProjection";
import { makeHero } from "./fixtures/game";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import type { CanonicalGameState } from "../shared/contracts/authoritative";

describe("projectOptimisticCommands", () => {
  it("projects allocations and final dungeon selection without mutating canonical state", () => {
    const canonical: CanonicalGameState = {
      ...initialTownState(42),
      citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
      activeDungeonFloor: 1,
      activeDungeonRoom: 20,
      autoExplore: true,
    };
    const projected = projectOptimisticCommands(canonical, [
      { type: "citizens.allocate", role: "farmers", amount: 2 },
      { type: "dungeon.select_floor", floor: 3 },
    ]);
    expect(projected).toMatchObject({ citizens: { farmers: 2, unassigned: 1 }, activeDungeonFloor: 3, activeDungeonRoom: 1, autoExplore: false });
    expect(canonical).toMatchObject({ citizens: { farmers: 0, unassigned: 3 }, activeDungeonFloor: 1, activeDungeonRoom: 20, autoExplore: true });
  });

  it("projects building, hero, equipment and auto-dungeon mutations", () => {
    const hero = makeHero({ id: "hero-optimistic", isActive: true, status: "idle" });
    const canonical: CanonicalGameState = {
      ...initialTownState(42),
      resources: { gold: 1_000, food: 1_000, wood: 1_000, stone: 1_000, ore: 1_000 },
      buildings: { ferme: 0 },
      heroes: [hero],
      storedItems: [{ instanceId: "item-optimistic", itemId: "starter_sword", rarity: "common" }],
      autoExplore: false,
    };
    const projected = projectOptimisticCommands(canonical, [
      { type: "building.upgrade", buildingId: "ferme", levels: 2 },
      { type: "hero.activity", heroId: hero.id, active: false },
      { type: "hero.equip", heroId: hero.id, instanceId: "item-optimistic" },
      { type: "dungeon.auto_explore", enabled: true },
    ]);

    expect(projected.buildings.ferme).toBe(2);
    expect(projected.resources.gold).toBeLessThan(canonical.resources.gold);
    expect(projected.heroes[0]).toMatchObject({
      isActive: false,
      status: "resting",
      equipment: { mainHand: { instanceId: "item-optimistic", itemId: "starter_sword" } },
    });
    expect(projected.storedItems).toEqual([]);
    expect(projected.autoExplore).toBe(true);
    expect(canonical).toMatchObject({
      buildings: { ferme: 0 },
      heroes: [{ isActive: true, equipment: { mainHand: null } }],
      storedItems: [{ instanceId: "item-optimistic" }],
      autoExplore: false,
    });

    const unequipped = projectOptimisticCommands(projected, [
      { type: "hero.unequip", heroId: hero.id, slot: "mainHand" },
    ]);
    expect(unequipped.heroes[0].equipment.mainHand).toBeNull();
    expect(unequipped.storedItems).toEqual([
      expect.objectContaining({ instanceId: "item-optimistic", itemId: "starter_sword" }),
    ]);
  });

  it("projects a building paid by resources accrued since the canonical snapshot", () => {
    const canonical: CanonicalGameState = {
      ...initialTownState(42),
      resources: { gold: 390, food: 200, wood: 180, stone: 120, ore: 80 },
      buildings: { caserne: 0 },
    };

    const projected = projectOptimisticCommands(canonical, [
      { type: "building.upgrade", buildingId: "caserne" },
    ]);

    expect(projected.buildings.caserne).toBe(1);
    expect(projected.resources.gold).toBe(-10);
    expect(canonical.resources.gold).toBe(390);
  });
});
