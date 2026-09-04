import { describe, expect, it } from "vitest";
import {
  applyForgeCommand,
  DEFAULT_NOVICE_ITEM_BLUEPRINTS,
  type ForgeRarity,
} from "../supabase/functions/game-api/forge-authority";
import type { CanonicalRng } from "../supabase/functions/game-api/authoritative-rng";
import { initialCanonicalRngState } from "../supabase/functions/game-api/authoritative-rng";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import type { CanonicalForgeMaterialStack, CanonicalGameState } from "../shared/contracts/authoritative";
import { FORGE_PROGRESSION_LEVELS } from "../shared/data/forge-progression";
import type { CanonicalStatModifier } from "../shared/domain/hero-stats";

const rngAt = (value: number): CanonicalRng => ({
  next: () => value,
  nextInt: (maxExclusive) => Math.floor(value * maxExclusive),
  snapshot: () => initialCanonicalRngState(42),
});

const forgeState = (materials: CanonicalForgeMaterialStack[] = [
  { materialId: "metal_scrap", rarity: "common", count: 6 },
  { materialId: "refined_metal", rarity: "uncommon", count: 1 },
]): CanonicalGameState => ({
  ...initialTownState(42),
  buildings: { ...initialTownState(42).buildings, forge: 1 },
  storedItems: [],
  forgeMaterials: materials,
  itemBlueprints: DEFAULT_NOVICE_ITEM_BLUEPRINTS.map((entry) => ({ ...entry })),
});

