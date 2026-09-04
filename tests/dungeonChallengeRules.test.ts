import { describe, expect, it } from "vitest";
import {
  DUNGEON_CHALLENGE_DEFINITIONS,
  DUNGEON_CHALLENGE_DIFFICULTY_ANCHORS,
  DUNGEON_CHALLENGE_DIFFICULTY_MODEL_ID,
  getCanonicalDungeonChallengeDifficulty,
  getDungeonChallengeSuccessProbability,
  rollDungeonChallenge,
  selectBestDungeonChallengeCandidate,
  type DungeonChallengeKind,
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
  it("defines the six approved stat pairs", () => {
    expect(Object.fromEntries(Object.entries(DUNGEON_CHALLENGE_DEFINITIONS).map(([kind, definition]) => [
      kind,
      [definition.statA, definition.statB],
    ]))).toEqual({
      trap: ["agi", "dex"],
      enigma: ["int", "wiz"],
      ambush: ["agi", "luk"],
      ritual: ["dex", "wiz"],
      obstacle: ["str", "agi"],
      negotiation: ["wiz", "luk"],
    });
  });

  it("applies the canonical party-of-four calibration anchors", () => {
    expect(DUNGEON_CHALLENGE_DIFFICULTY_MODEL_ID).toBe("party-four-two-thirds-v2");
    expect(DUNGEON_CHALLENGE_DIFFICULTY_ANCHORS.trap).toEqual([
      { floor: 1, difficulty: 12 }, { floor: 10, difficulty: 29 },
      { floor: 20, difficulty: 72 }, { floor: 25, difficulty: 80 },
      { floor: 30, difficulty: 93 }, { floor: 40, difficulty: 110 },
      { floor: 50, difficulty: 119 }, { floor: 60, difficulty: 133 },
      { floor: 65, difficulty: 140 }, { floor: 99, difficulty: 140 },
    ]);
    expect([1, 10, 20, 25, 30, 40, 50, 60, 70, 99].map((floor) => (
      getCanonicalDungeonChallengeDifficulty(floor, "ritual")
    ))).toEqual([11, 28, 59, 70, 80, 97, 112, 126, 131, 131]);
    expect([1, 10, 20, 25, 30, 40, 99].map((floor) => (
      getCanonicalDungeonChallengeDifficulty(floor, "negotiation")
    ))).toEqual([11, 29, 50, 53, 62, 66, 66]);
  });

  it("keeps every calibrated challenge curve monotonic through and beyond level 99", () => {
    for (const kind of Object.keys(DUNGEON_CHALLENGE_DEFINITIONS) as DungeonChallengeKind[]) {
      let previous = 0;
      for (let floor = 1; floor <= 120; floor += 1) {
        const difficulty = getCanonicalDungeonChallengeDifficulty(floor, kind);
        expect(difficulty).toBeGreaterThanOrEqual(previous);
        previous = difficulty;
      }
    }
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
