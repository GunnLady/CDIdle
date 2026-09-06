import { describe, expect, it } from "vitest";
import {
  getPartyLootBand,
  getRegularFightItemChance,
  createDungeonItemRewardRng,
  shouldAwardDungeonItem,
} from "../shared/domain/dungeon-loot-policy";

const party = (...levels: number[]) => levels.map((level) => ({ level }));

describe("idle dungeon loot policy", () => {
  it.each([
    [[1, 1, 1, 1], 1, 0.05],
    [[5, 9, 12, 20], 1, 0.05],
    [[6, 9, 12, 20], 2, 0.06],
    [[36, 40, 40, 40], 8, 0.12],
    [[99, 99, 99, 99], 8, 0.12],
  ] as const)("uses the least advanced hero for %j", (levels, band, chance) => {
    expect(getPartyLootBand(party(...levels))).toBe(band);
    expect(getRegularFightItemChance(party(...levels))).toBeCloseTo(chance);
  });

  it("guarantees one item source for treasures and final fights", () => {
    expect(shouldAwardDungeonItem({ source: "treasure", existingItemCount: 0, heroes: party(1) })).toBe(true);
    expect(shouldAwardDungeonItem({ source: "final-fight", existingItemCount: 0, heroes: party(1) })).toBe(true);
    expect(shouldAwardDungeonItem({ source: "treasure", existingItemCount: 1, heroes: party(1) })).toBe(false);
    expect(shouldAwardDungeonItem({ source: "final-fight", existingItemCount: 1, heroes: party(1) })).toBe(false);
  });

  it("keeps ordinary combat rewards probabilistic and banded", () => {
    expect(shouldAwardDungeonItem({ source: "ordinary-fight", existingItemCount: 0, heroes: party(1), roll: 0.049 })).toBe(true);
    expect(shouldAwardDungeonItem({ source: "ordinary-fight", existingItemCount: 0, heroes: party(1), roll: 0.05 })).toBe(false);
    expect(shouldAwardDungeonItem({ source: "ordinary-fight", existingItemCount: 0, heroes: party(40), roll: 0.119 })).toBe(true);
    expect(shouldAwardDungeonItem({ source: "ordinary-fight", existingItemCount: 0, heroes: party(40), roll: 0.12 })).toBe(false);
    expect(shouldAwardDungeonItem({ source: "ordinary-fight", existingItemCount: 1, heroes: party(40), roll: 0 })).toBe(false);
  });

  it("rejects incomplete inputs at the domain boundary", () => {
    expect(() => getPartyLootBand([])).toThrow("EMPTY_LOOT_PARTY");
    expect(() => shouldAwardDungeonItem({ source: "ordinary-fight", existingItemCount: -1, heroes: party(1), roll: 0 })).toThrow("INVALID_EXISTING_ITEM_COUNT");
    expect(() => shouldAwardDungeonItem({ source: "ordinary-fight", existingItemCount: 0, heroes: party(1) })).toThrow("INVALID_LOOT_ROLL");
  });

  it("derives a replay-stable item stream without consuming encounter RNG", () => {
    const first = createDungeonItemRewardRng(0.25, 8, 3);
    const replay = createDungeonItemRewardRng(0.25, 8, 3);
    expect([first.next(), first.nextInt(100), first.next()]).toEqual([
      replay.next(), replay.nextInt(100), replay.next(),
    ]);
    expect(createDungeonItemRewardRng(0.25, 8, 4).next()).not.toBe(createDungeonItemRewardRng(0.25, 8, 3).next());
  });
});
