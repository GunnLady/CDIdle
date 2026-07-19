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

  it("handles inventory stacks and atomic hero equipment", () => {
    const current = { ...initialTownState(), heroes: [{ id: "hero-1", level: 1, equipment: {} }] };
    const added = applyTownCommand(current, { type: "inventory.add", itemId: "starter_sword", rarity: "common", count: 2 });
    expect(added.state.storedItems).toEqual([{ itemId: "starter_sword", rarity: "common", count: 2 }]);
    const equipped = applyTownCommand(added.state, { type: "hero.equip", heroId: "hero-1", itemId: "starter_sword", rarity: "common" });
    expect(equipped.state).toMatchObject({ storedItems: [{ itemId: "starter_sword", rarity: "common", count: 1 }], heroes: [{ equipment: { mainHand: { itemId: "starter_sword" } } }] });
    const unequipped = applyTownCommand(equipped.state, { type: "hero.unequip", heroId: "hero-1", slot: "mainHand" });
    expect(unequipped.state).toMatchObject({ storedItems: [{ itemId: "starter_sword", rarity: "common", count: 2 }], heroes: [{ equipment: {} }] });
    expect(() => applyTownCommand(current, { type: "inventory.add", itemId: "unknown-item", rarity: "common" })).toThrow("unknown item");
  });

  it("keeps forge preview and recycling atomic", () => {
    const current = { ...initialTownState(), buildings: { ...initialTownState().buildings, forge: 1 }, forgeMaterials: [
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 1 },
    ], storedItems: [{ itemId: "starter_sword", rarity: "common", count: 1 }] };
    const started = applyTownCommand(current, { type: "forge.start", recipeId: "starter_sword", commandId: "forge-command" });
    expect(started.state).toMatchObject({ forgeMaterials: [], pendingForge: { previewId: "preview-forge-command" } });
    const finalized = applyTownCommand(started.state, { type: "forge.finalize", previewId: "preview-forge-command" });
    expect(finalized.state).toMatchObject({ pendingForge: null, storedItems: [{ itemId: "starter_sword", rarity: "common", count: 2 }] });
    const recycled = applyTownCommand({ ...finalized.state, forgeMaterials: [] }, { type: "inventory.recycle", itemId: "starter_sword", rarity: "common" });
    expect(recycled.state).toMatchObject({ storedItems: [{ itemId: "starter_sword", count: 1 }], forgeMaterials: [{ materialId: "metal_scrap", count: 2 }] });
    expect(() => applyTownCommand(recycled.state, { type: "forge.finalize", previewId: "preview-forge-command" })).toThrow("forge preview not found");
    const rareRecycle = applyTownCommand({ ...recycled.state, storedItems: [{ itemId: "starter_sword", rarity: "rare", count: 1 }], forgeMaterials: [] }, { type: "inventory.recycle", itemId: "starter_sword", rarity: "rare" });
    expect(rareRecycle.state.forgeMaterials).toEqual([
      { materialId: "metal_scrap", rarity: "common", count: 3 },
      { materialId: "refined_metal", rarity: "uncommon", count: 4 },
      { materialId: "enchanted_fragment", rarity: "rare", count: 2 },
    ]);
    const secondPreview = applyTownCommand({ ...current, forgeMaterials: [
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 1 },
    ] }, { type: "forge.start", recipeId: "quick_dagger", commandId: "second-forge" });
    expect(() => applyTownCommand(secondPreview.state, { type: "forge.finalize", previewId: "preview-second-forge", chosenModifierStat: "maxHp" })).toThrow("modifier is incompatible");
  });
});
