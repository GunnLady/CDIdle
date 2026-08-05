import { describe, expect, it } from "vitest";
import type { Hero, Monster } from "../src/types";
import {
  chooseHeroAction,
  deriveManaReserve,
  listLegalHeroActions,
} from "../src/domain/combatTactics";
import { makeHero } from "./fixtures/game";

function monster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: "monster-test",
    name: "Menace test",
    hp: 200,
    maxHp: 200,
    atk: 30,
    damageType: "physical",
    def: 2,
    magicDef: 2,
    xpYield: 0,
    goldYield: 0,
    image: "",
    isBoss: false,
    ...overrides,
  };
}

function hero(overrides: Partial<Hero> = {}): Hero {
  return makeHero({
    id: "hero-test",
    name: "Tacticien",
    currentMana: 100,
    activeSkills: ["heavy_blow"],
    calculatedStats: {
      ...makeHero().calculatedStats,
      maxHp: 100,
      hp: 100,
      maxMana: 100,
      physicalDamage: 30,
      magicDamage: 30,
      physicalDefense: 5,
      magicDefense: 5,
      criticalChance: 0,
      speed: 0,
    },
    currentHp: 100,
    ...overrides,
  });
}

function context(actor: Hero, enemy = monster(), heroes = [actor]) {
  return { hero: actor, heroes, monster: enemy, floor: 1, room: 1, finalRoom: 5, round: 1 };
}

