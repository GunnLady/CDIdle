import { describe, expect, it } from "vitest";
import type { CanonicalGameState } from "../shared/contracts/authoritative";
import {
  OPTIMISTIC_COMMAND_TYPES,
  OPTIMISTIC_PROJECTED_FIELDS,
  projectOptimisticCommands,
  type OptimisticCommandType,
  type OptimisticGameCommand,
} from "../src/domain/optimisticStateProjection";
import { applyTownCommand, initialTownState } from "../supabase/functions/game-api/town-authority";
import { refreshHeroDerivedStats } from "../src/utils/gameCalculations";
import { makeHero } from "./fixtures/game";

type ParityScenarioMap = {
  [T in OptimisticCommandType]: {
    command: Extract<OptimisticGameCommand, { type: T }>;
    state(): CanonicalGameState;
  };
};

const richResources = { gold: 10_000, food: 10_000, wood: 10_000, stone: 10_000, ore: 10_000 };
const storedSword = { instanceId: "item-parity-sword", itemId: "starter_sword", rarity: "common" as const };

const PARITY_SCENARIOS = {
  "citizens.allocate": {
    command: { type: "citizens.allocate", role: "farmers", amount: 1 },
    state: () => ({
      ...initialTownState(42),
      buildings: { ...initialTownState(42).buildings, ferme: 1 },
    }),
  },
  "building.upgrade": {
    command: { type: "building.upgrade", buildingId: "ferme", levels: 2 },
    state: () => ({ ...initialTownState(42), resources: richResources }),
  },
  "hero.activity": {
    command: { type: "hero.activity", heroId: "hero-parity", active: false },
    state: () => ({ ...initialTownState(42), heroes: [makeHero({ id: "hero-parity" })] }),
  },
  "hero.equip": {
    command: { type: "hero.equip", heroId: "hero-parity", instanceId: storedSword.instanceId },
    state: () => ({
      ...initialTownState(42),
      heroes: [makeHero({ id: "hero-parity" })],
      storedItems: [storedSword],
    }),
  },
  "hero.unequip": {
    command: { type: "hero.unequip", heroId: "hero-parity", slot: "mainHand" },
    state: () => ({
      ...initialTownState(42),
      heroes: [makeHero({
        id: "hero-parity",
        equipment: { mainHand: storedSword, offHand: null, armor: null, accessory: null },
      })],
    }),
  },
  "dungeon.select_floor": {
    command: { type: "dungeon.select_floor", floor: 2 },
    state: () => ({
      ...initialTownState(42),
      activeDungeonRoom: 4,
      highestFloorReached: 3,
      autoExplore: true,
    }),
  },
  "dungeon.auto_explore": {
    command: { type: "dungeon.auto_explore", enabled: true },
    state: () => ({
      ...initialTownState(42),
      heroes: [makeHero({ id: "hero-parity", isActive: true })],
    }),
  },
} satisfies ParityScenarioMap;

function selectFields(state: CanonicalGameState, fields: readonly (keyof CanonicalGameState)[]) {
  return Object.fromEntries(fields.map((field) => [field, state[field]]));
}

function expectEquipmentParity(state: CanonicalGameState, command: OptimisticGameCommand) {
  const optimistic = projectOptimisticCommands(state, [command]);
  const authoritative = applyTownCommand(state, command).state;
  expect(selectFields(optimistic, ["heroes", "storedItems"]))
    .toEqual(selectFields(authoritative, ["heroes", "storedItems"]));
}

describe("optimistic and authoritative parity matrix", () => {
  it("lists every projected command exactly once", () => {
    expect(Object.keys(PARITY_SCENARIOS).sort()).toEqual([...OPTIMISTIC_COMMAND_TYPES].sort());
    expect(Object.keys(OPTIMISTIC_PROJECTED_FIELDS).sort()).toEqual([...OPTIMISTIC_COMMAND_TYPES].sort());
  });

  for (const type of OPTIMISTIC_COMMAND_TYPES) {
    it(`${type} converges on its declared visible fields`, () => {
      const scenario = PARITY_SCENARIOS[type] as {
        command: OptimisticGameCommand;
        state(): CanonicalGameState;
      };
      const canonical = scenario.state();
      const optimistic = projectOptimisticCommands(canonical, [scenario.command]);
      const authoritative = applyTownCommand(canonical, scenario.command).state;
      const projectedFields = OPTIMISTIC_PROJECTED_FIELDS[type];

      expect(selectFields(optimistic, projectedFields)).toEqual(selectFields(authoritative, projectedFields));
      for (const field of Object.keys(canonical) as (keyof CanonicalGameState)[]) {
        if (!(projectedFields as readonly (keyof CanonicalGameState)[]).includes(field)) {
          expect(optimistic[field]).toBe(canonical[field]);
        }
      }
    });
  }

  it("ignores commands that are intentionally not optimistic", () => {
    const canonical = initialTownState(42);
    const projected = projectOptimisticCommands(canonical, [{ type: "hero.recruit_offer" }]);
    expect(projected).toBe(canonical);
  });

  it.each([
    { itemId: "sturdy_travel_belt" },
    { itemId: "novice_mystic_robe" },
  ] as const)("preserves the resource ratio when equipping $itemId", ({ itemId }) => {
    const baseline = refreshHeroDerivedStats(makeHero({
      id: "hero-ratio-parity",
      level: 10,
      equipment: {},
    }));
    const hero = {
      ...baseline,
      currentHp: Math.max(1, Math.floor(baseline.calculatedStats.maxHp / 2)),
      currentMana: Math.floor(baseline.calculatedStats.maxMana / 2),
    };
    const instance = { instanceId: `item-${itemId}`, itemId, rarity: "common" as const };
    const state = { ...initialTownState(42), heroes: [hero], storedItems: [instance] };

    expectEquipmentParity(state, {
      type: "hero.equip",
      heroId: hero.id,
      instanceId: instance.instanceId,
    });
  });

  it("returns the off-hand item when equipping a two-handed weapon", () => {
    const shield = { instanceId: "item-parity-shield", itemId: "wooden_shield", rarity: "common" as const };
    const greatsword = { instanceId: "item-parity-greatsword", itemId: "basic_greatsword", rarity: "common" as const };
    const hero = refreshHeroDerivedStats(makeHero({
      id: "hero-two-handed-parity",
      level: 10,
      equipment: { mainHand: null, offHand: shield, armor: null, accessory: null },
    }));
    const state = { ...initialTownState(42), heroes: [hero], storedItems: [greatsword] };

    expectEquipmentParity(state, {
      type: "hero.equip",
      heroId: hero.id,
      instanceId: greatsword.instanceId,
    });
  });

  it("keeps optimistic and authoritative occupied-slot replacement aligned", () => {
    const oldSword = { instanceId: "item-parity-old", itemId: "starter_sword", rarity: "common" as const };
    const dagger = { instanceId: "item-parity-new", itemId: "quick_dagger", rarity: "common" as const };
    const hero = refreshHeroDerivedStats(makeHero({
      id: "hero-replacement-parity",
      equipment: { mainHand: oldSword, offHand: null, armor: null, accessory: null },
    }));
    expectEquipmentParity({ ...initialTownState(42), heroes: [hero], storedItems: [dagger] }, {
      type: "hero.equip",
      heroId: hero.id,
      instanceId: dagger.instanceId,
    });
  });
});
