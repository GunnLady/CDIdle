import { describe, expect, it } from "vitest";
import {
  calculateEvenPartyXp,
  calculateSharedCombatXp,
  getRestXpPool,
  getSuccessfulChallengeXp,
  getTreasureXpPool,
} from "../shared/domain/dungeon-xp-rewards";

describe("dungeon XP reward policy", () => {
  it("preserves combat sharing and the Human bonus", () => {
    expect(calculateSharedCombatXp(100, 1, { race: "Elfe" })).toBe(100);
    expect(calculateSharedCombatXp(100, 2, { race: "Elfe" })).toBe(50);
    expect(calculateSharedCombatXp(100, 3, { race: "Humain" })).toBe(46);
    expect(calculateSharedCombatXp(100, 4, { race: "Elfe" })).toBe(35);
  });

  it("preserves even non-combat sharing and floor growth", () => {
    expect(getTreasureXpPool(1)).toBe(15);
    expect(getRestXpPool(1)).toBe(10);
    expect(getSuccessfulChallengeXp(1)).toBe(20);
    expect(calculateEvenPartyXp(15, 4, { race: "Elfe" })).toBe(4);
    expect(calculateEvenPartyXp(15, 4, { race: "Humain" })).toBe(4);
  });
});
