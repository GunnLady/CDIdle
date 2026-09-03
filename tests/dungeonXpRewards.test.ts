import { describe, expect, it } from "vitest";
import {
  CANONICAL_DUNGEON_XP_REWARD_POLICY,
  DUNGEON_XP_REWARD_MODEL_ID,
  calculateSharedCombatXp,
  getCanonicalDungeonXpBudget,
  getPolicyXpPool,
} from "../shared/domain/dungeon-xp-rewards";

describe("canonical dungeon XP rewards", () => {
  it("publishes the level-aligned reward model and source multipliers", () => {
    expect(CANONICAL_DUNGEON_XP_REWARD_POLICY.id).toBe(DUNGEON_XP_REWARD_MODEL_ID);
    expect(CANONICAL_DUNGEON_XP_REWARD_POLICY.multipliers).toEqual({
      regular_combat: 1,
      rest: 0.5,
      treasure: 0.75,
      challenge: 1.25,
      elite: 2.5,
      major_boss: 4,
      floor_first_clear: 4,
    });
  });

  it("keeps the existing anchors through floor fifty then compounds at 4.5 percent", () => {
    expect([1, 10, 20, 30, 40, 50].map(getCanonicalDungeonXpBudget))
      .toEqual([14, 42, 126, 350, 770, 1_400]);
    expect(getCanonicalDungeonXpBudget(51)).toBeCloseTo(1_463);
    expect(getCanonicalDungeonXpBudget(60)).toBeCloseTo(1_400 * 1.045 ** 10);
    expect(getCanonicalDungeonXpBudget(99)).toBeGreaterThan(getCanonicalDungeonXpBudget(60));
  });

  it("derives every source from the same floor budget with deterministic rounding", () => {
    expect(getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "regular_combat", 10)).toBe(42);
    expect(getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "rest", 10)).toBe(21);
    expect(getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "treasure", 10)).toBe(32);
    expect(getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "challenge", 10)).toBe(53);
    expect(getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "elite", 10)).toBe(105);
    expect(getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "major_boss", 10)).toBe(168);
    expect(getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "floor_first_clear", 10)).toBe(168);
  });

  it("keeps party shares and the human bonus explicit", () => {
    const other = { race: "Elfe" as const };
    const human = { race: "Humain" as const };
    expect([1, 2, 3, 4].map((count) => calculateSharedCombatXp(100, count, other)))
      .toEqual([100, 50, 40, 35]);
    expect(calculateSharedCombatXp(100, 4, human)).toBe(40);
  });
});
