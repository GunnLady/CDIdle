import { afterEach, describe, expect, it, vi } from "vitest";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import {
  ENCOUNTER_PLAYBACK_DEDUPE_LIMIT,
  ENCOUNTER_PLAYBACK_STEP_MS,
  EncounterPlaybackRuntime,
  createSystemEncounterPlaybackClock,
  getEncounterPlaybackCursorAtElapsed,
  getEncounterPlaybackDurationMs,
  type EncounterPlaybackClock,
  type EncounterPlaybackState,
} from "../src/domain/encounterPlayback";
import {
  createEncounterSceneTimeline,
  projectEncounterScene,
} from "../src/domain/encounterSceneProjection";

const encounter: CanonicalDungeonEncounterRecord = {
  encounterId: "encounter-playback",
  kind: "fight",
  floor: 1,
  room: 1,
  outcome: "victory",
  roundCount: 1,
  enemy: null,
  transcript: [
    { sequence: 0, type: "combat.start", category: "combat-hero", message: "Début" },
    { sequence: 1, type: "enemy.intent", category: "combat-enemy", message: "Attaque annoncée" },
    { sequence: 2, type: "combat.end", category: "combat-enemy", message: "Fin" },
  ],
  rewards: { gold: 0, loot: [] },
};

const emptyEncounter: CanonicalDungeonEncounterRecord = {
  ...encounter,
  encounterId: "encounter-empty",
  kind: "trap",
  outcome: "defeat",
  roundCount: 0,
  transcript: [],
};

type PendingWait = {
  deadlineMs: number;
  settle: () => void;
};

async function flushPromises(): Promise<void> {
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
}

class FakePlaybackClock implements EncounterPlaybackClock {
  private currentTimeMs = 0;
  private waits: PendingWait[] = [];

  now(): number {
    return this.currentTimeMs;
  }

  waitUntil(deadlineMs: number, signal: AbortSignal): Promise<void> {
    if (signal.aborted || deadlineMs <= this.currentTimeMs) return Promise.resolve();
    return new Promise<void>((resolve) => {
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", settle);
        this.waits = this.waits.filter((wait) => wait.settle !== settle);
        resolve();
      };
      this.waits.push({ deadlineMs, settle });
      signal.addEventListener("abort", settle, { once: true });
    });
  }

  elapseTo(timeMs: number): void {
    if (timeMs < this.currentTimeMs) throw new Error("Fake clock cannot move backwards.");
    this.currentTimeMs = timeMs;
  }

  async advanceTo(timeMs: number): Promise<void> {
    this.elapseTo(timeMs);
    for (const wait of [...this.waits]) {
      if (wait.deadlineMs <= this.currentTimeMs) wait.settle();
    }
    await flushPromises();
  }

  get pendingCount(): number {
    return this.waits.length;
  }
}

function encounterWithId(encounterId: string): CanonicalDungeonEncounterRecord {
  return { ...encounter, encounterId };
}

function projectPlaybackState(
  record: CanonicalDungeonEncounterRecord,
  state: EncounterPlaybackState | undefined,
) {
  if (!state) return undefined;
  return projectEncounterScene(createEncounterSceneTimeline(record), state);
}

