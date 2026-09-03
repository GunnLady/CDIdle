import { describe, expect, it } from "vitest";
import { resolveAuthoritativeDungeonEncounter } from "../src/domain/authoritativeDungeon";
import type { Rng } from "../src/domain/random";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { makeHero, makeResources } from "./fixtures/game";

describe("authoritative dungeon challenges", () => {
  it("uses the canonical curve and shares a successful reward with the active party", () => {
    const rawScoreHero = makeHero({
      id: "raw-score",
      name: "Score brut",
      baseStats: { str: 1, agi: 44, end: 1, int: 1, wiz: 1, dex: 44, luk: 1 },
    });
    const probableHero = makeHero({
      id: "probable",
      name: "Probable",
      baseStats: { str: 1, agi: 44, end: 1, int: 1, wiz: 1, dex: 43, luk: 10 },
    });
    const nextValues = [0.6, 0.99]; // trap, then no material
    let nextDraws = 0;
    let nextIntDraws = 0;
    const rng: Rng = {
      next: () => {
        const value = nextValues[nextDraws] ?? 0.99;
        nextDraws += 1;
        return value;
      },
      nextInt: (maxExclusive) => {
        nextIntDraws += 1;
        return maxExclusive - 1;
      },
    };

    const result = resolveAuthoritativeDungeonEncounter({
      ...initialTownState(42),
      activeDungeonFloor: 20,
      activeDungeonRoom: 1,
      highestFloorReached: 20,
      resources: makeResources(),
      heroes: [rawScoreHero, probableHero],
      currentEncounter: null,
      encounterHistory: [],
      autoExplore: false,
    }, "challenge-selection", rng);

    expect(result.encounter).toMatchObject({ kind: "trap", outcome: "victory" });
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "challenge.hero_selected",
      heroId: "raw-score",
      score: 88,
      luck: 1,
      primaryLabel: "AGI",
      secondaryLabel: "DEX",
      probabilityPercent: 100,
    }));
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "challenge.attempted",
      difficulty: 72,
      luckRoll: 1,
    }));
    expect(result.encounter.transcript.filter((event) => event.type === "reward.xp"))
      .toEqual([
        expect.objectContaining({ heroId: "raw-score", source: "challenge", floor: 20, xp: 91 }),
        expect.objectContaining({ heroId: "probable", source: "challenge", floor: 20, xp: 91 }),
      ]);
    expect(nextDraws).toBe(2);
    expect(nextIntDraws).toBe(1);
  });
});