describe("authoritative novice forge", () => {
  it("accepts each unlocked five-level band and rejects the next one before RNG", () => {
    for (const progression of FORGE_PROGRESSION_LEVELS) {
      const state = {
        ...forgeState([
          { materialId: "metal_scrap", rarity: "common", count: 100 },
          { materialId: "refined_metal", rarity: "uncommon", count: 100 },
        ]),
        buildings: { ...forgeState().buildings, forge: progression.level },
      };
      const started = applyForgeCommand(state, {
        type: "forge.start",
        recipeId: "progression_sword",
        levelBandMin: progression.itemLevelRange.min,
        commandId: `band-${progression.level}`,
      }, rngAt(0));
      expect(started.state.pendingForge?.itemLevel).toBe(progression.itemLevelRange.min);

      if (progression.level < FORGE_PROGRESSION_LEVELS.length) {
        let draws = 0;
        const rng: CanonicalRng = {
          ...rngAt(0),
          next: () => { draws += 1; return 0; },
          nextInt: () => { draws += 1; return 0; },
        };
        expect(() => applyForgeCommand(state, {
          type: "forge.start",
          recipeId: "progression_sword",
          levelBandMin: progression.itemLevelRange.max + 1,
          commandId: `locked-band-${progression.level}`,
        }, rng)).toThrow("forge level band is locked");
        expect(draws).toBe(0);
      }
    }
  });

  it("does not publish fixed legacy models as parallel recipes", () => {
    const recipeId = "embercleaver_greataxe";
    const state = {
      ...forgeState(),
      buildings: { ...forgeState().buildings, forge: 8 },
      itemBlueprints: [{ itemId: recipeId, unlocked: true }],
    };
    expect(() => applyForgeCommand(state, {
      type: "forge.start", recipeId, commandId: "legacy-fixed",
    }, rngAt(0))).toThrow("forge blueprint is locked");
  });

  it.each([
    [0, "common"],
    [0.719999, "common"],
    [0.72, "uncommon"],
    [0.949999, "uncommon"],
    [0.95, "rare"],
    [0.999999, "rare"],
  ] as const)("maps Forge 1 RNG %s to %s and persists the offered rarity", (roll, expected) => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "progression_sword", commandId: "roll" }, rngAt(roll));
    expect(started.state.pendingForge).toMatchObject({ previewId: "preview-roll", offeredRarity: expected });
    expect(started.events).toEqual([expect.objectContaining({
      type: 'forge.preview_created',
      previewId: 'preview-roll',
      itemId: 'progression_sword',
      powerModelId: 'level-bands-v1',
      offeredRarity: expected,
      craftCost: [
        { materialId: 'metal_scrap', rarity: 'common', count: 6 },
        { materialId: 'refined_metal', rarity: 'uncommon', count: 1 },
      ],
    })]);
  });

  it("finalizes a standard item when the upgrade is declined", () => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "progression_sword", commandId: "standard" }, rngAt(0));
    const finalized = applyForgeCommand(started.state, { type: "forge.finalize", previewId: "preview-standard", acceptUpgrade: false });
    expect(finalized.state).toMatchObject({
      pendingForge: null,
      forgeMaterials: [],
      storedItems: [{ instanceId: "item:forge:preview-standard", itemId: "progression_sword", itemLevel: 1, powerModelId: "level-bands-v1", rarity: "common" }],
    });
  });

  it('persists a scalable item level from an unlocked five-level forge band', () => {
    const state = {
      ...forgeState([
        { materialId: 'metal_scrap', rarity: 'common', count: 30 },
        { materialId: 'refined_metal', rarity: 'uncommon', count: 10 },
      ]),
      buildings: { ...forgeState().buildings, forge: 4 },
      itemBlueprints: [{ itemId: 'progression_sword', unlocked: true }],
    };
    const started = applyForgeCommand(state, {
      type: 'forge.start', recipeId: 'progression_sword', levelBandMin: 16, commandId: 'scaled',
    }, rngAt(0.5));
    expect(started.state.pendingForge).toMatchObject({
      itemId: 'progression_sword', itemLevel: 18, powerModelId: 'level-bands-v1',
    });
    expect(started.state.forgeMaterials).toEqual([
      { materialId: 'metal_scrap', rarity: 'common', count: 18 },
      { materialId: 'refined_metal', rarity: 'uncommon', count: 8 },
    ]);
    const finalized = applyForgeCommand(started.state, {
      type: 'forge.finalize', previewId: 'preview-scaled', acceptUpgrade: false,
    });
    expect(finalized.state.storedItems.at(-1)).toMatchObject({
      itemId: 'progression_sword', itemLevel: 18, powerModelId: 'level-bands-v1', rarity: 'common',
    });
  });

  it('scales an accepted upgrade cost and chosen bonus with the crafted level band', () => {
    const state = {
      ...forgeState([
        { materialId: 'metal_scrap', rarity: 'common', count: 24 },
        { materialId: 'refined_metal', rarity: 'uncommon', count: 12 },
      ]),
      buildings: { ...forgeState().buildings, forge: 4 },
      itemBlueprints: [{ itemId: 'progression_sword', unlocked: true }],
    };
    const started = applyForgeCommand(state, {
      type: 'forge.start', recipeId: 'progression_sword', levelBandMin: 16, commandId: 'scaled-upgrade',
    }, rngAt(0.5));
    expect(started.state.pendingForge).toMatchObject({ itemLevel: 18, offeredRarity: 'uncommon' });
    expect(started.state.forgeMaterials).toEqual([
      { materialId: 'metal_scrap', rarity: 'common', count: 12 },
      { materialId: 'refined_metal', rarity: 'uncommon', count: 10 },
    ]);

    const finalized = applyForgeCommand(started.state, {
      type: 'forge.finalize',
      previewId: 'preview-scaled-upgrade',
      acceptUpgrade: true,
      chosenModifierStat: 'physicalDamage',
    });
    expect(finalized.state.forgeMaterials).toEqual([
      { materialId: 'metal_scrap', rarity: 'common', count: 12 },
      { materialId: 'refined_metal', rarity: 'uncommon', count: 6 },
    ]);
    expect(finalized.state.storedItems.at(-1)).toMatchObject({
      itemLevel: 18,
      rarity: 'uncommon',
      modifiers: expect.arrayContaining([
        { stat: 'physicalDamage', type: 'flat', value: 5 },
      ]),
    });
  });

  it.each([
    "progression_greataxe",
    "progression_spellbook",
    "progression_sanctified_censer",
  ] as const)("crafts the evolving family %s introduced from the legacy catalog", (itemId) => {
    const state = {
      ...forgeState(),
      buildings: { ...forgeState().buildings, forge: 8 },
      itemBlueprints: [{ itemId, unlocked: true }],
    };
    const started = applyForgeCommand(state, { type: "forge.start", recipeId: itemId, levelBandMin: 1, commandId: itemId }, rngAt(0));
    expect(started.state.pendingForge).toMatchObject({ itemId, offeredRarity: "common", powerModelId: "level-bands-v1" });
    const finalized = applyForgeCommand(started.state, {
      type: "forge.finalize",
      previewId: `preview-${itemId}`,
      acceptUpgrade: false,
    });
    expect(finalized.state).toMatchObject({
      storedItems: [{ itemId, rarity: "common", powerModelId: "level-bands-v1" }],
      pendingForge: null,
    });
  });

  it("charges and applies an uncommon upgrade", () => {
    const started = applyForgeCommand(forgeState([
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 3 },
    ]), { type: "forge.start", recipeId: "progression_dagger", commandId: "uncommon" }, rngAt(0.8));
    const finalized = applyForgeCommand(started.state, {
      type: "forge.finalize",
      previewId: "preview-uncommon",
      acceptUpgrade: true,
      chosenModifierStat: "criticalChance",
    });
    expect(finalized.state).toMatchObject({
      pendingForge: null,
      forgeMaterials: [],
      storedItems: [{
        instanceId: "item:forge:preview-uncommon",
        itemId: "progression_dagger", itemLevel: 5, powerModelId: "level-bands-v1",
        rarity: "uncommon",
      }],
    });
    expect((finalized.state.storedItems as Array<{ modifiers: unknown[] }>)[0].modifiers).toEqual(expect.arrayContaining([
      { stat: "criticalChance", type: "flat", value: 2 },
    ]));
  });

  it("charges the complete rare upgrade cost and accepts armor resistances", () => {
    const started = applyForgeCommand(forgeState([
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 5 },
      { materialId: "enchanted_fragment", rarity: "rare", count: 1 },
    ]), { type: "forge.start", recipeId: "progression_cloth_armor", commandId: "rare" }, rngAt(0.99));
    const finalized = applyForgeCommand(started.state, {
      type: "forge.finalize",
      previewId: "preview-rare",
      acceptUpgrade: true,
      chosenModifierStat: "fireResistance",
    });
    expect(finalized.state).toMatchObject({
      pendingForge: null,
      forgeMaterials: [],
      storedItems: [{
        instanceId: "item:forge:preview-rare",
        itemId: "progression_cloth_armor", itemLevel: 5, powerModelId: "level-bands-v1",
        rarity: "rare",
      }],
    });
    expect((finalized.state.storedItems as Array<{ modifiers: unknown[] }>)[0].modifiers).toEqual(expect.arrayContaining([
      { stat: "fireResistance", type: "flat", value: 8 },
    ]));
  });

  it("cancels only the preview and keeps the consumed base cost", () => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "progression_sword", commandId: "cancel" }, rngAt(0));
    const cancelled = applyForgeCommand(started.state, { type: "forge.cancel", previewId: "preview-cancel" });
    expect(cancelled.state).toMatchObject({ pendingForge: null, forgeMaterials: [], storedItems: [] });
    expect(cancelled.events).toEqual([{ type: "forge.preview_cancelled", previewId: "preview-cancel" }]);
  });

  it("replays a forge start deterministically from the same canonical state", () => {
    const command = { type: "forge.start", recipeId: "progression_sword", commandId: "replay" } as const;
    const first = applyForgeCommand(forgeState(), command, rngAt(0.99));
    const replay = applyForgeCommand(forgeState(), command, rngAt(0.99));
    expect(replay).toEqual(first);
  });

  it("rejects insufficient upgrade materials without mutating the preview", () => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "progression_sword", commandId: "poor" }, rngAt(0.8));
    const before = structuredClone(started.state);
    expect(() => applyForgeCommand(started.state, {
      type: "forge.finalize",
      previewId: "preview-poor",
      acceptUpgrade: true,
      chosenModifierStat: "physicalDamage",
    })).toThrow("insufficient forge materials");
    expect(started.state).toEqual(before);
  });

  it("refuses an unavailable upgrade without mutating its source", () => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "progression_sword", commandId: "no-proc" }, rngAt(0));
    const before = structuredClone(started.state);
    expect(() => applyForgeCommand(started.state, {
      type: "forge.finalize",
      previewId: "preview-no-proc",
      acceptUpgrade: true,
      chosenModifierStat: "physicalDamage",
    })).toThrow("forge upgrade is unavailable");
    expect(started.state).toEqual(before);
  });

  it("enforces blueprints before materials or RNG are consumed", () => {
    const current = { ...forgeState(), itemBlueprints: [] };
    let draws = 0;
    const rng: CanonicalRng = { ...rngAt(0), next: () => { draws += 1; return 0; } };
    const before = structuredClone(current);
    expect(() => applyForgeCommand(current, { type: "forge.start", recipeId: "progression_sword", commandId: "locked" }, rng)).toThrow("forge blueprint is locked");
    expect(current).toEqual(before);
    expect(draws).toBe(0);
  });

  it.each([
    ["common", [{ materialId: "metal_scrap", rarity: "common", count: 2 }]],
    ["uncommon", [{ materialId: "metal_scrap", rarity: "common", count: 4 }, { materialId: "refined_metal", rarity: "uncommon", count: 2 }]],
    ["rare", [{ materialId: "metal_scrap", rarity: "common", count: 3 }, { materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 2 }]],
    ["epic", [{ materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }]],
    ["legendary", [{ materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }, { materialId: "legendary_essence", rarity: "legendary", count: 1 }]],
  ] as Array<[ForgeRarity, Array<Record<string, unknown>>]>)("recycles one exact %s instance", (rarity, rewards) => {
    const state = {
      ...forgeState([]),
      storedItems: [{
        instanceId: `item-${rarity}`,
        itemId: "starter_sword",
        itemLevel: 1,
        powerModelId: "legacy-fixed-v1" as const,
        rarity,
      }],
    };
    const recycled = applyForgeCommand(state, { type: "inventory.recycle", instanceId: `item-${rarity}` });
    expect(recycled.state.storedItems).toEqual([]);
    expect(recycled.state.forgeMaterials).toEqual(rewards);
  });

  it("recycles only the selected item instance", () => {
    const physical: CanonicalStatModifier[] = [{ stat: "physicalDamage", type: "flat", value: 2 }];
    const critical: CanonicalStatModifier[] = [{ stat: "criticalChance", type: "flat", value: 1 }];
    const state: CanonicalGameState = {
      ...forgeState([]),
      storedItems: [
        { instanceId: "item-physical", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "uncommon", modifiers: physical },
        { instanceId: "item-critical", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "uncommon", modifiers: critical },
      ],
    };
    const recycled = applyForgeCommand(state, {
      type: "inventory.recycle",
      instanceId: "item-physical",
    });
    expect(recycled.state.storedItems).toEqual([
      { instanceId: "item-critical", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "uncommon", modifiers: critical },
    ]);
    expect(recycled.state.forgeMaterials).toEqual([
      { materialId: "metal_scrap", rarity: "common", count: 4 },
      { materialId: "refined_metal", rarity: "uncommon", count: 2 },
    ]);
    expect(recycled.events).toEqual([{
      type: "inventory.recycled",
      instanceId: "item-physical",
      itemId: "starter_sword",
      itemLevel: 1,
      rarity: "uncommon",
      rewards: [
        { materialId: "metal_scrap", rarity: "common", count: 4 },
        { materialId: "refined_metal", rarity: "uncommon", count: 2 },
      ],
    }]);
    expect(state.storedItems).toHaveLength(2);
  });
});
