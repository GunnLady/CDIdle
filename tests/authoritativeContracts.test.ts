import { describe, expect, it } from "vitest";
import { CANONICAL_COMMAND_TYPES, validateCanonicalCommandEnvelope, validateCanonicalGameState } from "../shared/contracts/authoritative";

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
