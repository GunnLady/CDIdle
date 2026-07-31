import { describe, expect, it, vi } from "vitest";
import {
  TIER1_CLASS_EQUIPMENT_POOLS,
  canClassEquipTier1Item,
  getTier1ClassItemDefinition,
  rollTier1ClassEquipment,
  validateTier1ClassEquipmentPools,
  type Tier1ClassType,
} from "../src/data/tier1ClassEquipment";
import { grantTier1ClassEquipment } from "../src/domain/tier1ClassEquipmentReward";
import { getItemById } from "../src/data/items";
import { getHeroStats } from "../src/utils/gameCalculations";
import { makeHero } from "./fixtures/game";

const CLASS_TYPES = Object.keys(TIER1_CLASS_EQUIPMENT_POOLS) as Tier1ClassType[];

describe("Tier 1 class equipment pools", () => {
  it("contains only valid level 10 catalog items with the approved singleton exceptions", () => {
    expect(validateTier1ClassEquipmentPools()).toEqual([]);
    expect(TIER1_CLASS_EQUIPMENT_POOLS["Aède"].weaponIds).toEqual(["basic_lute"]);
    expect(TIER1_CLASS_EQUIPMENT_POOLS.Druide.weaponIds).toEqual(["basic_staff"]);
    for (const classType of CLASS_TYPES.filter((entry) => entry !== "Aède" && entry !== "Druide")) {
      expect(TIER1_CLASS_EQUIPMENT_POOLS[classType].weaponIds.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("consumes one weapon roll and one accessory roll even for a singleton weapon pool", () => {
    const nextInt = vi.fn().mockReturnValue(0);
    expect(rollTier1ClassEquipment("Aède", { nextInt })).toEqual({
      weaponId: "basic_lute",
      accessoryId: "silver_ring",
    });
    expect(nextInt).toHaveBeenNthCalledWith(1, 1);
    expect(nextInt).toHaveBeenNthCalledWith(2, 3);
  });

  it.each(CLASS_TYPES)("restricts every $classType reward to its approved classes", (classType) => {
    const pool = TIER1_CLASS_EQUIPMENT_POOLS[classType];
    for (const itemId of [...pool.weaponIds, ...pool.accessoryIds]) {
      const definition = getTier1ClassItemDefinition(itemId);
      expect(definition?.requiredLevel).toBe(10);
      expect(canClassEquipTier1Item(classType, itemId)).toBe(true);
      expect(definition?.allowedClasses).toContain(classType);
    }
  });

  it.each(CLASS_TYPES)("can deterministically select every $classType pool entry", (classType) => {
    const pool = TIER1_CLASS_EQUIPMENT_POOLS[classType];
    for (let weaponIndex = 0; weaponIndex < pool.weaponIds.length; weaponIndex += 1) {
      for (let accessoryIndex = 0; accessoryIndex < pool.accessoryIds.length; accessoryIndex += 1) {
        const draws = [weaponIndex, accessoryIndex];
        expect(rollTier1ClassEquipment(classType, {
          nextInt: () => draws.shift() ?? 0,
        })).toEqual({
          weaponId: pool.weaponIds[weaponIndex],
          accessoryId: pool.accessoryIds[accessoryIndex],
        });
      }
    }
  });

  it("gives every selected accessory a real canonical effect", () => {
    const accessoryIds = [...new Set(CLASS_TYPES.flatMap(
      (classType) => [...TIER1_CLASS_EQUIPMENT_POOLS[classType].accessoryIds],
    ))];
    const hero = makeHero({
      level: 10,
      baseStats: { str: 50, agi: 50, end: 50, int: 50, wiz: 50, dex: 50, luk: 50 },
      equipment: {},
    });
    const baseline = getHeroStats(hero);

    for (const itemId of accessoryIds) {
      const item = getItemById(itemId);
      expect(item?.modifiers.some((modifier) => modifier.stat === "luck")).toBe(false);
      expect(getHeroStats({
        ...hero,
        equipment: {
          accessory: { instanceId: `test-${itemId}`, itemId, rarity: "common" },
        },
      }), itemId).not.toEqual(baseline);
    }
  });

  it.each([
    ["lucky_charm", "criticalChance", 3],
    ["cracked_coin_charm", "dodgeChance", 3],
    ["gilded_fortune_charm", "dodgeChance", 5],
    ["three_knots_charm", "criticalChance", 5],
  ] as const)("replaces the obsolete luck modifier on %s", (itemId, stat, value) => {
    const item = getItemById(itemId);
    expect(item?.modifiers).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ stat: "luck" }),
    ]));
    expect(item?.modifiers).toEqual(expect.arrayContaining([
      expect.objectContaining({ stat, type: "percent", value }),
    ]));
  });

  it("equips deterministic instances and returns displaced gear including an off-hand", () => {
    const hero = makeHero({
      id: "hero-warrior",
      level: 10,
      classType: "Guerrier",
      equipment: {
        mainHand: { instanceId: "old-weapon", itemId: "starter_sword", rarity: "common" },
        offHand: { instanceId: "old-shield", itemId: "wooden_shield", rarity: "common" },
        accessory: { instanceId: "old-accessory", itemId: "lucky_charm", rarity: "common" },
      },
    });
    const storedItems: Array<{ instanceId: string; itemId: string; rarity: "common" }> = [];
    const draws = [3, 0]; // basic_spear (two-handed), sturdy_travel_belt
    const result = grantTier1ClassEquipment(hero, "Guerrier", {
      nextInt: () => draws.shift() ?? 0,
    }, storedItems);

    expect(result.hero.equipment).toMatchObject({
      mainHand: { instanceId: "item:hero-warrior:tier1:weapon", itemId: "basic_spear" },
      offHand: null,
      accessory: { instanceId: "item:hero-warrior:tier1:accessory", itemId: "sturdy_travel_belt" },
    });
    expect(storedItems).toEqual([]);
    expect(result.storedItems.map((entry) => entry.instanceId)).toEqual([
      "old-weapon",
      "old-accessory",
      "old-shield",
    ]);
    expect(result.reward.returnedInstanceIds).toEqual(["old-weapon", "old-accessory", "old-shield"]);
    expect(result.hero.currentHp).toBe(result.hero.calculatedStats.maxHp);
    expect(result.hero.currentMana).toBe(result.hero.calculatedStats.maxMana);
  });

  it("reuses deterministic reward instances already stored instead of duplicating them", () => {
    const hero = makeHero({ id: "hero-aede", level: 10, classType: "Aède", equipment: {} });
    const storedItems = [
      { instanceId: "item:hero-aede:tier1:weapon", itemId: "basic_lute", rarity: "common" as const },
      { instanceId: "item:hero-aede:tier1:accessory", itemId: "silver_ring", rarity: "common" as const },
    ];
    const result = grantTier1ClassEquipment(hero, "Aède", { nextInt: () => 0 }, storedItems);

    expect(storedItems).toHaveLength(2);
    expect(result.storedItems).toEqual([]);
    expect(result.hero.equipment?.mainHand?.instanceId).toBe("item:hero-aede:tier1:weapon");
    expect(result.hero.equipment?.accessory?.instanceId).toBe("item:hero-aede:tier1:accessory");
  });

  it("keeps another instance of the selected model and still grants the deterministic reward", () => {
    const hero = makeHero({ id: "hero-aede", level: 10, classType: "A\u00e8de", equipment: {} });
    const storedItems = [
      { instanceId: "loot-lute", itemId: "basic_lute", rarity: "common" as const },
      { instanceId: "loot-ring", itemId: "silver_ring", rarity: "common" as const },
    ];
    const result = grantTier1ClassEquipment(hero, "A\u00e8de", { nextInt: () => 0 }, storedItems);

    expect(storedItems.map((entry) => entry.instanceId)).toEqual(["loot-lute", "loot-ring"]);
    expect(result.storedItems.map((entry) => entry.instanceId)).toEqual(["loot-lute", "loot-ring"]);
    expect(result.hero.equipment?.mainHand).toMatchObject({
      instanceId: "item:hero-aede:tier1:weapon",
      itemId: "basic_lute",
    });
    expect(result.hero.equipment?.accessory).toMatchObject({
      instanceId: "item:hero-aede:tier1:accessory",
      itemId: "silver_ring",
    });
  });
});
