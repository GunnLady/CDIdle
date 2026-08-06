import { afterEach, describe, expect, it, vi } from "vitest";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import {
  ENCOUNTER_PLAYBACK_STEP_MS,
  EncounterPlaybackRuntime,
  type EncounterPlaybackState,
} from "../src/domain/encounterPlayback";

const encounter: CanonicalDungeonEncounterRecord = {
  encounterId: "encounter-playback",
  kind: "fight",
  floor: 1,
  room: 1,
  outcome: "victory",
  roundCount: 1,
  enemy: null,
  transcript: [
    { sequence: 0, type: "combat.start", category: "combat-hero", message: "DÃ©but" },
    { sequence: 1, type: "combat.end", category: "combat-enemy", message: "Fin" },
  ],
  rewards: { gold: 0, loot: [] },
};

describe("encounter playback runtime", () => {
  afterEach(() => vi.useRealTimers());

  it("reveals a visible transcript in order before completing", async () => {
    vi.useFakeTimers();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      isVisible: () => true,
      onChange: (state) => states.push(state),
      wait: (durationMs) => new Promise((resolve) => window.setTimeout(resolve, durationMs)),
    });

    const playback = runtime.play(encounter);
    expect(states.at(-1)).toMatchObject({ visibleCount: 0, complete: false });
    await vi.advanceTimersByTimeAsync(ENCOUNTER_PLAYBACK_STEP_MS);
    expect(states.at(-1)).toMatchObject({ visibleCount: 1, complete: false });
    await vi.advanceTimersByTimeAsync(ENCOUNTER_PLAYBACK_STEP_MS);
    expect(states.at(-1)).toMatchObject({ visibleCount: 2, complete: false });
    await vi.advanceTimersByTimeAsync(ENCOUNTER_PLAYBACK_STEP_MS);
    await playback;
    expect(states.at(-1)).toMatchObject({ visibleCount: 2, complete: true });
  });

  it("keeps the original total delay when the dungeon is hidden", async () => {
    vi.useFakeTimers();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      isVisible: () => false,
      onChange: (state) => states.push(state),
      wait: (durationMs) => new Promise((resolve) => window.setTimeout(resolve, durationMs)),
    });

    const playback = runtime.play(encounter);
    await vi.advanceTimersByTimeAsync(encounter.transcript.length * ENCOUNTER_PLAYBACK_STEP_MS);
    expect(states.at(-1)?.complete).toBe(false);
    await vi.advanceTimersByTimeAsync(ENCOUNTER_PLAYBACK_STEP_MS);
    await playback;
    expect(states.at(-1)).toMatchObject({ visibleCount: 2, complete: true });
  });

  it("cancels stale playback without publishing completion", async () => {
    vi.useFakeTimers();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      isVisible: () => true,
      onChange: (state) => states.push(state),
      wait: (durationMs) => new Promise((resolve) => window.setTimeout(resolve, durationMs)),
    });

    const playback = runtime.play(encounter);
    runtime.cancel();
    await vi.runAllTimersAsync();
    await playback;
    expect(states).toEqual([{
      encounterId: encounter.encounterId,
      visibleCount: 0,
      complete: false,
    }]);
  });
});
