import { describe, expect, it } from "vitest";
import type { Monster } from "../src/types";
import {
  applyMonsterDefenseOrResistance,
  applySplitDamageDefenseOrResistance,
  getHeroDefenseAgainstDamageType,
} from "../src/utils/gameCalculations";
import { makeHero } from "./fixtures/game";

function monster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: "mitigation-target",
    name: "Cible de mitigation",
    hp: 100,
    maxHp: 100,
    atk: 10,
    damageType: "physical",
    def: 10,
    magicDef: 20,
    xpYield: 0,
    goldYield: 0,
    image: "",
    isBoss: false,
    ...overrides,
  };
}

describe("monster damage mitigation", () => {
  it("applies physical defense to physical damage", () => {
    expect(applyMonsterDefenseOrResistance(100, "physical", monster())).toBe(90);
  });

  it("uses magic defense as the base of elemental defense", () => {
    const target = monster({ resistances: { fire: 25 } });
    expect(applyMonsterDefenseOrResistance(100, "fire", target)).toBe(75);
  });

  it("reduces elemental defense for vulnerabilities", () => {
    const target = monster({ resistances: { holy: -25 } });
    expect(applyMonsterDefenseOrResistance(100, "holy", target)).toBe(85);
  });

  it("shares magic defense across multiple elemental parts of one strike", () => {
    const target = monster({ magicDef: 20, resistances: { fire: 0, ice: 0 } });
    expect(applySplitDamageDefenseOrResistance(100, ["fire", "ice"], target)).toBe(80);
  });

  it("applies each relevant defense to a physical and magical hybrid strike", () => {
    const target = monster({ def: 10, magicDef: 20, resistances: { fire: 0 } });
    expect(applySplitDamageDefenseOrResistance(100, ["physical", "fire"], target)).toBe(70);
  });

  it("uses a hero elemental defense and preserves temporary magic defense changes", () => {
    const baseStats = {
      ...makeHero().calculatedStats,
      magicDefense: 20,
      resistances: { ...makeHero().calculatedStats.resistances, fire: 30 },
    };
    const effectiveStats = { ...baseStats, magicDefense: 25 };
    expect(getHeroDefenseAgainstDamageType(baseStats, effectiveStats, "fire")).toBe(35);
    expect(getHeroDefenseAgainstDamageType(baseStats, effectiveStats, "physical"))
      .toBe(effectiveStats.physicalDefense);
  });
});