describe("encounter playback timing", () => {
  it("keeps the exact (N + 1) × 400 ms calendar independently of render sampling", () => {
    const timeline = createEncounterSceneTimeline(encounter);
    const duration = getEncounterPlaybackDurationMs(timeline);
    expect(timeline.steps).toHaveLength(2);
    expect(duration).toBe(3 * ENCOUNTER_PLAYBACK_STEP_MS);

    const sampleAtRate = (frequencyHz: number) => {
      const intervalMs = 1_000 / frequencyHz;
      const samples = Array.from(
        { length: Math.ceil(duration / intervalMs) },
        (_, index) => getEncounterPlaybackCursorAtElapsed(timeline, index * intervalMs),
      );
      return {
        beforeDeadline: samples.at(-1),
        atDeadline: getEncounterPlaybackCursorAtElapsed(timeline, duration),
      };
    };

    expect(sampleAtRate(60).atDeadline).toEqual({ visibleCount: 2, complete: true });
    expect(sampleAtRate(120).atDeadline).toEqual({ visibleCount: 2, complete: true });
    expect(sampleAtRate(60).beforeDeadline?.complete).toBe(false);
    expect(sampleAtRate(120).beforeDeadline?.complete).toBe(false);
  });

  it("reveals a visible projection in order and completes on the final deadline", async () => {
    const clock = new FakePlaybackClock();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => true,
      onChange: (state) => states.push(state),
    });

    const playback = runtime.play(encounter);
    expect(states.at(-1)).toMatchObject({ visibleCount: 0, complete: false });
    await clock.advanceTo(ENCOUNTER_PLAYBACK_STEP_MS);
    expect(states.at(-1)).toMatchObject({ visibleCount: 1, complete: false });
    await clock.advanceTo(2 * ENCOUNTER_PLAYBACK_STEP_MS);
    expect(states.at(-1)).toMatchObject({ visibleCount: 2, complete: false });
    await clock.advanceTo(3 * ENCOUNTER_PLAYBACK_STEP_MS);
    await playback;

    expect(states.at(-1)).toMatchObject({ visibleCount: 2, complete: true });
    expect(projectPlaybackState(encounter, states.at(-1))).toEqual(
      projectEncounterScene(createEncounterSceneTimeline(encounter)),
    );
    expect(runtime.diagnostics()).toMatchObject({ active: false, pendingWait: false });
    expect(clock.pendingCount).toBe(0);
  });

  it("keeps the same final deadline and state with rendering disabled or out of view", async () => {
    const timeline = createEncounterSceneTimeline(encounter);
    const finalDeadline = getEncounterPlaybackDurationMs(timeline);
    const hiddenClock = new FakePlaybackClock();
    const disabledClock = new FakePlaybackClock();
    const hiddenStates: EncounterPlaybackState[] = [];
    const hiddenRuntime = new EncounterPlaybackRuntime({
      clock: hiddenClock,
      isVisible: () => false,
      onChange: (state) => hiddenStates.push(state),
    });
    const disabledRuntime = new EncounterPlaybackRuntime({
      clock: disabledClock,
      isVisible: () => true,
      onChange: () => undefined,
    });

    const hiddenPlayback = hiddenRuntime.play(encounter);
    const disabledPlayback = disabledRuntime.play(encounter);
    await hiddenClock.advanceTo(finalDeadline - 1);
    await disabledClock.advanceTo(finalDeadline - 1);
    expect(hiddenStates).toHaveLength(1);
    expect(hiddenStates[0].complete).toBe(false);

    await hiddenClock.advanceTo(finalDeadline);
    await disabledClock.advanceTo(finalDeadline);
    await Promise.all([hiddenPlayback, disabledPlayback]);

    expect(hiddenStates).toHaveLength(2);
    expect(projectPlaybackState(encounter, hiddenStates.at(-1))).toEqual(projectEncounterScene(timeline));
    expect(hiddenRuntime.diagnostics().active).toBe(false);
    expect(disabledRuntime.diagnostics().active).toBe(false);
  });

  it("catches up directly after suspension without replaying an intermediate backlog", async () => {
    const suspendedClock = new FakePlaybackClock();
    const sequentialClock = new FakePlaybackClock();
    let suspendedVisible = false;
    const suspendedStates: EncounterPlaybackState[] = [];
    const sequentialStates: EncounterPlaybackState[] = [];
    const suspendedRuntime = new EncounterPlaybackRuntime({
      clock: suspendedClock,
      isVisible: () => suspendedVisible,
      onChange: (state) => suspendedStates.push(state),
    });
    const sequentialRuntime = new EncounterPlaybackRuntime({
      clock: sequentialClock,
      isVisible: () => true,
      onChange: (state) => sequentialStates.push(state),
    });

    const suspendedPlayback = suspendedRuntime.play(encounter);
    const sequentialPlayback = sequentialRuntime.play(encounter);
    await sequentialClock.advanceTo(ENCOUNTER_PLAYBACK_STEP_MS);
    await sequentialClock.advanceTo(2 * ENCOUNTER_PLAYBACK_STEP_MS);
    suspendedClock.elapseTo(2 * ENCOUNTER_PLAYBACK_STEP_MS);
    suspendedVisible = true;
    suspendedRuntime.synchronize();
    await flushPromises();

    expect(suspendedStates.map((state) => state.visibleCount)).toEqual([0, 2]);
    expect(projectPlaybackState(encounter, suspendedStates.at(-1))).toEqual(
      projectPlaybackState(encounter, sequentialStates.at(-1)),
    );
    expect(suspendedClock.pendingCount).toBe(1);

    await suspendedClock.advanceTo(3 * ENCOUNTER_PLAYBACK_STEP_MS);
    await sequentialClock.advanceTo(3 * ENCOUNTER_PLAYBACK_STEP_MS);
    await Promise.all([suspendedPlayback, sequentialPlayback]);
    expect(projectPlaybackState(encounter, suspendedStates.at(-1))).toEqual(
      projectPlaybackState(encounter, sequentialStates.at(-1)),
    );
  });
});

