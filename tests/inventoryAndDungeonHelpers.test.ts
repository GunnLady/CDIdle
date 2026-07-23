import { describe, expect, it } from "vitest";
import { addStack, equipStoredItem, removeStack, unequipStoredItem, type InventoryState } from "../src/domain/inventory";
import { getEncounterDetails, getEncounterStatPresentation, rollEncounterForgeMaterial, selectBestHeroForEncounter, applyLootModifiers } from "../src/utils/dungeonHelpers";
import { SKILLS_LIBRARY } from "../src/data/skills";
import { makeHero, makeStoredItem } from "./fixtures/game";

const rng = (value: number) => ({ next: () => value, nextInt: () => 0 });

const inventory = (overrides: Partial<InventoryState> = {}): InventoryState => ({
  heroes: [makeHero()],
  storedItems: [makeStoredItem({ itemId: "starter_sword" })],
  ...overrides,
});

describe("inventory and dungeon helper edge cases", () => {
  it("covers invalid, missing, equip and unequip inventory paths", () => {
    const state = inventory();
    expect(addStack(state, "", "common", 1)).toMatchObject({ ok: false, error: "INVALID_COUNT" });
    expect(removeStack(state, "missing", "common", 1)).toMatchObject({ ok: false, error: "ITEM_NOT_FOUND" });
    expect(equipStoredItem(state, "missing", "starter_sword", "common")).toMatchObject({ ok: false, error: "HERO_NOT_FOUND" });
    expect(equipStoredItem(state, "hero-fixture", "missing", "common")).toMatchObject({ ok: false, error: "ITEM_NOT_FOUND" });

    const equipped = equipStoredItem(state, "hero-fixture", "starter_sword", "common");
    expect(equipped.ok).toBe(true);
    if (!equipped.ok) return;
    expect(equipped.state.heroes[0].equipment?.mainHand?.itemId).toBe("starter_sword");
    expect(unequipStoredItem(equipped.state, "hero-fixture", "mainHand")).toMatchObject({ ok: true });
    expect(unequipStoredItem(state, "missing", "mainHand")).toMatchObject({ ok: false, error: "HERO_NOT_FOUND" });
  });

  it("covers dungeon reward tiers and stat selection", () => {
    expect(rollEncounterForgeMaterial(1, rng(0.1)).rarity).toBe("uncommon");
    expect(rollEncounterForgeMaterial(25, rng(0.1)).rarity).toBe("rare");
    expect(rollEncounterForgeMaterial(50, rng(0.1)).rarity).toBe("epic");
    expect(rollEncounterForgeMaterial(75, rng(0.1)).rarity).toBe("legendary");
    expect(getEncounterDetails("trap")).not.toBeNull();
    expect(getEncounterStatPresentation("trap")).toMatchObject({ statA: "agi", statB: "dex" });
    expect(selectBestHeroForEncounter([], "str", "agi")).toBeNull();
    expect(selectBestHeroForEncounter([makeHero({ id: "weak", baseStats: { str: 1, agi: 1, end: 1, int: 1, wiz: 1, dex: 1, luk: 1 } }), makeHero({ id: "strong", baseStats: { str: 9, agi: 9, end: 1, int: 1, wiz: 1, dex: 1, luk: 1 } })], "str", "agi")?.bestHero.id).toBe("strong");
  });

  it("applies only matching passive loot modifiers", () => {
    const passive = SKILLS_LIBRARY.find((skill) => skill.effect.type === "loot_modifier");
    expect(passive).toBeDefined();
    if (!passive) return;
    const hero = makeHero({ passiveSkills: [passive.id], isActive: true });
    expect(applyLootModifiers("gold", 10, [hero])).toBeGreaterThanOrEqual(10);
    expect(applyLootModifiers("unrelated", 10, [hero])).toBe(10);
  });
});
