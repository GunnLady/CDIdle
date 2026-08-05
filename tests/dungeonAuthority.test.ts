import { describe, expect, it } from "vitest";
import { applyDungeonCommand, type DungeonRng, type DungeonState } from "../supabase/functions/game-api/dungeon-authority";
import { makeHero } from "./fixtures/game";
import { initialTownState } from "../supabase/functions/game-api/town-authority";

const state = (): DungeonState => ({
  ...initialTownState(42),
  activeDungeonFloor: 1,
  activeDungeonRoom: 1,
  highestFloorReached: 1,
  resources: { ...initialTownState(42).resources, gold: 0 },
  heroes: [makeHero({ id: "hero-1", isActive: true, currentHp: 20 })],
  currentEncounter: null,
  encounterHistory: [],
  autoExplore: true,
});

describe("authoritative dungeon commands", () => {
  const fixedRng = (): DungeonRng => {
    let value = 0;
    return { next: () => value++ / 10, nextInt: (maxExclusive) => value++ % maxExclusive };
  };

  it("creates an active encounter without client-controlled resolution", () => {
    const result = applyDungeonCommand(state(), { type: "dungeon.explore", floor: 1, commandId: "cmd-explore" });
    expect(result.state.currentEncounter).toMatchObject({ status: "active", floor: 1, room: 1, encounterId: "encounter-cmd-explore" });
    expect(result.state.activeDungeonRoom).toBe(1);
    expect(result.events).toEqual([{ type: "dungeon.encounter_started", encounterId: "encounter-cmd-explore", floor: 1, room: 1 }]);
  });

  it("selects only an unlocked floor without starting an encounter", () => {
    const selected = applyDungeonCommand({ ...state(), highestFloorReached: 3 }, { type: "dungeon.select_floor", floor: 2 });
    expect(selected.state).toMatchObject({ activeDungeonFloor: 2, activeDungeonRoom: 1, currentEncounter: null, autoExplore: false });
    expect(() => applyDungeonCommand(state(), { type: "dungeon.select_floor", floor: 2 })).toThrow("requested dungeon floor is not available");
  });

  it("resolves the active encounter server-side with transcript, reward and progression", () => {
    const started = applyDungeonCommand(state(), { type: "dungeon.explore", floor: 1, commandId: "cmd-resolve" });
    const resolved = applyDungeonCommand(started.state, { type: "dungeon.resolve", commandId: "cmd-resolve-result" }, fixedRng());
    expect(resolved.state.currentEncounter).toBeNull();
    expect(resolved.state.activeDungeonRoom).toBe(2);
    expect(resolved.state.resources?.gold).toBeGreaterThan(0);
    expect(resolved.state.encounterHistory).toHaveLength(1);
    expect(resolved.state.encounterHistory?.[0]).toMatchObject({ encounterId: "encounter-cmd-resolve", floor: 1, room: 1 });
    expect(resolved.events[0]).toMatchObject({ type: "dungeon.encounter_resolved", encounter: { outcome: "victory", transcript: expect.any(Array), rewards: { gold: expect.any(Number) } } });
  });

  it("persists only the last fifteen resolved encounters", () => {
    let current: DungeonState = {
      ...state(),
      activeDungeonFloor: 10,
      highestFloorReached: 10,
      heroes: [makeHero({
        id: "hero-1",
        isActive: true,
        currentHp: 10_000,
        calculatedStats: {
          ...makeHero().calculatedStats,
          maxHp: 10_000,
          hp: 10_000,
          physicalDamage: 1_000_000,
        },
      })],
    };
    for (let index = 0; index < 16; index += 1) {
      current.heroes = (current.heroes ?? []).map((hero) => ({
        ...hero,
        isActive: true,
        status: "idle",
        currentHp: 100_000,
        calculatedStats: {
          ...hero.calculatedStats,
          maxHp: 100_000,
          hp: 100_000,
          physicalDamage: 1_000_000,
        },
      }));
      current = applyDungeonCommand(current, {
        type: "dungeon.explore",
        floor: 10,
        commandId: `history-${index}`,
      }).state;
      current = applyDungeonCommand(current, { type: "dungeon.resolve" }, fixedRng()).state;
    }
    expect(current.encounterHistory).toHaveLength(15);
    expect(current.encounterHistory?.[0]).toMatchObject({ encounterId: "encounter-history-1", room: 2 });
    expect(current.encounterHistory?.[14]).toMatchObject({ encounterId: "encounter-history-15", room: 16 });
  });

  it("normalizes a legacy room unless its encounter is still active", () => {
    const normalized = applyDungeonCommand({
      ...state(),
      activeDungeonRoom: 50,
    }, { type: "dungeon.auto_explore", enabled: false });
    expect(normalized.state.activeDungeonRoom).toBe(5);

    const legacyEncounter = applyDungeonCommand({
      ...state(),
      activeDungeonRoom: 50,
      heroes: [makeHero({
        isActive: true,
        currentHp: 100_000,
        calculatedStats: {
          ...makeHero().calculatedStats,
          maxHp: 100_000,
          hp: 100_000,
          physicalDamage: 1_000_000,
        },
      })],
      currentEncounter: {
        encounterId: "encounter-legacy",
        kind: "pending",
        status: "active",
        floor: 1,
        room: 50,
      },
    }, { type: "dungeon.resolve" }, fixedRng());
    expect(legacyEncounter.state.activeDungeonFloor).toBe(2);
    expect(legacyEncounter.state.activeDungeonRoom).toBe(1);
  });

  it("replays the same server RNG sequence with an injected generator", () => {
    const started = applyDungeonCommand(state(), { type: "dungeon.explore", floor: 1, commandId: "cmd-rng" });
    const first = applyDungeonCommand(started.state, { type: "dungeon.resolve" }, fixedRng());
    const second = applyDungeonCommand(started.state, { type: "dungeon.resolve" }, fixedRng());
    expect(second).toEqual(first);
  });

  it("retreats an active encounter without reward or progression", () => {
    const started = applyDungeonCommand(state(), { type: "dungeon.explore", floor: 1, commandId: "cmd-retreat" });
    const retreated = applyDungeonCommand(started.state, { type: "dungeon.retreat", commandId: "cmd-retreat-result" });
    expect(retreated.state.currentEncounter).toBeNull();
    expect(retreated.state.activeDungeonRoom).toBe(1);
    expect(retreated.state.resources?.gold).toBe(0);
    expect(retreated.state.autoExplore).toBe(false);
    expect(retreated.state.heroes?.[0]).toMatchObject({ isActive: false, status: "resting" });
    expect(retreated.events[0]).toMatchObject({ type: "dungeon.retreat", encounterId: "encounter-cmd-retreat" });
  });

  it("returns the party to camp even without an active encounter", () => {
    expect(() => applyDungeonCommand(state(), { type: "dungeon.resolve" })).toThrowError("there is no active encounter");
    const retreated = applyDungeonCommand(state(), { type: "dungeon.retreat" });
    expect(retreated.state).toMatchObject({ currentEncounter: null, autoExplore: false });
    expect(retreated.state.heroes?.[0]).toMatchObject({ isActive: false, status: "resting" });
    expect(retreated.events[0]).toMatchObject({ type: "dungeon.retreat", encounterId: null });
  });

  it("rejects encounter resolution without the canonical RNG", () => {
    const started = applyDungeonCommand(state(), { type: "dungeon.explore", floor: 1, commandId: "rng-required" });
    expect(() => applyDungeonCommand(started.state, { type: "dungeon.resolve" })).toThrowError("canonical RNG is required");
  });

  it("toggles auto-exploration only for an online command with an active hero", () => {
    const enabled = applyDungeonCommand(state(), { type: "dungeon.auto_explore", enabled: true });
    expect(enabled.state.autoExplore).toBe(true);
    const started = applyDungeonCommand(enabled.state, { type: "dungeon.explore", floor: 1, commandId: "auto-start" });
    expect(started.state.autoExplore).toBe(true);
    const resolved = applyDungeonCommand(started.state, { type: "dungeon.resolve" }, fixedRng());
    expect(resolved.state.autoExplore).toBe(true);
    const disabled = applyDungeonCommand(enabled.state, { type: "dungeon.auto_explore", enabled: false });
    expect(disabled.state.autoExplore).toBe(false);
    expect(() => applyDungeonCommand({ ...state(), heroes: [] }, { type: "dungeon.auto_explore", enabled: true })).toThrowError("at least one active hero is required");
  });

  it("keeps automatic exploration paused for a prayer without blocking other active heroes", () => {
    const source: DungeonState = {
      ...state(),
      autoExplore: false,
      heroes: [
        makeHero({ id: "hero-prayer", level: 10, isActive: false, status: "resting" }),
        makeHero({ id: "hero-ready", isActive: true, status: "idle" }),
      ],
      pendingClassTransitions: [{
        heroId: "hero-prayer",
        fromClass: "Novice",
        fromTier: 0,
        toTier: 1,
        originLevel: 10,
        wasActive: true,
        previousStatus: "idle",
        reason: "prayer",
        candidates: [
          { classType: "Guerrier", affinity: 0.91 },
          { classType: "Pugiliste", affinity: 0.905 },
        ],
      }],
    };

    const resumed = applyDungeonCommand(source, {
      type: "dungeon.auto_explore",
      enabled: true,
    });
    expect(resumed.state.autoExplore).toBe(true);
    const started = applyDungeonCommand(source, {
      type: "dungeon.explore",
      floor: 1,
      commandId: "other-hero-explores",
    });
    expect(started.state.currentEncounter).toMatchObject({
      encounterId: "encounter-other-hero-explores",
      status: "active",
    });
  });
});
