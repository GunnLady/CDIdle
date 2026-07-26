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

  it("formats forge, cancellation and exact recycle rewards", () => {
    expect(formatCanonicalTownEvent({ type: "forge.preview_created", itemId: "starter_sword", upgradeProc: "rare" })?.message).toContain("amélioration rare disponible");
    expect(formatCanonicalTownEvent({ type: "forge.finalized", instanceId: "item:forge:preview-1", itemId: "starter_sword", rarity: "rare", modifier: "physicalDamage" })?.message).toContain("bonus dégâts physiques");
    expect(formatCanonicalTownEvent({ type: "forge.finalized", instanceId: "item:forge:preview-1", itemId: "starter_sword", rarity: "rare", modifier: "physicalDamage" })?.message).not.toContain("item:forge:preview-1");
    expect(formatCanonicalTownEvent({ type: "forge.finalized", itemId: "starter_sword", rarity: "uncommon", modifier: null })?.message).toContain("qualité inhabituelle");
    expect(formatCanonicalTownEvent({ type: "forge.preview_cancelled" })?.message).toContain("matériaux de base");
    expect(formatCanonicalTownEvent({
      type: "inventory.recycled",
      instanceId: "item:forge:preview-1",
      itemId: "starter_sword",
      rewards: [{ materialId: "metal_scrap", rarity: "common", count: 2 }],
    })?.message).toContain("Épée de départ recyclé : 2 débris métalliques");
  });
});
