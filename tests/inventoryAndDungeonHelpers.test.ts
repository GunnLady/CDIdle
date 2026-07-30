import { describe, expect, it } from "vitest";
import { getEncounterDetails, getEncounterStatPresentation, rollEncounterForgeMaterial, selectBestHeroForEncounter, applyLootModifiers } from "../src/utils/dungeonHelpers";
import { SKILLS_LIBRARY } from "../src/data/skills";
import { makeHero } from "./fixtures/game";

const rng = (value: number) => ({ next: () => value, nextInt: () => 0 });

describe("inventory and dungeon helper edge cases", () => {
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
