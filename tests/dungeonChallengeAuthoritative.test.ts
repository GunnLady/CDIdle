import { describe, expect, it } from "vitest";
import { resolveAuthoritativeDungeonEncounter } from "../src/domain/authoritativeDungeon";
import type { Rng } from "../src/domain/random";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { getDungeonGoldReward } from "../shared/domain/dungeon-progression";
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
      difficulty: 73,
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

  it.each([
    ["trap", 0.60, 95, 100],
    ["enigma", 0.66, 100, 90],
    ["ambush", 0.72, 95, 100],
    ["ritual", 0.79, 100, 90],
    ["obstacle", 0.82, 97, 100],
  ] as const)("applies the bounded %s failure consequence and no reward", (
    kind,
    encounterRoll,
    expectedHp,
    expectedMana,
  ) => {
    const heroes = ["selected", "ally"].map((id) => makeHero({
      id,
      name: id,
      currentHp: 100,
      currentMana: 100,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 1_000,
        hp: 1_000,
        maxMana: 1_000,
        mana: 1_000,
      },
    }));
    const result = resolveAuthoritativeDungeonEncounter({
      ...initialTownState(42),
      activeDungeonFloor: 20,
      activeDungeonRoom: 1,
      highestFloorReached: 20,
      resources: makeResources({ gold: 10_000 }),
      heroes,
      currentEncounter: null,
      encounterHistory: [],
      autoExplore: true,
    }, `failed-${kind}`, {
      next: () => encounterRoll,
      nextInt: () => 0,
    }, {
      challengeDifficultyResolver: () => 10_000,
    });

    expect(result.encounter).toMatchObject({ kind, outcome: "defeat", rewards: { gold: 0, loot: [] } });
    expect(result.encounter.transcript.some((event) => event.type.startsWith("reward."))).toBe(false);
    expect(result.state.activeDungeonRoom).toBe(2);
    expect(result.state.heroes[0]).toMatchObject({ currentHp: expectedHp, currentMana: expectedMana });
    expect(result.state.heroes[1]).toMatchObject({
      currentHp: expectedHp,
      currentMana: 100,
    });
    expect(result.state.heroes.every((hero) => hero.currentHp > 0)).toBe(true);
  });

  it("caps a failed negotiation at three ordinary combat gold rewards", () => {
    const floor = 20;
    const initialGold = 10_000;
    const result = resolveAuthoritativeDungeonEncounter({
      ...initialTownState(42),
      activeDungeonFloor: floor,
      activeDungeonRoom: 1,
      highestFloorReached: floor,
      resources: makeResources({ gold: initialGold }),
      heroes: [makeHero({ id: "selected" })],
      currentEncounter: null,
      encounterHistory: [],
      autoExplore: true,
    }, "failed-negotiation", {
      next: () => 0.90,
      nextInt: () => 0,
    }, {
      challengeDifficultyResolver: () => 10_000,
    });
    const cap = getDungeonGoldReward(floor, "ambush") * 3;

    expect(result.encounter).toMatchObject({ kind: "negotiation", outcome: "defeat" });
    expect(result.state.resources.gold).toBe(initialGold - cap);
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "challenge.negotiation.consequence",
      goldLost: cap,
    }));
    expect(result.encounter.transcript.some((event) => event.type.startsWith("reward."))).toBe(false);
    expect(result.state.activeDungeonRoom).toBe(2);
  });
});
