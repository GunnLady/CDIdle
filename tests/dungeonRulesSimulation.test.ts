import { describe, expect, it } from "vitest";
import {
  applyDungeonCommand,
  type DungeonRng,
  type DungeonState,
} from "../supabase/functions/game-api/dungeon-authority";
import { makeHero, makeResources } from "./fixtures/game";
import { initialTownState } from "../supabase/functions/game-api/town-authority";

function fixedRng(value: number): DungeonRng {
  return {
    next: () => value,
    nextInt: (maxExclusive) => Math.min(maxExclusive - 1, Math.floor(value * maxExclusive)),
  };
}

function resolveNext(
  state: DungeonState,
  commandId: string,
  encounterRoll: number,
): DungeonState {
  const started = applyDungeonCommand(state, {
    type: "dungeon.explore",
    floor: 1,
    commandId,
  }).state;
  return applyDungeonCommand(
    started,
    { type: "dungeon.resolve", commandId: `${commandId}-resolve` },
    fixedRng(encounterRoll),
  ).state;
}

describe("authoritative dungeon rule simulation", () => {
  it("runs trap, fight, trap without allowing two consecutive traps", () => {
    let state: DungeonState = {
      ...initialTownState(42),
      activeDungeonFloor: 1,
      activeDungeonRoom: 1,
      highestFloorReached: 1,
      resources: { ...makeResources() },
      heroes: [makeHero({
        id: "dungeon-rule-simulation-hero",
        currentHp: 100_000,
        calculatedStats: {
          ...makeHero().calculatedStats,
          maxHp: 100_000,
          hp: 100_000,
          physicalDamage: 1_000_000,
          criticalChance: 0,
        },
      })],
      currentEncounter: null,
      encounterHistory: [],
      autoExplore: false,
    };

    state = resolveNext(state, "simulation-trap-1", 0.6);
    expect(state.encounterHistory?.at(-1)?.kind).toBe("trap");

    state = resolveNext(state, "simulation-fight", 0);
    expect(state.encounterHistory?.at(-1)?.kind).toBe("fight");

    state = resolveNext(state, "simulation-trap-2", 0.6);
    expect(state.encounterHistory?.map((encounter) => encounter.kind)).toEqual([
      "trap",
      "fight",
      "trap",
    ]);
  });
});
