import { describe, expect, it } from "vitest";
import {
  FORGE_PROGRESSION_LEVELS,
  MAX_FORGE_LEVEL,
} from "../shared/data/forge-progression";
import { getBuildingMaxLevel, getBuildingUpgradeCost } from "../shared/data/buildings";
import { FORGE_RARITY_WEIGHTS } from "../shared/domain/forge-economy";
import { rollBlueprintReward } from "../shared/domain/items/blueprint-rewards";
import { ITEM_LIBRARY } from "../shared/domain/items/items";
import { applyTownCommand, initialTownState } from "../supabase/functions/game-api/town-authority";
import { applyForgeCommand, rollOfferedRarity } from "../supabase/functions/game-api/forge-authority";
import type { CanonicalRng } from "../supabase/functions/game-api/authoritative-rng";

const rngAt = (value: number): CanonicalRng => ({
  next: () => value,
  nextInt: (maximum) => Math.floor(value * maximum),
  snapshot: () => ({ algorithm: "xorshift32", version: 1, seed: 1, state: 1, draws: 0 }),
});

describe("shared Forge progression", () => {
  it("keeps the eight validated bands, floors and exact costs", () => {
    expect(getBuildingMaxLevel("forge")).toBe(8);
    expect(MAX_FORGE_LEVEL).toBe(8);
    expect(FORGE_PROGRESSION_LEVELS.map(({ level, itemLevelRange, requiredFloor }) => ({ level, itemLevelRange, requiredFloor }))).toEqual([
      { level: 1, itemLevelRange: { min: 1, max: 5 }, requiredFloor: 3 },
      { level: 2, itemLevelRange: { min: 6, max: 10 }, requiredFloor: 8 },
      { level: 3, itemLevelRange: { min: 11, max: 15 }, requiredFloor: 11 },
      { level: 4, itemLevelRange: { min: 16, max: 20 }, requiredFloor: 18 },
      { level: 5, itemLevelRange: { min: 21, max: 25 }, requiredFloor: 26 },
      { level: 6, itemLevelRange: { min: 26, max: 30 }, requiredFloor: 36 },
      { level: 7, itemLevelRange: { min: 31, max: 35 }, requiredFloor: 49 },
      { level: 8, itemLevelRange: { min: 36, max: 40 }, requiredFloor: 62 },
    ]);
    for (const entry of FORGE_PROGRESSION_LEVELS) {
      expect(getBuildingUpgradeCost("forge", entry.level - 1)).toEqual(entry.upgradeCost);
    }
  });

  it("requires every target floor and keeps grouped upgrades atomic", () => {
    for (const entry of FORGE_PROGRESSION_LEVELS) {
      const source = initialTownState(42);
      source.buildings = { ...source.buildings, guilde: 1, mine: 1, forge: entry.level - 1 };
      source.resources = { gold: 1e9, food: 1e9, wood: 1e9, stone: 1e9, ore: 1e9 };
      source.highestFloorReached = entry.requiredFloor - 1;
      expect(() => applyTownCommand(source, { type: "building.upgrade", buildingId: "forge" })).toThrow("dungeon floor prerequisite");
      source.highestFloorReached = entry.requiredFloor;
      expect(applyTownCommand(source, { type: "building.upgrade", buildingId: "forge" }).state.buildings.forge).toBe(entry.level);
    }

    const grouped = initialTownState(42);
    grouped.buildings = { ...grouped.buildings, guilde: 1, mine: 1, forge: 1 };
    grouped.resources = { gold: 1e9, food: 1e9, wood: 1e9, stone: 1e9, ore: 1e9 };
    grouped.highestFloorReached = 11;
    const before = structuredClone(grouped);
    expect(() => applyTownCommand(grouped, { type: "building.upgrade", buildingId: "forge", levels: 3 })).toThrow("dungeon floor prerequisite");
    expect(grouped).toEqual(before);
  });

  it("keeps every rarity table normalized and honors every boundary", () => {
    for (const entry of FORGE_PROGRESSION_LEVELS) {
      const weights = FORGE_RARITY_WEIGHTS[entry.level];
      expect(weights.reduce((sum, [, weight]) => sum + weight, 0)).toBe(100);
      let lower = 0;
      for (const [rarity, weight] of weights) {
        if (weight === 0) continue;
        expect(rollOfferedRarity(rngAt((lower + 1e-9) / 100), entry.level)).toBe(rarity);
        expect(rollOfferedRarity(rngAt((lower + weight - 1e-9) / 100), entry.level)).toBe(rarity);
        lower += weight;
      }
    }
  });

  it("never creates a component-wise profitable craft, acceptance and recycle cycle", () => {
    const rarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
    const materialRarities = {
      metal_scrap: "common",
      refined_metal: "uncommon",
      enchanted_fragment: "rare",
      arcane_core: "epic",
      legendary_essence: "legendary",
    } as const;
    for (const forge of FORGE_PROGRESSION_LEVELS) {
      for (const offeredRarity of rarities) {
        const initialMaterials = Object.entries(materialRarities).map(([materialId, rarity]) => ({ materialId, rarity, count: 100 }));
        const source = {
          ...initialTownState(42),
          buildings: { ...initialTownState(42).buildings, forge: forge.level },
          forgeMaterials: initialMaterials,
          itemBlueprints: [{ itemId: "progression_sword", unlocked: true }],
        };
        const started = applyForgeCommand(source, {
          type: "forge.start",
          recipeId: "progression_sword",
          levelBandMin: forge.itemLevelRange.min,
          commandId: `cycle-${forge.level}-${offeredRarity}`,
        }, rngAt(0));
        const preview = { ...started.state.pendingForge!, offeredRarity };
        const finalized = applyForgeCommand({ ...started.state, pendingForge: preview }, {
          type: "forge.finalize",
          previewId: preview.previewId,
          acceptUpgrade: offeredRarity !== "common",
          ...(offeredRarity === "common" ? {} : { chosenModifierStat: "physicalDamage" }),
        });
        const recycled = applyForgeCommand(finalized.state, {
          type: "inventory.recycle",
          instanceId: `item:forge:${preview.previewId}`,
        });
        const finalCounts = new Map(recycled.state.forgeMaterials.map((entry) => [entry.materialId, entry.count]));
        expect(
          initialMaterials.every((entry) => (finalCounts.get(entry.materialId) ?? 0) >= entry.count),
          `profitable cycle at Forge ${forge.level} ${offeredRarity}`,
        ).toBe(false);
      }
    }
  });
});

