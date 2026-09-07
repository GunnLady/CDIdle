import { describe, expect, it } from "vitest";
import { createForgeWorkspaceView, filterForgeRecipes } from "../src/domain/forgePresentation";
import { ITEM_LIBRARY } from '../src/data/gameData';
import { applyItemLevelScaling, applyItemRarityScaling } from '../shared/domain/items/scaling';

const materials = [
  { materialId: "metal_scrap", rarity: "common" as const, count: 6 },
  { materialId: "refined_metal", rarity: "uncommon" as const, count: 4 },
  { materialId: "enchanted_fragment", rarity: "rare" as const, count: 1 },
];

describe("createForgeWorkspaceView", () => {
  it('filters names ignoring accents and case without changing the catalog', () => {
    const view = createForgeWorkspaceView({ materials, blueprints: [{ itemId: 'progression_sword', unlocked: true }], selectedRecipeId: 'progression_sword' });
    expect(filterForgeRecipes(view.recipes, ' EPEE ', 'weapon', true).map((recipe) => recipe.id)).toContain('progression_sword');
    expect(filterForgeRecipes(view.recipes, '', 'armor', false)).toHaveLength(6);
    expect(filterForgeRecipes(view.recipes, '', 'accessory', false)).toHaveLength(7);
    expect(view.recipes).toHaveLength(51);
  });

  it('uses shared scaling for both ends of every open band and every recipe', () => {
    for (const band of [1, 6, 11, 16, 21, 26, 31, 36]) {
      const view = createForgeWorkspaceView({ materials: [], blueprints: [], selectedRecipeId: 'progression_sword', selectedLevelBandMin: band, forgeLevel: 8 });
      for (const recipe of view.recipes) {
        const base = ITEM_LIBRARY.find((item) => item.id === recipe.id)!;
        if (base.powerModelId === 'legacy-fixed-v1') {
          expect(recipe.availableLevelBands).toEqual([31]);
          expect(recipe.modifierLines).toHaveLength(base.modifiers?.length ?? 0);
          continue;
        }
        for (const level of [band, band + 4]) {
          const item = applyItemRarityScaling(applyItemLevelScaling(base, level), base.minimumRarity, true);
          if (item.itemType === 'weapon' && item.damageRange) expect(recipe.weaponDetails).toContain(`Dégâts niv. ${level} : ${item.damageRange.min}–${item.damageRange.max}`);
        }
        expect(recipe.modifierLines).toHaveLength(base.modifiers?.length ?? 0);
      }
    }
  });

  it('exposes exact shortages and safely clamps an unavailable band', () => {
    const view = createForgeWorkspaceView({ materials, blueprints: [], selectedRecipeId: 'progression_sword', selectedLevelBandMin: 36, forgeLevel: 3 });
    expect(view.selectedLevelBandMin).toBe(11);
    expect(view.baseCosts[0]).toMatchObject({ id: 'metal_scrap', owned: 6, required: 12, missing: 6 });
    expect(view.selectedRecipe?.weaponDetails[0]).toMatch(/^Dégâts niv. 11/);
  });

  it('separates offered and base rarity and scales the upgrade cost', () => {
    const view = createForgeWorkspaceView({ materials: [], blueprints: [], selectedRecipeId: 'progression_sword', pending: { previewId: 'rare', itemId: 'progression_sword', itemLevel: 36, offeredRarity: 'rare' } });
    expect(view.pending).toMatchObject({ baseRarityLabel: 'Commune', rarityLabel: 'Rare', upgradeAvailable: true, upgradeAffordable: false });
    expect(view.pending?.upgradeCosts[0]).toMatchObject({ id: 'refined_metal', required: 12, missing: 12 });
    expect(view.pending?.modifierOptions[0].label).toBe('Dégâts physiques');
  });

  it("prepares recipes, weapon details and base affordability without UI state", () => {
    const view = createForgeWorkspaceView({
      materials,
      blueprints: [{ itemId: "progression_sword", unlocked: true }],
      selectedRecipeId: "progression_sword",
    });

    expect(view.baseAffordable).toBe(true);
    expect(view.recipes).toHaveLength(51);
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

  it("presents a Rat King signature as a fixed final result with its dedicated cost", () => {
    const view = createForgeWorkspaceView({
      materials: [
        { materialId: "rat_king_mark", rarity: "epic", count: 6 },
        { materialId: "metal_scrap", rarity: "common", count: 18 },
        { materialId: "refined_metal", rarity: "uncommon", count: 3 },
      ],
      blueprints: [{ itemId: "rat_king_fang", unlocked: true }],
      selectedRecipeId: "rat_king_fang",
      forgeLevel: 7,
      pending: { previewId: "signature", itemId: "rat_king_fang", itemLevel: 35, offeredRarity: "legendary" },
    });
    expect(view.bossComponents).toEqual([
      expect.objectContaining({
        bossId: "undercity:boss:50",
        materials: [expect.objectContaining({ id: "rat_king_mark", count: 6 })],
      }),
    ]);
    expect(view.baseCosts).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "rat_king_mark", name: "Marque du Roi", required: 6, missing: 0 }),
    ]));
    expect(view.pending).toMatchObject({
      baseRarityLabel: "Légendaire",
      rarityLabel: "Légendaire",
      upgradeAvailable: false,
      modifierOptions: [],
    });
  });});
