import { describe, expect, it } from "vitest";
import { CANONICAL_COMMAND_TYPES, validateCanonicalCommandEnvelope, validateCanonicalGameState } from "../shared/contracts/authoritative";
import { validateAuthoritativeHero } from "../src/domain/authoritativeHeroValidation";
import { makeHero } from "./fixtures/game";

const validEnvelope = {
  commandId: "11111111-1111-4111-8111-111111111111",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
  clientVersion: "cdi-052",
  expectedRevision: 0,
  command: { type: "building.upgrade", buildingId: "habitation" },
};

describe("authoritative shared contracts", () => {
  it("accepts the canonical command envelope", () => {
    expect(validateCanonicalCommandEnvelope(validEnvelope)).toEqual([]);
  });

  it("rejects missing metadata and renamed fields", () => {
    const errors = validateCanonicalCommandEnvelope({
      commandId: validEnvelope.commandId,
      idempotencyKey: validEnvelope.idempotencyKey,
      expectedRevision: 0,
      command: { type: "building.upgrade", building: "habitation" },
    });
    expect(errors).toEqual(expect.arrayContaining(["clientVersion is required"]));
  });

  it("rejects unsupported command types", () => {
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "building.upgrade_local" } })).toContain("unsupported command type");
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "inventory.add", itemId: "starter_sword", rarity: "legendary", count: 1 } })).toContain("unsupported command type");
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "inventory.remove", itemId: "starter_sword", rarity: "common", count: 1 } })).toContain("unsupported command type");
  });

  it("bounds condensed building upgrades", () => {
    expect(validateCanonicalCommandEnvelope({
      ...validEnvelope,
      command: { type: "building.upgrade", buildingId: "ferme", levels: 5 },
    })).toEqual([]);
    expect(validateCanonicalCommandEnvelope({
      ...validEnvelope,
      command: { type: "building.upgrade", buildingId: "ferme", levels: 6 },
    })).toContain("command.levels must be an integer between 1 and 5");
  });

  it("strictly validates forge and inventory payloads", () => {
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "inventory.recycle", itemId: "starter_sword", rarity: "mythic" } })).toEqual(expect.arrayContaining(["command contains unsupported fields", "command.instanceId is required"]));
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "inventory.recycle", instanceId: "item-1" } })).toEqual([]);
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "hero.equip", heroId: "hero-1", instanceId: "item-1" } })).toEqual([]);
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "forge.finalize", previewId: "preview", accepted: false } })).toContain("command contains unsupported fields");
    expect(validateCanonicalCommandEnvelope({ ...validEnvelope, command: { type: "forge.finalize", previewId: "preview", acceptUpgrade: true } })).toContain("command.chosenModifierStat is required for an upgrade");
  });

  it("keeps the authoritative command registry unique and complete", () => {
    expect(new Set(CANONICAL_COMMAND_TYPES).size).toBe(CANONICAL_COMMAND_TYPES.length);
    expect(CANONICAL_COMMAND_TYPES).toEqual(expect.arrayContaining([
      "onboarding.offer", "onboarding.start",
      "hero.recruit_offer",
      "forge.finalize",
      "dungeon.select_floor",
      "cheat.grant_resources",
    ]));
  });

  it("requires canonical state fields and names", () => {
    const errors = validateCanonicalGameState({ totalCitizens: 3, unlockedDistricts: {} });
    expect(errors).toEqual(expect.arrayContaining(["totalCitizensCount is required", "districts is required", "forgeMaterials is required", "itemBlueprints is required", "encounterHistory is required", "rngState is required"]));
  });

  it("validates persisted item, material, blueprint and forge preview shapes", () => {
    const errors = validateCanonicalGameState({
      resources: {}, buildings: {}, citizens: {}, districts: {}, heroes: [], encounterHistory: [],
      storedItems: [{ itemId: "starter_sword", rarity: "mythic", count: 0, modifiers: [{ stat: "speed", value: Number.NaN }] }],
      forgeMaterials: [{ materialId: "metal_scrap", rarity: "common", count: -1 }],
      itemBlueprints: [{ itemId: "starter_sword", unlocked: "yes" }],
      pendingForge: { previewId: "preview", recipeId: "starter_sword", itemId: "starter_sword", itemType: "trinket", upgradeProc: "forced" },
      totalCitizensCount: 3, activeDungeonFloor: 1, activeDungeonRoom: 1,
      highestFloorReached: 1, citizenGrowthProgress: 0, autoExplore: false,
      currentEncounter: null,
      rngState: { algorithm: "xorshift32", version: 1, seed: 42, state: 42, draws: 0 },
    });
    expect(errors).toEqual(expect.arrayContaining([
      "storedItems[0] contains unsupported fields",
      "storedItems[0].instanceId is required",
      "storedItems[0].rarity is invalid",
      "storedItems[0].modifiers[0].value must be finite",
      "forgeMaterials[0].count must be a positive integer",
      "itemBlueprints[0].unlocked must be a boolean",
      "pendingForge.itemType is invalid",
      "pendingForge.upgradeProc is invalid",
    ]));
  });

  it("rejects duplicate item instances across storage and hero equipment", () => {
    const hero = makeHero({
      equipment: {
        mainHand: { instanceId: "item-duplicate", itemId: "starter_sword", rarity: "common" },
        offHand: null,
        armor: null,
        accessory: null,
      },
    });
    const errors = validateCanonicalGameState({
      resources: {}, buildings: {}, citizens: {}, districts: {}, heroes: [hero],
      storedItems: [{ instanceId: "item-duplicate", itemId: "starter_sword", rarity: "common" }],
      forgeMaterials: [], itemBlueprints: [], encounterHistory: [],
      totalCitizensCount: 3, activeDungeonFloor: 1, activeDungeonRoom: 1,
      highestFloorReached: 1, citizenGrowthProgress: 0, autoExplore: false,
      currentEncounter: null,
      rngState: { algorithm: "xorshift32", version: 1, seed: 42, state: 42, draws: 0 },
    });
    expect(errors).toContain("heroes[0].equipment.mainHand.instanceId duplicates storedItems[0]");
  });

  it("validates the versioned canonical RNG state", () => {
    const errors = validateCanonicalGameState({
      resources: {}, buildings: {}, citizens: {}, districts: {}, heroes: [],
      storedItems: [], forgeMaterials: [], itemBlueprints: [], encounterHistory: [],
      totalCitizensCount: 3, activeDungeonFloor: 1, activeDungeonRoom: 1,
      highestFloorReached: 1, citizenGrowthProgress: 0, autoExplore: false,
      currentEncounter: null,
      rngState: { algorithm: "other", version: 2, seed: -1, state: 1.5, draws: "0" },
    });
    expect(errors).toEqual(expect.arrayContaining([
      "rngState.algorithm must be xorshift32",
      "rngState.version must be 1",
      "rngState.seed must be a non-zero unsigned 32-bit integer",
      "rngState.state must be a non-zero unsigned 32-bit integer",
      "rngState.draws must be a non-negative safe integer",
    ]));
  });

  it("rejects incomplete or inconsistent canonical heroes", () => {
    const validHero = makeHero();
    const errors = validateCanonicalGameState({
      resources: {}, buildings: {}, citizens: {}, districts: {},
      heroes: [
        { ...validHero, calculatedStats: undefined },
        {
          ...validHero,
          id: "broken-ranges",
          currentHp: 21,
          currentMana: -1,
          cooldowns: { heavy_blow: -1 },
        },
      ],
      storedItems: [], forgeMaterials: [], itemBlueprints: [], encounterHistory: [],
      totalCitizensCount: 3, activeDungeonFloor: 1, activeDungeonRoom: 1,
      highestFloorReached: 1, citizenGrowthProgress: 0, autoExplore: false,
      currentEncounter: null,
      rngState: { algorithm: "xorshift32", version: 1, seed: 42, state: 42, draws: 0 },
    });

    expect(errors).toEqual(expect.arrayContaining([
      "heroes[0].calculatedStats must be an object",
      "heroes[1].currentMana must be a number >= 0",
      "heroes[1].currentHp must not exceed calculatedStats.maxHp",
      "heroes[1].cooldowns.heavy_blow must be an integer >= 0",
    ]));
  });

  it("rejects unknown races, classes and incomplete secondary resistances", () => {
    const validHero = makeHero();
    const errors = validateCanonicalGameState({
      resources: {}, buildings: {}, citizens: {}, districts: {},
      heroes: [
        { ...validHero, race: "Dragon" },
        { ...validHero, id: "bad-class", classType: "Paladin" },
        {
          ...validHero,
          id: "bad-resistances",
          calculatedStats: {
            ...validHero.calculatedStats,
            resistances: {
              ...validHero.calculatedStats.resistances,
              arcane: undefined,
            },
          },
        },
      ],
      storedItems: [], forgeMaterials: [], itemBlueprints: [], encounterHistory: [],
      totalCitizensCount: 3, activeDungeonFloor: 1, activeDungeonRoom: 1,
      highestFloorReached: 1, citizenGrowthProgress: 0, autoExplore: false,
      currentEncounter: null,
      rngState: { algorithm: "xorshift32", version: 1, seed: 42, state: 42, draws: 0 },
    });

    expect(errors).toEqual(expect.arrayContaining([
      "heroes[0].race must be a known canonical race",
      "heroes[1].classType must be Novice or a known Tier 1 class",
      "heroes[2].calculatedStats.resistances.arcane must be a finite number",
    ]));
  });

  it("rejects unknown skills and skills stored under the wrong kind", () => {
    expect(validateAuthoritativeHero(makeHero({
      activeSkills: ["missing_active"],
    }))).toContain("hero.activeSkills contains unknown skill missing_active");
    expect(validateAuthoritativeHero(makeHero({
      activeSkills: ["survival_instinct"],
    }))).toContain("hero.activeSkills contains non-active skill survival_instinct");
    expect(validateAuthoritativeHero(makeHero({
      passiveSkills: ["heavy_blow"],
    }))).toContain("hero.passiveSkills contains non-passive skill heavy_blow");
  });

  it("rejects progression thresholds inconsistent with level and class", () => {
    expect(validateAuthoritativeHero(makeHero({ xpNeeded: 120 }))).toContain(
      "hero.xpNeeded must equal 100 for level 1 Novice",
    );
    expect(validateAuthoritativeHero(makeHero({ xp: 100, xpNeeded: 100 }))).toContain(
      "hero.xp must be lower than xpNeeded after canonical progression",
    );
  });

  it("uses the same inclusive safe-integer draw boundary as the RNG runtime", () => {
    const errors = validateCanonicalGameState({
      resources: {}, buildings: {}, citizens: {}, districts: {}, heroes: [],
      storedItems: [], forgeMaterials: [], itemBlueprints: [], encounterHistory: [],
      totalCitizensCount: 3, activeDungeonFloor: 1, activeDungeonRoom: 1,
      highestFloorReached: 1, citizenGrowthProgress: 0, autoExplore: false,
      currentEncounter: null,
      rngState: {
        algorithm: "xorshift32",
        version: 1,
        seed: 42,
        state: 42,
        draws: Number.MAX_SAFE_INTEGER,
      },
    });
    expect(errors).toEqual([]);
  });
});
