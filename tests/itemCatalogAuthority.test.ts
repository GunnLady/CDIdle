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
      [1, 2, 1, 1],
      [3, 7, 1, 5],
      [8, 10, 6, 10],
      [11, 17, 11, 15],
      [18, 25, 16, 20],
      [26, 35, 21, 25],
      [36, 48, 26, 30],
      [49, 61, 31, 35],
      [62, Number.POSITIVE_INFINITY, 36, 40],
    ]);
    for (const band of CHEST_LOOT_BANDS.slice(1)) {
      expect(band.levelMax - band.levelMin + 1).toBe(5);
    }
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
          item.catalogStatus === 'active'
          && item.levelRange.max >= band.levelMin
          && item.levelRange.min <= band.levelMax
          && rarityRank(item.minimumRarity) <= rarityRank(rarity)
        ))).toBe(true);
      }
    }
  });

  it("keeps every late-floor rarity viable through scalable common bases", () => {
    const drop = resolveEligibleCatalogDrop({
      rarity: "uncommon",
      levelMin: 24,
      levelMax: 33,
      provenance: "chest",
    });
    expect(drop?.rarity).toBe('uncommon');
    expect(drop?.candidates).toHaveLength(48);
    expect(drop?.candidates.every((item) => item.powerModelId === 'level-bands-v1')).toBe(true);
  });

  it("lets every model be equipped by any class when level and slot permit it", () => {
    for (const item of ITEM_LIBRARY) {
      const hero = makeHero({
        id: `hero-${item.id}`,
        classType: "Mage",
        level: 100,
        equipment: {},
      });
      const instance = {
        instanceId: `instance-${item.id}`,
        itemId: item.id,
        itemLevel: item.levelRange.min,
        powerModelId: item.powerModelId,
        rarity: item.minimumRarity,
      };
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
      pendingForge: {
        previewId: "legacy-preview",
        recipeId: "unknown-pending-model",
        itemId: "unknown-pending-model",
        itemType: "weapon",
        offeredRarity: "common",
      },
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
      storedItems: [{ instanceId: 'below-minimum', itemId: aboveCommon.id, itemLevel: aboveCommon.requiredLevel, powerModelId: aboveCommon.powerModelId, rarity: 'common' }],
    })).toThrow(/minimum rarity/);

    expect(() => migrateTownState({
      ...initialTownState(),
      heroes: [makeHero({
        equipment: { armor: { instanceId: 'wrong-slot', itemId: 'starter_sword', itemLevel: 1, powerModelId: 'legacy-fixed-v1', rarity: 'common' } },
      })],
    })).toThrow(/incompatible with slot armor/);

    expect(() => migrateTownState({
      ...initialTownState(),
      heroes: [makeHero({
        level: 1,
        equipment: { mainHand: { instanceId: 'too-high', itemId: 'basic_staff', itemLevel: 10, powerModelId: 'legacy-fixed-v1', rarity: 'common' } },
      })],
    })).toThrow(/requires level 10/);

    expect(() => migrateTownState({
      ...initialTownState(),
      heroes: [makeHero({
        level: 10,
        xpNeeded: 1_061,
        equipment: {
          mainHand: { instanceId: 'two-handed', itemId: 'basic_staff', itemLevel: 10, powerModelId: 'legacy-fixed-v1', rarity: 'common' },
          offHand: { instanceId: 'shield', itemId: 'wooden_shield', itemLevel: 1, powerModelId: 'legacy-fixed-v1', rarity: 'common' },
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
        itemLevel: 1,
        powerModelId: 'legacy-fixed-v1',
        offeredRarity: "common",
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

  it.each([1, 2, 3, 7, 8, 10, 11, 17, 18, 25, 26, 35, 36, 48, 49, 61, 62])(
    "resolves a canonical treasure item at chest-band boundary floor %i",
    (floor) => {
    const values = [0.94, 0.90, 0.00, 0.00, 0.10, 0.00, 0.50, 0.99];
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
      heroes: [makeHero({ xpNeeded: 1_000_000_000 })],
      storedItems: [],
      forgeMaterials: [],
      itemBlueprints: [],
    }, `band-treasure-${floor}`, rng, {
      xpCurve: {
        kind: "level-banded",
        levelBands: [{ firstDestinationLevel: 2, firstLevelXp: 1_000_000_000, growthFactor: 1 }],
      },
    });
    const instance = result.state.storedItems?.[0];
    expect(cursor).toBe(floor <= 2 ? 7 : 8);
    const model = ITEM_LIBRARY.find((item) => item.id === instance?.itemId)!;
    const band = getChestLootBand(floor);
    expect(instance?.itemLevel).toBeGreaterThanOrEqual(band.levelMin);
    expect(instance?.itemLevel).toBeLessThanOrEqual(band.levelMax);
    expect(instance?.itemLevel).toBeGreaterThanOrEqual(model.levelRange.min);
    expect(instance?.itemLevel).toBeLessThanOrEqual(model.levelRange.max);
    expect(instance?.powerModelId).toBe(model.powerModelId);
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
    expect(result.encounter.rewards.loot.filter((entry) => entry.type === "item")).toHaveLength(3);
    expect(result.encounter.rewards.loot.some((entry) => entry.type === "blueprint")).toBe(true);
    const blueprintIds = result.state.itemBlueprints?.map((entry) => entry.itemId) ?? [];
    expect(new Set(blueprintIds).size).toBe(blueprintIds.length);
  });
});
