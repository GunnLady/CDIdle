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
    expect(errors).toEqual(expect.arrayContaining(["totalCitizensCount is required", "districts is required", "forgeMaterials is required", "itemBlueprints is required"]));
  });
});
