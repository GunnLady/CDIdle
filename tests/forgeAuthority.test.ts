import { describe, expect, it } from "vitest";
import {
  applyForgeCommand,
  DEFAULT_NOVICE_ITEM_BLUEPRINTS,
  type ForgeRarity,
} from "../supabase/functions/game-api/forge-authority";
import type { CanonicalRng } from "../supabase/functions/game-api/authoritative-rng";
import { initialCanonicalRngState } from "../supabase/functions/game-api/authoritative-rng";

const rngAt = (value: number): CanonicalRng => ({
  next: () => value,
  nextInt: (maxExclusive) => Math.floor(value * maxExclusive),
  snapshot: () => initialCanonicalRngState(42),
});

const forgeState = (materials = [
  { materialId: "metal_scrap", rarity: "common", count: 6 },
  { materialId: "refined_metal", rarity: "uncommon", count: 1 },
]) => ({
  buildings: { forge: 1 },
  storedItems: [],
  forgeMaterials: materials,
  itemBlueprints: DEFAULT_NOVICE_ITEM_BLUEPRINTS.map((entry) => ({ ...entry })),
});

describe("authoritative novice forge", () => {
  it.each([
    [0, "none"],
    [0.849999, "none"],
    [0.85, "uncommon"],
    [0.979999, "uncommon"],
    [0.98, "rare"],
    [0.999999, "rare"],
  ] as const)("maps RNG %s to %s and persists the proc", (roll, expected) => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "starter_sword", commandId: "roll" }, rngAt(roll));
    expect(started.state.pendingForge).toMatchObject({ previewId: "preview-roll", upgradeProc: expected });
    expect(started.events).toEqual([{ type: "forge.preview_created", previewId: "preview-roll", itemId: "starter_sword", upgradeProc: expected }]);
  });

  it("finalizes a standard item when the upgrade is declined", () => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "starter_sword", commandId: "standard" }, rngAt(0));
    const finalized = applyForgeCommand(started.state, { type: "forge.finalize", previewId: "preview-standard", acceptUpgrade: false });
    expect(finalized.state).toMatchObject({
      pendingForge: null,
      forgeMaterials: [],
      storedItems: [{ instanceId: "item:forge:preview-standard", itemId: "starter_sword", rarity: "common" }],
    });
  });

  it("charges and applies an uncommon upgrade", () => {
    const started = applyForgeCommand(forgeState([
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 3 },
    ]), { type: "forge.start", recipeId: "quick_dagger", commandId: "uncommon" }, rngAt(0.9));
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
        itemId: "quick_dagger",
        rarity: "uncommon",
        modifiers: [
          { stat: "criticalChance", type: "percent", value: 1 },
          { stat: "criticalChance", type: "flat", value: 1 },
        ],
      }],
    });
  });

  it("charges the complete rare upgrade cost and accepts armor resistances", () => {
    const started = applyForgeCommand(forgeState([
      { materialId: "metal_scrap", rarity: "common", count: 6 },
      { materialId: "refined_metal", rarity: "uncommon", count: 5 },
      { materialId: "enchanted_fragment", rarity: "rare", count: 1 },
    ]), { type: "forge.start", recipeId: "traveler_clothes", commandId: "rare" }, rngAt(0.99));
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
        itemId: "traveler_clothes",
        rarity: "rare",
        modifiers: [
          { stat: "maxMana", type: "percent", value: 5 },
          { stat: "fireResistance", type: "flat", value: 2 },
        ],
      }],
    });
  });

  it("cancels only the preview and keeps the consumed base cost", () => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "starter_sword", commandId: "cancel" }, rngAt(0));
    const cancelled = applyForgeCommand(started.state, { type: "forge.cancel", previewId: "preview-cancel" });
    expect(cancelled.state).toMatchObject({ pendingForge: null, forgeMaterials: [], storedItems: [] });
    expect(cancelled.events).toEqual([{ type: "forge.preview_cancelled", previewId: "preview-cancel" }]);
  });

  it("replays a forge start deterministically from the same canonical state", () => {
    const command = { type: "forge.start", recipeId: "starter_sword", commandId: "replay" } as const;
    const first = applyForgeCommand(forgeState(), command, rngAt(0.99));
    const replay = applyForgeCommand(forgeState(), command, rngAt(0.99));
    expect(replay).toEqual(first);
  });

  it("rejects insufficient upgrade materials without mutating the preview", () => {
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "starter_sword", commandId: "poor" }, rngAt(0.9));
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
    const started = applyForgeCommand(forgeState(), { type: "forge.start", recipeId: "starter_sword", commandId: "no-proc" }, rngAt(0));
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
    expect(() => applyForgeCommand(current, { type: "forge.start", recipeId: "starter_sword", commandId: "locked" }, rng)).toThrow("forge blueprint is locked");
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
    const state = { ...forgeState([]), storedItems: [{ instanceId: `item-${rarity}`, itemId: "starter_sword", rarity }] };
    const recycled = applyForgeCommand(state, { type: "inventory.recycle", instanceId: `item-${rarity}` });
    expect(recycled.state.storedItems).toEqual([]);
    expect(recycled.state.forgeMaterials).toEqual(rewards);
  });

  it("recycles only the selected item instance", () => {
    const physical = [{ stat: "physicalDamage", type: "flat", value: 2 }];
    const critical = [{ stat: "criticalChance", type: "flat", value: 1 }];
    const state = {
      ...forgeState([]),
      storedItems: [
        { instanceId: "item-physical", itemId: "starter_sword", rarity: "uncommon", modifiers: physical },
        { instanceId: "item-critical", itemId: "starter_sword", rarity: "uncommon", modifiers: critical },
      ],
    };
    const recycled = applyForgeCommand(state, {
      type: "inventory.recycle",
      instanceId: "item-physical",
    });
    expect(recycled.state.storedItems).toEqual([
      { instanceId: "item-critical", itemId: "starter_sword", rarity: "uncommon", modifiers: critical },
    ]);
    expect(recycled.state.forgeMaterials).toEqual([
      { materialId: "metal_scrap", rarity: "common", count: 4 },
      { materialId: "refined_metal", rarity: "uncommon", count: 2 },
    ]);
    expect(recycled.events).toEqual([{
      type: "inventory.recycled",
      instanceId: "item-physical",
      itemId: "starter_sword",
      rarity: "uncommon",
      rewards: [
        { materialId: "metal_scrap", rarity: "common", count: 4 },
        { materialId: "refined_metal", rarity: "uncommon", count: 2 },
      ],
    }]);
    expect(state.storedItems).toHaveLength(2);
  });
});