describe("blueprint rewards", () => {
  it("draws only unknown random-drop plans and deduplicates the reward", () => {
    const initial = ITEM_LIBRARY.filter((item) => item.blueprintDiscovery.kind === "initial")
      .map((item) => ({ itemId: item.id, unlocked: true }));
    const result = rollBlueprintReward({ blueprints: initial, source: "treasure", floor: 10, chance: 0.05, rng: rngAt(0) });
    expect(result.itemId).toBeTruthy();
    expect(ITEM_LIBRARY.find((item) => item.id === result.itemId)?.blueprintDiscovery.kind).toBe("random-drop");
    expect(new Set(result.blueprints.map((entry) => entry.itemId)).size).toBe(result.blueprints.length);
  });

  it("consumes only the trigger roll and gives nothing when the eligible pool is empty", () => {
    const allRandom = ITEM_LIBRARY.filter((item) => item.blueprintDiscovery.kind === "random-drop")
      .map((item) => ({ itemId: item.id, unlocked: true }));
    let draws = 0;
    const rng = { ...rngAt(0), next: () => { draws += 1; return 0; } };
    const result = rollBlueprintReward({ blueprints: allRandom, source: "boss", bossId: "boss", floor: 10, chance: 0.05, rng });
    expect(result).toEqual({ blueprints: allRandom });
    expect(draws).toBe(1);
  });

  it("filters source, floor, boss, status, provenance and publication policy", () => {
    const base = ITEM_LIBRARY.find((item) => item.id === "progression_sword");
    if (!base || base.itemType !== "weapon") throw new Error("progression_sword test fixture is unavailable");
    const candidate = (id: string, overrides: Partial<typeof base> = {}) => ({
      ...base,
      id,
      name: id,
      blueprintDiscovery: {
        kind: "random-drop" as const,
        sources: ["boss" as const],
        floorMin: 10,
        floorMax: 20,
        weight: 1,
        bossIds: ["boss-a"],
      },
      ...overrides,
    });
    const catalog = [
      candidate("valid"),
      candidate("inactive", { catalogStatus: "legacy" }),
      candidate("wrong-source", { blueprintDiscovery: { kind: "random-drop", sources: ["treasure"], floorMin: 10, floorMax: 20, weight: 1 } }),
      candidate("wrong-floor", { blueprintDiscovery: { kind: "random-drop", sources: ["boss"], floorMin: 11, floorMax: 20, weight: 1 } }),
      candidate("wrong-boss", { blueprintDiscovery: { kind: "random-drop", sources: ["boss"], floorMin: 10, floorMax: 20, weight: 1, bossIds: ["boss-b"] } }),
      candidate("wrong-provenance", { provenances: ["chest"] }),
      candidate("not-published", { blueprintAvailable: false }),
    ];
    const result = rollBlueprintReward({
      blueprints: [], source: "boss", bossId: "boss-a", floor: 10, chance: 1, rng: rngAt(0), catalog,
    });
    expect(result.itemId).toBe("valid");
    expect(result.blueprints).toEqual([{ itemId: "valid", unlocked: true }]);
  });
});