describe("encounter playback invalidation", () => {
  it("settles cancellation mid-action without publishing stale completion", async () => {
    const clock = new FakePlaybackClock();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => true,
      onChange: (state) => states.push(state),
    });

    const playback = runtime.play(encounter);
    clock.elapseTo(ENCOUNTER_PLAYBACK_STEP_MS / 2);
    runtime.cancel();
    await playback;

    expect(states).toHaveLength(1);
    expect(states[0]).toMatchObject({
      encounterId: encounter.encounterId,
      visibleCount: 0,
      complete: false,
    });
    expect(runtime.diagnostics()).toMatchObject({ active: false, pendingWait: false });
    expect(clock.pendingCount).toBe(0);
  });

  it("invalidates old updates when encounter or revision changes", async () => {
    const clock = new FakePlaybackClock();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => true,
      onChange: (state) => states.push(state),
    });
    const firstEncounter = encounterWithId("encounter-first");
    const secondEncounter = encounterWithId("encounter-second");

    const firstPlayback = runtime.play(firstEncounter, { revision: 1 });
    await clock.advanceTo(ENCOUNTER_PLAYBACK_STEP_MS);
    const secondPlayback = runtime.play(secondEncounter, { revision: 1 });
    await firstPlayback;
    const firstStateCount = states.filter((state) => state.encounterId === firstEncounter.encounterId).length;
    await clock.advanceTo(2 * ENCOUNTER_PLAYBACK_STEP_MS);
    expect(states.filter((state) => state.encounterId === firstEncounter.encounterId)).toHaveLength(firstStateCount);

    const revisedPlayback = runtime.play(secondEncounter, { revision: 2 });
    await secondPlayback;
    await clock.advanceTo(3 * ENCOUNTER_PLAYBACK_STEP_MS);
    expect(states.at(-1)).toMatchObject({
      encounterId: secondEncounter.encounterId,
      visibleCount: 1,
      complete: false,
    });

    runtime.cancel();
    await revisedPlayback;
    expect(clock.pendingCount).toBe(0);
  });

  it("invalidates active work and clears replay history on reset or session change", async () => {
    const clock = new FakePlaybackClock();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => true,
      onChange: (state) => states.push(state),
    });

    const completed = runtime.play(encounter);
    await clock.advanceTo(3 * ENCOUNTER_PLAYBACK_STEP_MS);
    await completed;
    expect(runtime.diagnostics().recentCount).toBe(1);

    runtime.reset();
    expect(runtime.diagnostics().recentCount).toBe(0);
    const beforeSessionChange = runtime.play(encounter);
    expect(states.at(-1)?.visibleCount).toBe(0);
    runtime.setSession("account-b");
    await beforeSessionChange;
    const afterSessionChange = runtime.play(encounter);
    expect(states.at(-1)?.visibleCount).toBe(0);
    runtime.cancel();
    await afterSessionChange;

    const beforeReset = runtime.play(encounterWithId("encounter-reset"));
    runtime.reset();
    await beforeReset;

    expect(runtime.diagnostics()).toMatchObject({ active: false, pendingWait: false, recentCount: 0 });
    expect(clock.pendingCount).toBe(0);
  });

  it("deduplicates an active playback and a completed replay", async () => {
    const clock = new FakePlaybackClock();
    const states: EncounterPlaybackState[] = [];
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => true,
      onChange: (state) => states.push(state),
    });

    const first = runtime.play(encounter, { revision: 4 });
    const duplicate = runtime.play(encounter, { revision: 4 });
    expect(duplicate).toBe(first);
    expect(states).toHaveLength(1);
    await clock.advanceTo(3 * ENCOUNTER_PLAYBACK_STEP_MS);
    await first;
    const completedStateCount = states.length;

    await runtime.play(encounter, { revision: 4 });
    expect(states).toHaveLength(completedStateCount);
    expect(runtime.diagnostics()).toMatchObject({ active: false, pendingWait: false, recentCount: 1 });
  });
});

