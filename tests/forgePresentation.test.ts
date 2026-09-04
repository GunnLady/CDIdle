import { describe, expect, it } from "vitest";
import { createForgeWorkspaceView } from "../src/domain/forgePresentation";

const materials = [
  { materialId: "metal_scrap", rarity: "common" as const, count: 6 },
  { materialId: "refined_metal", rarity: "uncommon" as const, count: 4 },
  { materialId: "enchanted_fragment", rarity: "rare" as const, count: 1 },
];

describe("createForgeWorkspaceView", () => {
  it("prepares recipes, weapon details and base affordability without UI state", () => {
    const view = createForgeWorkspaceView({
      materials,
      blueprints: [{ itemId: "progression_sword", unlocked: true }],
      selectedRecipeId: "progression_sword",
    });

    expect(view.baseAffordable).toBe(true);
    expect(view.recipes).toHaveLength(48);
    expect(view.selectedRecipe).toMatchObject({ id: "progression_sword", unlocked: true, rarityLabel: "Commune" });
    expect(view.progression).toEqual({ openedRangeLabel: "1–5", nextRangeLabel: "6–10", nextRequiredFloor: 8 });
    expect(view.selectedRecipe?.weaponDetails).toContain("Caractéristique : Force");
    expect(view.materials.find((material) => material.id === "metal_scrap")?.count).toBe(6);
  });

  it("exposes legacy-derived families without publishing fixed legacy recipes", () => {
    const view = createForgeWorkspaceView({
      materials,
      blueprints: [{ itemId: "progression_spellbook", unlocked: true }],
      selectedRecipeId: "progression_spellbook",
    });

    expect(view.selectedRecipe).toMatchObject({
      id: "progression_spellbook",
      unlocked: true,
      powerModelId: "level-bands-v1",
    });
    expect(view.recipes.some((recipe) => recipe.id === "eclipse_heart_spellbook")).toBe(false);
  });

  it("derives rare upgrade affordability and armor modifier compatibility", () => {
    const view = createForgeWorkspaceView({
      materials,
      blueprints: [{ itemId: "progression_cloth_armor", unlocked: true }],
      selectedRecipeId: "progression_cloth_armor",
      pending: { previewId: "preview", itemId: "progression_cloth_armor", offeredRarity: "rare" },
    });

    expect(view.pending?.upgradeAffordable).toBe(true);
    expect(view.pending?.modifierOptions.map((option) => option.stat)).toContain("fireResistance");
    expect(view.pending?.modifierOptions.map((option) => option.stat)).not.toContain("physicalDamage");
  });

  it("keeps locked recipes visible but unavailable", () => {
    const view = createForgeWorkspaceView({ materials: [], blueprints: [], selectedRecipeId: "progression_sword" });

    expect(view.baseAffordable).toBe(false);
    expect(view.selectedRecipe).toMatchObject({ id: "progression_sword", unlocked: false });
  });
});
