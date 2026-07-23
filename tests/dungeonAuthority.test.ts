import { describe, expect, it } from "vitest";
import { applyDungeonCommand, type DungeonRng, type DungeonState } from "../supabase/functions/game-api/dungeon-authority";

const state = (): DungeonState => ({
  activeDungeonFloor: 1,
  activeDungeonRoom: 1,
  highestFloorReached: 1,
  resources: { gold: 0 },
  heroes: [{ id: "hero-1", isActive: true, currentHp: 20, calculatedStats: { physicalDamage: 20 } }],
  currentEncounter: null,
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
    const resolved = applyDungeonCommand(started.state, { type: "dungeon.resolve", commandId: "cmd-resolve-result" });
    expect(resolved.state.currentEncounter).toBeNull();
    expect(resolved.state.activeDungeonRoom).toBe(2);
    expect(resolved.state.resources?.gold).toBeGreaterThan(0);
    expect(resolved.events[0]).toMatchObject({ type: "dungeon.encounter_resolved", encounter: { outcome: "victory", transcript: expect.any(Array), rewards: { gold: expect.any(Number) } } });
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
    expect(retreated.events[0]).toMatchObject({ type: "dungeon.retreat", encounterId: "encounter-cmd-retreat" });
  });

  it("rejects resolution and retreat without an active encounter", () => {
    expect(() => applyDungeonCommand(state(), { type: "dungeon.resolve" })).toThrowError("there is no active encounter");
    expect(() => applyDungeonCommand(state(), { type: "dungeon.retreat" })).toThrowError("there is no active encounter");
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
});
