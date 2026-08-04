import { describe, expect, it } from "vitest";
import {
  advanceTemporaryCombatEffects,
  applyTemporaryCombatEffect,
  getEffectiveHeroStats,
  getEffectiveMonster,
  getEffectiveHealingMultiplier,
  getForcedTargetHeroIds,
  isHeroCombatModifierApplicable,
  isMonsterCombatModifierApplicable,
  type TemporaryCombatEffect,
} from "../src/domain/combatEffects";
import { makeHero } from "./fixtures/game";
import { SKILLS_LIBRARY } from "../src/data/skills";

const guard: TemporaryCombatEffect = {
  sourceSkillId: "guard_stance",
  sourceHeroId: "hero-a",
  targetId: "hero-a",
  targetSide: "hero",
  remainingRounds: 2,
  modifiers: [
    { stat: "physicalDefense", type: "percent", value: 25 },
    { stat: "forcedTarget", type: "percent", value: 50 },
  ],
};

describe("temporary combat effects", () => {
  it("applies cumulative passive healing power", () => {
    const healer = makeHero({ passiveSkills: ["healing_grace", "verdant_healing"] });
    expect(getEffectiveHealingMultiplier(healer, [])).toBeCloseTo(1.16);
  });

  it("applies supported modifiers without mutating persisted hero stats", () => {
    const hero = makeHero({ id: "hero-a" });
    const before = hero.calculatedStats.physicalDefense;
    const effective = getEffectiveHeroStats(hero, [guard]);
    expect(effective.physicalDefense).toBe(before * 1.25);
    expect(hero.calculatedStats.physicalDefense).toBe(before);
    expect(getForcedTargetHeroIds([guard])).toEqual([hero.id]);
  });

  it("applies relevant debuffs to the monster", () => {
    const monster = {
      id: "monster-a", name: "Test", hp: 100, maxHp: 100, atk: 40,
      damageType: "physical" as const, def: 20, magicDef: 10,
      xpYield: 0, goldYield: 0, image: "", isBoss: false,
    };
    const debuff: TemporaryCombatEffect = {
      sourceSkillId: "weakening_shout",
      sourceHeroId: "hero-a",
      targetId: monster.id,
      targetSide: "monster",
      remainingRounds: 2,
      modifiers: [{ stat: "physicalDamage", type: "percent", value: -20 }],
    };
    expect(getEffectiveMonster(monster, [debuff]).atk).toBe(32);
  });

  it("refreshes the same source and target instead of stacking it", () => {
    const refreshed = applyTemporaryCombatEffect([guard], {
      ...guard,
      sourceHeroId: "hero-b",
      remainingRounds: 4,
    });
    expect(refreshed).toHaveLength(1);
    expect(refreshed[0].remainingRounds).toBe(4);
    expect(refreshed[0].sourceHeroId).toBe("hero-b");
  });

  it("stacks different skills additively on the same target", () => {
    const second = {
      ...guard,
      sourceSkillId: "sacred_barrier",
      modifiers: [{ stat: "physicalDefense", type: "percent" as const, value: 35 }],
    };
    const hero = makeHero({ id: "hero-a" });
    const effects = applyTemporaryCombatEffect([guard], second);
    expect(effects).toHaveLength(2);
    expect(getEffectiveHeroStats(hero, effects).physicalDefense)
      .toBe(hero.calculatedStats.physicalDefense * 1.6);
  });

  it("decrements durations and removes expired effects", () => {
    expect(advanceTemporaryCombatEffects([guard])).toMatchObject([{ remainingRounds: 1 }]);
    expect(advanceTemporaryCombatEffects([{ ...guard, remainingRounds: 1 }])).toEqual([]);
  });

  it("distinguishes modifiers supported by heroes and monsters", () => {
    expect(isHeroCombatModifierApplicable({ stat: "speed", type: "percent", value: 10 })).toBe(true);
    expect(isMonsterCombatModifierApplicable({ stat: "speed", type: "percent", value: -10 })).toBe(false);
    expect(isMonsterCombatModifierApplicable({ stat: "magicDamage", type: "percent", value: -10 })).toBe(true);
  });

  it("keeps every active debuff applicable to authoritative monster stats", () => {
    const debuffs = SKILLS_LIBRARY.filter((skill) => skill.effect.type === "debuff");
    expect(debuffs.length).toBeGreaterThan(0);
    for (const skill of debuffs) {
      if (skill.effect.type !== "debuff") continue;
      expect(
        skill.effect.modifiers.some(isMonsterCombatModifierApplicable),
        `${skill.id} has no applicable monster modifier`,
      ).toBe(true);
    }
  });
});