describe("encounter playback resilience", () => {
  afterEach(() => vi.useRealTimers());

  it("clears the system clock timer immediately when its wait is aborted", async () => {
    vi.useFakeTimers();
    const clock = createSystemEncounterPlaybackClock();
    const controller = new AbortController();
    const wait = clock.waitUntil(clock.now() + ENCOUNTER_PLAYBACK_STEP_MS, controller.signal);
    expect(vi.getTimerCount()).toBe(1);

    controller.abort();
    await wait;

    expect(vi.getTimerCount()).toBe(0);
  });

  it("settles cancellation even when an injected clock ignores its abort signal", async () => {
    const clock: EncounterPlaybackClock = {
      now: () => 0,
      waitUntil: () => new Promise<void>(() => undefined),
    };
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => true,
      onChange: () => undefined,
    });

    const playback = runtime.play(encounter);
    runtime.cancel();
    await playback;

    expect(runtime.diagnostics()).toMatchObject({ active: false, pendingWait: false });
  });

  it("does not await slow assets, CSS completion, or asynchronous render callbacks", async () => {
    const clock = new FakePlaybackClock();
    const states: EncounterPlaybackState[] = [];
    const neverSettles = new Promise<void>(() => undefined);
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => true,
      onChange: (state) => {
        states.push(state);
        return neverSettles;
      },
    });

    const playback = runtime.play(encounter);
    await clock.advanceTo(3 * ENCOUNTER_PLAYBACK_STEP_MS);
    await playback;

    expect(states.at(-1)?.complete).toBe(true);
    expect(runtime.diagnostics()).toMatchObject({ active: false, pendingWait: false });
  });

  it("settles empty and unknown historical records with a neutral projection", async () => {
    const emptyClock = new FakePlaybackClock();
    const emptyStates: EncounterPlaybackState[] = [];
    const emptyRuntime = new EncounterPlaybackRuntime({
      clock: emptyClock,
      isVisible: () => true,
      onChange: (state) => emptyStates.push(state),
    });
    const unknownEncounter = {
      ...emptyEncounter,
      encounterId: "encounter-unknown",
      transcript: [{ sequence: 0, type: "legacy.unknown", message: "Événement historique" }],
    } as CanonicalDungeonEncounterRecord;
    const unknownClock = new FakePlaybackClock();
    const unknownStates: EncounterPlaybackState[] = [];
    const unknownRuntime = new EncounterPlaybackRuntime({
      clock: unknownClock,
      isVisible: () => true,
      onChange: (state) => unknownStates.push(state),
    });

    const emptyPlayback = emptyRuntime.play(emptyEncounter);
    const unknownPlayback = unknownRuntime.play(unknownEncounter);
    await emptyClock.advanceTo(ENCOUNTER_PLAYBACK_STEP_MS);
    await unknownClock.advanceTo(2 * ENCOUNTER_PLAYBACK_STEP_MS);
    await Promise.all([emptyPlayback, unknownPlayback]);

    expect(projectPlaybackState(emptyEncounter, emptyStates.at(-1))).toMatchObject({
      complete: true,
      actors: [],
      limitations: ["initial-actors-unavailable"],
    });
    expect(projectPlaybackState(unknownEncounter, unknownStates.at(-1))).toMatchObject({
      complete: true,
      activeStep: expect.objectContaining({ projection: "summary", type: "legacy.unknown" }),
      limitations: ["initial-actors-unavailable"],
    });
  });

  it("bounds timers and replay history across one hundred deterministic encounters", async () => {
    const clock = new FakePlaybackClock();
    const runtime = new EncounterPlaybackRuntime({
      clock,
      isVisible: () => false,
      onChange: () => undefined,
    });

    for (let index = 0; index < 100; index += 1) {
      const playback = runtime.play({ ...emptyEncounter, encounterId: `encounter-${index}` });
      expect(clock.pendingCount).toBe(1);
      await clock.advanceTo((index + 1) * ENCOUNTER_PLAYBACK_STEP_MS);
      await playback;
      expect(clock.pendingCount).toBe(0);
    }

    expect(runtime.diagnostics()).toEqual({
      generation: 100,
      active: false,
      pendingWait: false,
      recentCount: ENCOUNTER_PLAYBACK_DEDUPE_LIMIT,
    });
  });
});
