import { describe, expect, it } from "vitest";
import { formatCanonicalTownEvent } from "../src/domain/townEventLog";

describe("canonical town event log", () => {
  it("formats building and citizen mutations", () => {
    expect(formatCanonicalTownEvent({
      type: "building.upgraded",
      buildingId: "ferme",
      level: 2,
    })?.message).toContain("niveau 2");
    expect(formatCanonicalTownEvent({
      type: "citizens.allocated",
      role: "farmers",
      amount: 1,
    })?.message).toContain("1 citoyen");
  });

  it("ignores events owned by another domain", () => {
    expect(formatCanonicalTownEvent({ type: "dungeon.encounter_resolved" })).toBeNull();
  });
});