describe("deterministic combat tactics", () => {
  it("falls back to the normal attack when mana or cooldown forbids a skill", () => {
    expect(chooseHeroAction(context(hero({ currentMana: 0 }))).kind).toBe("normal_attack");
    expect(chooseHeroAction(context(hero({ cooldowns: { heavy_blow: 2 } }))).kind).toBe("normal_attack");
  });

  it("uses a lethal skill when the normal attack would leave an enemy turn", () => {
    const chosen = chooseHeroAction(context(hero(), monster({ hp: 45, maxHp: 200 })));
    expect(chosen).toMatchObject({ kind: "skill", skillId: "heavy_blow", reason: "skill_prevents_enemy_turn" });
  });

  it("preserves enough mana for a known recovery action", () => {
    const actor = hero({ activeSkills: ["heavy_blow", "minor_heal"], currentMana: 37 });
    expect(deriveManaReserve(context(actor))).toBe(24);
    expect(chooseHeroAction(context(actor, monster({ hp: 200 }))).kind).toBe("normal_attack");
  });

  it("chooses independently from active-skill storage order without consuming RNG", () => {
    const first = hero({ activeSkills: ["double_cut", "quick_shiv"], currentMana: 100 });
    const second = hero({ activeSkills: ["quick_shiv", "double_cut"], currentMana: 100 });
    const firstChoice = chooseHeroAction(context(first, monster({ hp: 120 })));
    const secondChoice = chooseHeroAction(context(second, monster({ hp: 120 })));
    expect(firstChoice).toEqual(secondChoice);
  });

  it("prioritizes a single heal that prevents a probable death", () => {
    const healer = hero({ id: "healer", activeSkills: ["minor_heal"], currentMana: 100 });
    const target = hero({ id: "target", currentHp: 10, isActive: true });
    const chosen = chooseHeroAction(context(healer, monster({ atk: 40 }), [healer, target]));
    expect(chosen).toMatchObject({ kind: "skill", targetHeroId: "target", reason: "heal_prevents_death" });
  });

  it("does not heal minor wounds or recast an active effect", () => {
    const healer = hero({ activeSkills: ["minor_heal"] });
    const lightlyInjured = hero({ id: "target", currentHp: 90 });
    expect(chooseHeroAction(context(healer, monster(), [healer, lightlyInjured])).kind).toBe("normal_attack");

    const defender = hero({ activeSkills: ["guard_stance"] });
    const effect = {
      sourceSkillId: "guard_stance",
      sourceHeroId: defender.id,
      targetId: defender.id,
      targetSide: "hero" as const,
      remainingRounds: 2,
      modifiers: [{ stat: "physicalDefense", type: "percent" as const, value: 25 }],
    };
    const actions = listLegalHeroActions({
      ...context(defender, monster({ hp: 1_000, maxHp: 1_000, isBoss: true })),
      activeEffects: [effect],
    });
    expect(actions.some((candidate) => candidate.skillId === "guard_stance")).toBe(false);
    const expiringActions = listLegalHeroActions({
      ...context(defender, monster({ hp: 1_000, maxHp: 1_000, isBoss: true })),
      activeEffects: [{ ...effect, remainingRounds: 1 }],
    });
    expect(expiringActions.some((candidate) => candidate.skillId === "guard_stance")).toBe(false);
  });

  it("reserves one priority recovery action and releases it in the boss room", () => {
    const actor = hero({ activeSkills: ["heavy_blow", "minor_heal"] });
    const firstRoom = deriveManaReserve(context(actor));
    const bossRoom = deriveManaReserve({ ...context(actor), room: 5 });
    expect(firstRoom).toBe(24);
    expect(bossRoom).toBe(0);
  });

  it("keeps the reserve tied to an action cost instead of room progress", () => {
    const actor = hero({ activeSkills: ["minor_heal"] });
    const early = deriveManaReserve({ ...context(actor), room: 1, finalRoom: 10 });
    const late = deriveManaReserve({ ...context(actor), room: 9, finalRoom: 10 });
    expect(early).toBe(24);
    expect(late).toBe(24);
  });

  it("compares elemental skills after the monster resistances", () => {
    const actor = hero({ activeSkills: ["fire_bolt", "stone_spike"] });
    const resistant = monster({
      hp: 500,
      maxHp: 500,
      magicDef: 20,
      resistances: { fire: 90, earth: 0 },
    });
    expect(chooseHeroAction({ ...context(actor, resistant), room: 5 })).toMatchObject({
      kind: "skill",
      skillId: "stone_spike",
    });
  });

  it("uses the cheaper action when net values are equal", () => {
    const actor = hero({ activeSkills: ["quick_shiv", "heavy_blow"] });
    const enemy = monster({ hp: 35, maxHp: 200, def: 0 });
    const choices = listLegalHeroActions({ ...context(actor, enemy), room: 5 })
      .filter((candidate) => candidate.kind === "skill");
    expect(choices.length).toBeGreaterThan(1);
    expect(chooseHeroAction({ ...context(actor, enemy), room: 5 }).skillId).toBe("heavy_blow");
  });

  it("spends the reserved mana for an emergency heal", () => {
    const healer = hero({
      id: "healer",
      activeSkills: ["minor_heal"],
      currentMana: 24,
      calculatedStats: { ...hero().calculatedStats, magicDamage: 20 },
    });
    const target = hero({ id: "target", currentHp: 20 });
    const chosen = chooseHeroAction({ ...context(healer, monster({ atk: 50 }), [healer, target]), room: 4 });
    expect(deriveManaReserve({ ...context(healer), room: 4 })).toBeGreaterThan(0);
    expect(chosen).toMatchObject({ skillId: "minor_heal", targetHeroId: "target" });
  });

  it("preserves the reserve for a non-vital stabilization heal", () => {
    const healer = hero({ id: "healer", activeSkills: ["minor_heal"], currentMana: 24 });
    const target = hero({ id: "target", currentHp: 50 });
    const chosen = chooseHeroAction({
      ...context(healer, monster({ atk: 10 }), [healer, target]),
      room: 4,
    });
    expect(chosen.kind).toBe("normal_attack");
  });

  it("does not call an insufficient heal life-saving", () => {
    const healer = hero({
      id: "healer",
      activeSkills: ["minor_heal"],
      currentMana: 100,
      calculatedStats: { ...hero().calculatedStats, magicDamage: 10 },
    });
    const doomed = hero({ id: "doomed", currentHp: 5 });
    const chosen = chooseHeroAction(context(healer, monster({ atk: 100 }), [healer, doomed]));
    expect(chosen.reason).not.toBe("heal_prevents_death");
  });

  it("chooses group healing only when its collective value is greater", () => {
    const healer = hero({ id: "healer", activeSkills: ["minor_heal", "soothing_song"] });
    const first = hero({ id: "first", currentHp: 20 });
    const second = hero({ id: "second", currentHp: 25 });
    const chosen = chooseHeroAction({
      ...context(healer, monster({ atk: 40 }), [healer, first, second]),
      room: 5,
    });
    expect(chosen).toMatchObject({ skillId: "soothing_song", reason: "group_stabilization" });
  });

  it("includes the caster and every living group member for single_ally buffs", () => {
    const support = hero({ id: "support", activeSkills: ["sacred_barrier"], currentMana: 42 });
    const endangered = hero({
      id: "endangered",
      currentHp: 80,
      calculatedStats: {
        ...hero().calculatedStats,
        physicalDefense: 100,
        magicDefense: 100,
      },
    });
    const chosen = chooseHeroAction({
      ...context(support, monster({ hp: 1_000, maxHp: 1_000, atk: 280 }), [support, endangered]),
      room: 4,
    });
    expect(chosen).toMatchObject({ skillId: "sacred_barrier", targetHeroId: "endangered" });
  });

  it("refuses an inferior resisted spell even during a boss fight", () => {
    const actor = hero({
      activeSkills: ["fire_bolt"],
      calculatedStats: {
        ...hero().calculatedStats,
        physicalDamage: 100,
        magicDamage: 10,
      },
    });
    const chosen = chooseHeroAction({
      ...context(actor, monster({ hp: 1_000, maxHp: 1_000, isBoss: true, def: 0, magicDef: 100 })),
      room: 5,
    });
    expect(chosen.kind).toBe("normal_attack");
  });

  it("does not use a physical attack debuff against a magical monster", () => {
    const support = hero({ activeSkills: ["weakening_shout"], currentMana: 100 });
    const chosen = chooseHeroAction({
      ...context(support, monster({ hp: 1_000, maxHp: 1_000, damageType: "arcane", isBoss: true })),
      room: 5,
    });
    expect(chosen.kind).toBe("normal_attack");
  });

  it("uses an ordinary debuff when its projected HP swing beats the skipped attack", () => {
    const support = hero({ activeSkills: ["discordant_chord"], currentMana: 100 });
    const chosen = chooseHeroAction(context(
      support,
      monster({ hp: 1_000, maxHp: 1_000, atk: 50, def: 100 }),
    ));
    expect(chosen).toMatchObject({
      kind: "skill",
      skillId: "discordant_chord",
      reason: "useful_combat_debuff",
    });
    expect(chosen.value).toBeLessThan(chosen.manaCost);
  });

  it("uses an ordinary party buff early enough to benefit later turns", () => {
    const support = hero({ id: "support", activeSkills: ["inspiring_song"], currentMana: 100 });
    const allies = [1, 2, 3].map((index) => hero({
      id: `ally-${index}`,
      calculatedStats: { ...hero().calculatedStats, physicalDamage: 100 },
    }));
    expect(chooseHeroAction(context(
      support,
      monster({ hp: 2_000, maxHp: 2_000, def: 0 }),
      [support, ...allies],
    ))).toMatchObject({
      kind: "skill",
      skillId: "inspiring_song",
      reason: "useful_combat_buff",
    });
  });

  it("does not double-reserve a support spell but preserves a distinct heal", () => {
    const allies = [1, 2, 3].map((index) => hero({
      id: `ally-${index}`,
      calculatedStats: { ...hero().calculatedStats, physicalDamage: 100 },
    }));
    const enough = hero({
      id: "support",
      activeSkills: ["inspiring_song", "minor_heal"],
      currentMana: 80,
    });
    const tooLow = { ...enough, currentMana: 79 };
    const enemy = monster({ hp: 2_000, maxHp: 2_000, def: 0 });

    expect(deriveManaReserve(context(enough), "inspiring_song")).toBe(24);
    expect(chooseHeroAction(context(enough, enemy, [enough, ...allies])).skillId).toBe("inspiring_song");
    expect(chooseHeroAction(context(tooLow, enemy, [tooLow, ...allies])).kind).toBe("normal_attack");
  });

  it("rejects support when the fight ends in the current round", () => {
    const support = hero({ activeSkills: ["discordant_chord"], currentMana: 100 });
    expect(chooseHeroAction(context(support, monster({ hp: 1, maxHp: 1 }))))
      .toMatchObject({ kind: "normal_attack", reason: "normal_attack_lethal" });
  });

  it("uses provocation only when the caster can protect a threatened ally", () => {
    const tank = hero({
      id: "tank",
      activeSkills: ["provocation"],
      currentMana: 100,
      currentHp: 100,
      calculatedStats: { ...hero().calculatedStats, physicalDefense: 30 },
    });
    const fragile = hero({
      id: "fragile",
      currentHp: 20,
      calculatedStats: { ...hero().calculatedStats, physicalDefense: 0 },
    });
    expect(chooseHeroAction({
      ...context(tank, monster({ hp: 1_000, maxHp: 1_000, atk: 50 }), [tank, fragile]),
      room: 5,
    })).toMatchObject({ skillId: "provocation", targetHeroId: "tank", reason: "taunt_protects_ally" });

    const dyingTank = { ...tank, currentHp: 10 };
    expect(chooseHeroAction({
      ...context(dyingTank, monster({ hp: 1_000, maxHp: 1_000, atk: 50 }), [dyingTank, fragile]),
      room: 5,
    }).skillId).not.toBe("provocation");
  });

  it("returns a stable reason for the normal attack", () => {
    expect(chooseHeroAction(context(hero({ activeSkills: [] })))).toMatchObject({
      kind: "normal_attack",
      reason: "mana_preserved",
    });
  });
});
