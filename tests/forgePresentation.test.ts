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
      blueprints: [{ itemId: "starter_sword", unlocked: true }],
      selectedRecipeId: "starter_sword",
    });

    expect(view.baseAffordable).toBe(true);
    expect(view.selectedRecipe).toMatchObject({ id: "starter_sword", unlocked: true, rarityLabel: "Commune" });
    expect(view.selectedRecipe?.weaponDetails).toContain("Scaling : Puissance (FOR)");
    expect(view.materials.find((material) => material.id === "metal_scrap")?.count).toBe(6);
  });

  it("derives rare upgrade affordability and armor modifier compatibility", () => {
    const view = createForgeWorkspaceView({
      materials,
      blueprints: [{ itemId: "traveler_clothes", unlocked: true }],
      selectedRecipeId: "traveler_clothes",
      pending: { previewId: "preview", itemId: "traveler_clothes", upgradeProc: "rare" },
    });

    expect(view.pending?.upgradeAffordable).toBe(true);
    expect(view.pending?.modifierOptions.map((option) => option.stat)).toContain("fireResistance");
    expect(view.pending?.modifierOptions.map((option) => option.stat)).not.toContain("physicalDamage");
  });

  it("keeps locked recipes visible but unavailable", () => {
    const view = createForgeWorkspaceView({ materials: [], blueprints: [], selectedRecipeId: "starter_sword" });

    expect(view.baseAffordable).toBe(false);
    expect(view.selectedRecipe).toMatchObject({ id: "starter_sword", unlocked: false });
  });
});
