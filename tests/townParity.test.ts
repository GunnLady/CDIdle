import { describe, expect, it } from "vitest";
import {
  applyTownCommand,
  initialTownState,
  migrateTownState,
} from "../supabase/functions/game-api/town-authority";
import { applyIdleAuthority } from "../supabase/functions/game-api/idle-authority";
import {
  BUILDINGS_LIST,
  BUILDING_UNLOCKS,
  getBuildingMaxLevel,
  getBuildingUpgradeCost,
} from "../src/data/buildings";
import { validateAuthoritativeTownState } from "../src/domain/authoritativeTownValidation";
import { makeHero } from "./fixtures/game";

const richState = () => {
  const state = initialTownState();
  state.resources = { gold: 1e9, food: 1e9, wood: 1e9, stone: 1e9, ore: 1e9 };
  state.highestFloorReached = 100;
  return state;
};

describe("authoritative town parity", () => {
  it("uses the shared catalog cost and maximum for every building level", () => {
    for (const building of BUILDINGS_LIST) {
      const maxLevel = getBuildingMaxLevel(building.id);
      for (let level = 0; level < maxLevel; level += 1) {
        const current = richState();
        current.buildings[building.id] = level;
        if (building.id === "habitation" && level === 0) {
          current.totalCitizensCount = 0;
          current.citizens = { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 0 };
        }
        for (const [required, requiredLevel] of Object.entries(BUILDING_UNLOCKS[building.id]?.requiredBuildings ?? {})) {
          current.buildings[required] = requiredLevel;
        }
        const before = { ...current.resources };
        const cost = getBuildingUpgradeCost(building.id, level);
        const result = applyTownCommand(current, { type: "building.upgrade", buildingId: building.id });
        expect((result.state.buildings as Record<string, number>)[building.id]).toBe(level + 1);
        for (const resource of ["gold", "food", "wood", "stone", "ore"] as const) {
          expect(result.state.resources[resource]).toBe(before[resource] - cost[resource]);
        }
      }
      const maximum = richState();
      maximum.buildings[building.id] = maxLevel;
      expect(() => applyTownCommand(maximum, { type: "building.upgrade", buildingId: building.id })).toThrow("maximum level");
    }
  });

  it("enforces every dungeon floor prerequisite on the server", () => {
    for (const [buildingId, requirement] of Object.entries(BUILDING_UNLOCKS)) {
      if (!requirement.requiredFloor) continue;
      const current = richState();
      current.highestFloorReached = requirement.requiredFloor - 1;
      for (const [required, requiredLevel] of Object.entries(requirement.requiredBuildings ?? {})) {
        current.buildings[required] = requiredLevel;
      }
      expect(() => applyTownCommand(current, { type: "building.upgrade", buildingId })).toThrow("dungeon floor prerequisite");
      current.highestFloorReached = requirement.requiredFloor;
      expect(applyTownCommand(current, { type: "building.upgrade", buildingId }).state.buildings).toMatchObject({ [buildingId]: 1 });
    }
  });

  it("rejects the unassigned pseudo-role and preserves citizen totals", () => {
    const current = initialTownState();
    const before = structuredClone(current);
    expect(() => applyTownCommand(current, {
      type: "citizens.allocate",
      role: "unassigned",
      amount: -1,
    } as never)).toThrow("invalid citizen allocation");
    expect(current).toEqual(before);

    const requirements = { farmers: "ferme", woodcutters: "scierie", quarrymen: "carriere", miners: "mine" } as const;
    for (const [role, buildingId] of Object.entries(requirements)) {
      const state = initialTownState();
      state.buildings[buildingId] = 1;
      const allocated = applyTownCommand(state, { type: "citizens.allocate", role: role as keyof typeof requirements, amount: 1 });
      const citizens = allocated.state.citizens;
      expect(Object.values(citizens).reduce((sum, value) => sum + value, 0)).toBe(3);
      const removed = applyTownCommand(allocated.state, { type: "citizens.allocate", role: role as keyof typeof requirements, amount: -1 });
      expect(removed.state.citizens).toEqual(state.citizens);
    }
  });

  it("rejects malformed town state before any transition", () => {
    const invalid = initialTownState();
    invalid.citizens.unassigned = 4;
    expect(validateAuthoritativeTownState(invalid as unknown as Record<string, unknown>)).toContain("citizen allocations must equal totalCitizensCount");
    expect(() => applyTownCommand(invalid, { type: "building.upgrade", buildingId: "ferme" })).toThrow("canonical game state is invalid");

    const overCapacity = initialTownState();
    overCapacity.totalCitizensCount = 4;
    overCapacity.citizens.unassigned = 4;
    expect(validateAuthoritativeTownState(overCapacity as unknown as Record<string, unknown>)).toContain("totalCitizensCount must not exceed habitation capacity");

    const invalidProgress = initialTownState();
    invalidProgress.citizenGrowthProgress = 100;
    expect(validateAuthoritativeTownState(invalidProgress as unknown as Record<string, unknown>)).toContain("citizenGrowthProgress must be an integer between 0 and 99");

    const unknownResource = initialTownState() as unknown as Record<string, unknown>;
    unknownResource.resources = { ...(unknownResource.resources as Record<string, number>), gems: 10 };
    expect(validateAuthoritativeTownState(unknownResource)).toContain("resources.gems is not a canonical resource");
  });

  it("enforces two base hero slots plus one per Camp level", () => {
    for (let guildLevel = 1; guildLevel <= 5; guildLevel += 1) {
      const current = richState();
      current.buildings.guilde = guildLevel;
      current.heroes = Array.from(
        { length: guildLevel + 2 },
        (_, index) => makeHero({ id: `hero-${index}` }),
      );
      expect(() => applyTownCommand(current, { type: "hero.recruit_offer", commandId: `offer-${guildLevel}` })).toThrow("hero capacity reached");
    }
  });

  it("fills missing legacy map entries without hiding malformed values", () => {
    const legacy = initialTownState();
    legacy.buildings = { habitation: 1 };
    legacy.resources = { gold: 75 } as typeof legacy.resources;
    legacy.citizens = { unassigned: 3 } as typeof legacy.citizens;
    const migrated = migrateTownState(legacy as unknown as Record<string, unknown>);
    expect(migrated.buildings).toMatchObject({ habitation: 1, ferme: 0, forge: 0 });
    expect(migrated.resources).toEqual({ gold: 75, food: 50, wood: 20, stone: 0, ore: 0 });
    expect(migrated.citizens).toEqual({ farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 });

    expect(() => migrateTownState({ ...initialTownState(), resources: "broken" })).toThrow("resources must be an object");
  });

  it("keeps persisted districts inert and rejects new unlocks", () => {
    const current = richState();
    current.districts = { quartier_foret: true, quartier_carriere: true, quartier_ferme: true, quartier_mine: true };
    expect(() => applyTownCommand(current, { type: "district.unlock", districtId: "quartier_ferme" })).toThrow("districts are disabled");

    const idleBase = {
      ...current,
      citizens: { farmers: 1, woodcutters: 1, quarrymen: 1, miners: 1, unassigned: 0 },
      totalCitizensCount: 4,
      buildings: { ...current.buildings, habitation: 2, ferme: 1, scierie: 1, carriere: 1, mine: 1, maison_chef: 0 },
      resources: { gold: 0, food: 100, wood: 0, stone: 0, ore: 0 },
    };
    const withDistricts = applyIdleAuthority(idleBase, "2026-07-25T00:00:00.000Z", new Date("2026-07-25T00:00:01.000Z"));
    const noDistricts = applyIdleAuthority({ ...idleBase, districts: {} }, "2026-07-25T00:00:00.000Z", new Date("2026-07-25T00:00:01.000Z"));
    expect(withDistricts.report.resourcesProduced).toEqual(noDistricts.report.resourcesProduced);
  });
});
