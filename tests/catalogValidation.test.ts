import { describe, expect, it } from "vitest";
import { BUILDINGS_LIST, BUILDING_UNLOCKS, getBuildingMaxLevel, getBuildingUpgradeCost } from "../src/data/buildings";
import { BOSSES_LIBRARY, MONSTERS_LIBRARY } from "../src/data/monsters";
import { CLASS_INFO_LIST, RACE_INFO_LIST } from "../src/data/heroes";
import { ITEM_LIBRARY, validateUniqueItemIds } from "../src/data/items";
import { SKILLS_LIBRARY } from "../src/data/skills";
import { createModifier, createModifiers, flatModifier, percentModifier } from "../src/data/modifierBuilder";
import { BOSS_LOOT_TABLES_REGISTRY } from "../src/data/bossLootTables";
import { WEAPON_INFO_LIST } from "../src/data/weapons";
import { ARMOR_INFO_LIST } from "../src/data/armors";
import { ACCESSORY_INFO_LIST } from "../src/data/accessories";
import { OFF_HAND_INFO_LIST } from "../src/data/offhands";
import { createAccessory, createArmor, createOffhand, createWeapon } from "../src/data/itemBuilders";
import { buffEffect, damageEffect, debuffEffect, healEffect, lootModifierEffect, statModifierEffect } from "../src/data/skillBuilders";

const unique = (values: string[]) => new Set(values).size === values.length;

describe("catalogue invariants", () => {
  it("keeps buildings unique, bounded and referenced consistently", () => {
    const ids = BUILDINGS_LIST.map((building) => building.id);
    expect(unique(ids)).toBe(true);
    expect(ids.every((id) => getBuildingMaxLevel(id) >= 1)).toBe(true);
    expect(Object.keys(BUILDING_UNLOCKS).every((id) => ids.includes(id))).toBe(true);

    for (const building of BUILDINGS_LIST) {
      const cost = getBuildingUpgradeCost(building.id, 0);
      expect(Object.values(cost).every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
    }
  });

  it("keeps item, race, class, skill and monster registries unique and valid", () => {
    expect(validateUniqueItemIds(ITEM_LIBRARY)).toEqual([]);
    expect(unique(RACE_INFO_LIST.map((race) => race.id))).toBe(true);
    expect(unique(CLASS_INFO_LIST.map((entry) => entry.type))).toBe(true);
    expect(unique(SKILLS_LIBRARY.map((skill) => skill.id))).toBe(true);

    for (const monster of [...MONSTERS_LIBRARY, ...BOSSES_LIBRARY]) {
      expect(monster.name).toBeTruthy();
      expect(monster.atk).toBeGreaterThanOrEqual(0);
      expect(monster.def).toBeGreaterThanOrEqual(0);
      expect(monster.magicDef).toBeGreaterThanOrEqual(0);
      expect(monster.xpYield).toBeGreaterThanOrEqual(0);
      expect(monster.goldYield).toBeGreaterThanOrEqual(0);
    }
  });

  it("creates modifiers with stable defaults and explicit types", () => {
    expect(createModifier("physicalDamage", 2)).toEqual({ stat: "physicalDamage", type: "flat", value: 2 });
    expect(createModifiers([{ stat: "criticalChance", value: 5, type: "percent" }])).toEqual([{ stat: "criticalChance", type: "percent", value: 5 }]);
    expect(flatModifier("goldFind", 3).type).toBe("flat");
    expect(percentModifier("goldFind", 10).type).toBe("percent");
  });

  it("validates equipment registries and boss loot ranges", () => {
    for (const registry of [WEAPON_INFO_LIST, ARMOR_INFO_LIST, ACCESSORY_INFO_LIST, OFF_HAND_INFO_LIST]) {
      expect(unique(registry.map((entry) => entry.id))).toBe(true);
      expect(registry.every((entry) => entry.name && entry.description)).toBe(true);
    }

    for (const [key, table] of Object.entries(BOSS_LOOT_TABLES_REGISTRY)) {
      expect(table.bossName).toBe(key);
      expect(table.goldRange?.[1]).toBeGreaterThanOrEqual(table.goldRange?.[0] ?? 0);
      for (const reward of table.materials) {
        expect(reward.chance).toBeGreaterThanOrEqual(0);
        expect(reward.chance).toBeLessThanOrEqual(1);
        expect(reward.minCount).toBeGreaterThan(0);
        expect(reward.maxCount).toBeGreaterThanOrEqual(reward.minCount);
      }
      for (const reward of [...table.items, ...table.blueprints]) {
        expect(reward.chance).toBeGreaterThanOrEqual(0);
        expect(reward.chance).toBeLessThanOrEqual(1);
        expect(reward.levelMax).toBeGreaterThanOrEqual(reward.levelMin ?? 0);
      }
    }
  });

  it("keeps item and skill builders structurally valid", () => {
    const weapon = createWeapon("test_weapon", "Test", "sword", "common", 1, "Test", 1, 2, 1, []);
    const offhand = createOffhand("test_offhand", "Test", "shield", "common", 1, "Test", []);
    const armor = createArmor("test_armor", "Test", "cloth_armor", "common", 1, "Test", []);
    const accessory = createAccessory("test_accessory", "Test", "ring", "common", 1, "Test", []);
    expect([weapon, offhand, armor, accessory].map((item) => item.itemType)).toEqual(["weapon", "offhand", "armor", "accessory"]);
    expect(damageEffect("physical", "str", 2).type).toBe("damage");
    expect(buffEffect(2, []).type).toBe("buff");
    expect(debuffEffect(2, []).type).toBe("debuff");
    expect(healEffect("wiz", 2).type).toBe("heal");
    expect(statModifierEffect([]).type).toBe("stat_modifier");
    expect(lootModifierEffect([]).type).toBe("loot_modifier");
  });
});
