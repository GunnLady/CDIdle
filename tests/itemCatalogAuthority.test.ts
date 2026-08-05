import { describe, expect, it } from "vitest";
import {
  CHEST_LOOT_BANDS,
  ITEM_LIBRARY,
  RARITY_ORDER,
  eligibleCatalogItems,
  getChestLootBand,
  getItemSlot,
  rarityRank,
  resolveEligibleCatalogDrop,
  rollWeightedRarity,
  validateItemCatalog,
} from "../shared/domain/items/items";
import { applyInventoryCommand } from "../supabase/functions/game-api/inventory-authority";
import { initialTownState, migrateTownState } from "../supabase/functions/game-api/town-authority";
import { resolveAuthoritativeDungeonEncounter } from "../src/domain/authoritativeDungeon";
import { applyItemRarityScaling } from "../shared/domain/items/scaling";
import { resolveAuthoritativeNoviceItemModifiers } from "../supabase/functions/game-api/novice-stats-authority";
import type { Rng } from "../src/domain/random";
import { makeHero, makeResources } from "./fixtures/game";

describe("authoritative item catalog", () => {
  it("keeps the approved chest bands contiguous and weighted to 100", () => {
    expect(CHEST_LOOT_BANDS.map((band) => [band.floorMin, band.floorMax, band.levelMin, band.levelMax])).toEqual([
      [1, 5, 1, 10],
      [6, 10, 10, 20],
      [11, 20, 10, 25],
      [21, 30, 20, 33],
      [31, Number.POSITIVE_INFINITY, 24, 33],
    ]);
    for (const band of CHEST_LOOT_BANDS) {
      expect(Object.values(band.weights).reduce((sum, value) => sum + value, 0)).toBe(100);
      expect(getChestLootBand(band.floorMin)).toBe(band);
      if (Number.isFinite(band.floorMax)) expect(getChestLootBand(band.floorMax)).toBe(band);
    }
  });

  it("rolls every rarity at the approved boundaries", () => {
    for (const band of CHEST_LOOT_BANDS) {
      let cursor = 0;
      for (const rarity of RARITY_ORDER) {
        const weight = band.weights[rarity];
        if (weight > 0) {
          expect(rollWeightedRarity(band.weights, (cursor + weight / 2) / 100)).toBe(rarity);
        }
        cursor += weight;
      }
    }
  });

  it("filters level, provenance and minimum rarity before selecting a model", () => {
    for (const band of CHEST_LOOT_BANDS) {
      for (const rarity of RARITY_ORDER) {
        const candidates = eligibleCatalogItems({
          rarity,
          levelMin: band.levelMin,
          levelMax: band.levelMax,
          provenance: "chest",
        });
        expect(candidates.every((item) => (
          item.requiredLevel >= band.levelMin
          && item.requiredLevel <= band.levelMax
          && rarityRank(item.minimumRarity) <= rarityRank(rarity)
        ))).toBe(true);
      }
    }
  });

  it("promotes an impossible late-floor rarity without violating minimum rarity", () => {
    const drop = resolveEligibleCatalogDrop({
      rarity: "uncommon",
      levelMin: 24,
      levelMax: 33,
      provenance: "chest",
    });
    expect(drop?.rarity).toBe("epic");
    expect(drop?.candidates).toHaveLength(10);
    expect(drop?.candidates.every((item) => item.minimumRarity === "epic")).toBe(true);
  });

  it("lets every model be equipped by any class when level and slot permit it", () => {
    for (const item of ITEM_LIBRARY) {
      const hero = makeHero({
        id: `hero-${item.id}`,
        classType: "Mage",
        level: 100,
        equipment: {},
      });
      const instance = { instanceId: `instance-${item.id}`, itemId: item.id, rarity: item.minimumRarity };
      const result = applyInventoryCommand({ ...initialTownState(42), heroes: [hero], storedItems: [instance] }, {
        type: "hero.equip",
        heroId: hero.id,
        instanceId: instance.instanceId,
      });
      expect((result.state.heroes as typeof hero[])[0].equipment?.[getItemSlot(item)]?.itemId).toBe(item.id);
      expect(result.state.storedItems).toEqual([]);
    }
  });

  it("refuses unknown persisted references explicitly", () => {
    expect(() => migrateTownState({
      storedItems: [{ instanceId: "unknown-instance", itemId: "unknown-model", rarity: "common" }],
    })).toThrow(/unknown-model/);
    expect(() => migrateTownState({
      pendingForge: { previewId: "legacy-preview", itemId: "unknown-pending-model" },
    })).toThrow(/unknown-pending-model/);
  });

  it("uses identical rarity modifiers in the shared renderer and server stats", () => {
    for (const itemId of ["starter_sword", "basic_staff", "embercleaver_greataxe"]) {
      const item = ITEM_LIBRARY.find((entry) => entry.id === itemId)!;
      for (const rarity of RARITY_ORDER.slice(rarityRank(item.minimumRarity))) {
        expect(resolveAuthoritativeNoviceItemModifiers(item.id, rarity)).toEqual(
          applyItemRarityScaling(item, rarity).modifiers,
        );
      }
    }
  });

  it("maps physical armor protection to the calculated physical defense", () => {
    for (const [itemId, value] of [
      ["ironbound_hauberk", 5],
      ["bulwark_plate", 8],
      ["iron_thread_gi", 6],
    ] as const) {
      const modifiers = resolveAuthoritativeNoviceItemModifiers(itemId, "common");
      expect(modifiers).toContainEqual({ stat: "physicalDefense", type: "percent", value });
      expect(modifiers.some((modifier) => modifier.stat === "physicalResistance")).toBe(false);
    }
  });

  it("rejects catalog modifiers that the canonical stat calculator cannot apply", () => {
    const item = ITEM_LIBRARY.find((entry) => entry.id === "starter_sword")!;
    expect(validateItemCatalog([{
      ...item,
      modifiers: [{ stat: "physicalResistance", type: "percent", value: 5 }],
    }])).toContain("starter_sword:INVALID_MODIFIER");
  });

  it("rejects persisted item constraints that contradict the catalog", () => {
    const aboveCommon = ITEM_LIBRARY.find((item) => rarityRank(item.minimumRarity) > 0)!;
    expect(() => migrateTownState({
      ...initialTownState(),
      storedItems: [{ instanceId: "below-minimum", itemId: aboveCommon.id, rarity: "common" }],
    })).toThrow(/minimum rarity/);

    expect(() => migrateTownState({
      ...initialTownState(),
      heroes: [makeHero({
        level: 100,
        equipment: { armor: { instanceId: "wrong-slot", itemId: "starter_sword", rarity: "common" } },
      })],
    })).toThrow(/incompatible with slot armor/);

    expect(() => migrateTownState({
      ...initialTownState(),
      heroes: [makeHero({
        level: 1,
        equipment: { mainHand: { instanceId: "too-high", itemId: "basic_staff", rarity: "common" } },
      })],
    })).toThrow(/requires level 10/);

    expect(() => migrateTownState({
      ...initialTownState(),
      heroes: [makeHero({
        level: 10,
        equipment: {
          mainHand: { instanceId: "two-handed", itemId: "basic_staff", rarity: "common" },
          offHand: { instanceId: "shield", itemId: "wooden_shield", rarity: "common" },
        },
      })],
    })).toThrow(/conflicts with two-handed mainHand/);

    expect(() => migrateTownState({
      ...initialTownState(),
      pendingForge: {
        previewId: "mismatched-preview",
        recipeId: "quick_dagger",
        itemId: "starter_sword",
        itemType: "weapon",
        upgradeProc: "none",
      },
    })).toThrow(/does not match itemId/);
  });

  it("rejects duplicate persisted blueprints", () => {
    expect(() => migrateTownState({
      ...initialTownState(),
      itemBlueprints: [
        { itemId: "starter_sword", unlocked: true },
        { itemId: "starter_sword", unlocked: true },
      ],
    })).toThrow(/itemId must be unique/);
  });

  it.each([1, 5, 6, 10, 11, 20, 21, 30, 31])(
    "resolves a canonical treasure item at chest-band boundary floor %i",
    (floor) => {
    const values = [0.94, 0.90, 0.00, 0.00, 0.10, 0.00];
    let cursor = 0;
    const consume = () => values[cursor++];
    const rng: Rng = { next: consume, nextInt: (max) => Math.floor(consume() * max) };
    const result = resolveAuthoritativeDungeonEncounter({
      ...initialTownState(42),
      activeDungeonFloor: floor,
      activeDungeonRoom: 1,
      highestFloorReached: floor,
      resources: makeResources({ gold: 0 }),
      buildings: { maison_chef: 0 },
      heroes: [makeHero()],
      storedItems: [],
      forgeMaterials: [],
      itemBlueprints: [],
    }, `band-treasure-${floor}`, rng);
    const instance = result.state.storedItems?.[0];
    expect(cursor).toBe(6);
    if (floor === 31) expect(instance?.rarity).toBe("epic");
    const model = ITEM_LIBRARY.find((item) => item.id === instance?.itemId)!;
    const band = getChestLootBand(floor);
    expect(model.requiredLevel).toBeGreaterThanOrEqual(band.levelMin);
    expect(model.requiredLevel).toBeLessThanOrEqual(band.levelMax);
    expect(rarityRank(instance!.rarity)).toBeGreaterThanOrEqual(rarityRank(model.minimumRarity));
  });

  it.each([
    [10, "Giga Gobelin 'Roi des Déchets'"],
    [20, "Chef de Meute Orc Blindé"],
    [30, "Gardien du Portail en Obsidienne"],
    [40, "La Liche Éternelle 'Malakor'"],
    [50, "Sinueux Dragon Rouge Primordial"],
  ] as const)("applies the boss table for floor %i", (floor, bossName) => {
    const rng: Rng = { next: () => 0, nextInt: () => 0 };
    const hero = makeHero({
      id: `boss-hero-${floor}`,
      currentHp: 100_000,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100_000,
        hp: 100_000,
        physicalDamage: 1_000_000,
        magicDamage: 1_000_000,
        speed: 100,
        criticalChance: 0,
      },
    });
    const source = {
      ...initialTownState(42),
      activeDungeonFloor: floor,
      activeDungeonRoom: 50,
      highestFloorReached: floor,
      resources: makeResources({ gold: 0 }),
      buildings: { maison_chef: 0 },
      heroes: [hero],
      storedItems: [],
      forgeMaterials: [],
      itemBlueprints: [],
    };
    const result = resolveAuthoritativeDungeonEncounter(source, `boss-${floor}`, rng);
    const replay = resolveAuthoritativeDungeonEncounter(source, `boss-${floor}`, rng);

    expect(replay).toEqual(result);
    expect(result.encounter.enemy?.name).toBe(bossName);
    expect(result.encounter.outcome).toBe("victory");
    expect(result.encounter.rewards.gold).toBeGreaterThan(0);
    expect(result.encounter.rewards.loot.some((entry) => entry.type === "material")).toBe(true);
    expect(result.encounter.rewards.loot.some((entry) => entry.type === "item")).toBe(true);
    expect(result.encounter.rewards.loot.some((entry) => entry.type === "blueprint")).toBe(true);
    const blueprintIds = result.state.itemBlueprints?.map((entry) => entry.itemId) ?? [];
    expect(new Set(blueprintIds).size).toBe(blueprintIds.length);
  });
});
