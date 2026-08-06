import { describe, expect, it } from "vitest";
import {
  DUNGEON_CHALLENGE_DEFINITIONS,
  getDungeonChallengeDifficulty,
  getDungeonChallengeSuccessProbability,
  rollDungeonChallenge,
  selectBestDungeonChallengeCandidate,
} from "../shared/domain/dungeon-challenges";

const baseStats = {
  str: 1,
  agi: 1,
  end: 1,
  int: 1,
  wiz: 1,
  dex: 1,
  luk: 1,
};

describe("dungeon challenge rules", () => {
  it("defines the six approved stat pairs and difficulty profiles", () => {
    expect(Object.fromEntries(Object.entries(DUNGEON_CHALLENGE_DEFINITIONS).map(([kind, definition]) => [
      kind,
      [definition.statA, definition.statB, definition.difficultyProfile],
    ]))).toEqual({
      trap: ["agi", "dex", "standard"],
      enigma: ["int", "wiz", "standard"],
      ambush: ["agi", "luk", "luck"],
      ritual: ["dex", "wiz", "standard"],
      obstacle: ["str", "agi", "standard"],
      negotiation: ["wiz", "luk", "luck"],
    });
  });

  it("uses the approved standard and LUK difficulty anchors", () => {
    expect([1, 5, 10].map((floor) => getDungeonChallengeDifficulty(floor, "standard")))
      .toEqual([12, 20, 30]);
    expect([20, 30, 40, 50].map((floor) => getDungeonChallengeDifficulty(floor, "standard")))
      .toEqual([90, 155, 220, 285]);
    expect([20, 30, 40, 50].map((floor) => getDungeonChallengeDifficulty(floor, "luck")))
      .toEqual([65, 103, 141, 180]);
  });

  it("interpolates and extrapolates deterministically", () => {
    expect(getDungeonChallengeDifficulty(15, "standard")).toBe(60);
    expect(getDungeonChallengeDifficulty(15, "luck")).toBe(48);
    expect(getDungeonChallengeDifficulty(60, "standard")).toBe(350);
    expect(getDungeonChallengeDifficulty(60, "luck")).toBe(219);
  });

  it("keeps LUK in both the score and the die for LUK encounters", () => {
    const hero = { id: "lucky", baseStats: { ...baseStats, agi: 8, luk: 6 } };
    const candidate = selectBestDungeonChallengeCandidate([hero], "agi", "luk", 18);

    expect(candidate).toMatchObject({ score: 14, luck: 6 });
    expect(candidate?.successProbability).toBeCloseTo(3 / 6);
  });

  it("selects the highest probability and preserves party order on a complete tie", () => {
    const rawScore = { id: "raw", baseStats: { ...baseStats, str: 10, dex: 0, luk: 1 } };
    const probable = { id: "probable", baseStats: { ...baseStats, str: 9, dex: 0, luk: 7 } };
    expect(selectBestDungeonChallengeCandidate([rawScore, probable], "str", "dex", 12)?.hero.id)
      .toBe("probable");

    const tied = { id: "tied", baseStats: { ...rawScore.baseStats } };
    expect(selectBestDungeonChallengeCandidate([rawScore, tied], "str", "dex", 12)?.hero.id)
      .toBe("raw");
  });

  it("consumes exactly one RNG draw and resolves both threshold sides", () => {
    let draws = 0;
    const rng = {
      nextInt: (maxExclusive: number) => {
        draws += 1;
        return maxExclusive - 1;
      },
    };

    expect(rollDungeonChallenge({ score: 10, luck: 5 }, 15, rng))
      .toEqual({ luckRoll: 5, success: true });
    expect(draws).toBe(1);
    expect(rollDungeonChallenge({ score: 9, luck: 5 }, 15, rng))
      .toEqual({ luckRoll: 5, success: false });
    expect(draws).toBe(2);
  });

  it("bounds exact probabilities at impossible and guaranteed outcomes", () => {
    expect(getDungeonChallengeSuccessProbability(10, 1, 12)).toBe(0);
    expect(getDungeonChallengeSuccessProbability(11, 1, 12)).toBe(1);
  });
});
