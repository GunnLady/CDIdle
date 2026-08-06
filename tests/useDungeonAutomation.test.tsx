import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDungeonAutomation } from "../src/hooks/useDungeonAutomation";
import type { GameCommand } from "../src/domain/commands";

describe("dungeon automation hook", () => {
  afterEach(() => vi.useRealTimers());
  it("serializes exploration and resolution for an empty room", async () => {
    const dispatchCommand = vi.fn(async () => true);
    const leaderRef = { current: true };
    const { result } = renderHook(() => useDungeonAutomation({
      activeFloor: 3,
      autoExplore: false,
      currentEncounter: null,
      enabled: true,
      leaderRef,
      dispatchCommand,
    }));

    let resolved = false;
    await act(async () => { resolved = await result.current.exploreAndResolve(); });
    expect(resolved).toBe(true);
    expect(dispatchCommand.mock.calls).toEqual([
      [{ type: "dungeon.explore", floor: 3 }, { interactive: true }],
      [{ type: "dungeon.resolve" }, { interactive: true }],
    ]);
    expect(result.current.isRunning).toBe(false);
  });

  it("blocks retries after a failed command until explicitly unblocked", async () => {
    const dispatchCommand = vi.fn(async () => false);
    const { result } = renderHook(() => useDungeonAutomation({
      activeFloor: 1,
      autoExplore: false,
      currentEncounter: null,
      enabled: true,
      leaderRef: { current: true },
      dispatchCommand,
    }));

    await act(async () => { await result.current.exploreAndResolve(false); });
    await act(async () => { await result.current.exploreAndResolve(false); });
    expect(dispatchCommand).toHaveBeenCalledOnce();

    act(() => result.current.setBlocked(false));
    await act(async () => { await result.current.exploreAndResolve(false); });
    expect(dispatchCommand).toHaveBeenCalledTimes(2);
  });

  it("blocks automation before dispatching a retreat", async () => {
    const dispatchCommand = vi.fn(async () => true);
    const { result } = renderHook(() => useDungeonAutomation({
      activeFloor: 1,
      autoExplore: false,
      currentEncounter: null,
      enabled: true,
      leaderRef: { current: true },
      dispatchCommand,
    }));

    await act(async () => { await result.current.retreat(); });
    expect(dispatchCommand).toHaveBeenCalledWith({ type: "dungeon.retreat" });
    await act(async () => { await result.current.exploreAndResolve(); });
    expect(dispatchCommand).toHaveBeenCalledOnce();
  });

  it("starts the next automatic room after the configured delay", async () => {
    vi.useFakeTimers();
    const dispatchCommand = vi.fn(async () => true);
    renderHook(() => useDungeonAutomation({
      activeFloor: 4,
      autoExplore: true,
      currentEncounter: null,
      enabled: true,
      leaderRef: { current: true },
      dispatchCommand,
    }));

    await act(async () => { await vi.advanceTimersByTimeAsync(999); });
    expect(dispatchCommand).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(dispatchCommand.mock.calls).toEqual([
      [{ type: "dungeon.explore", floor: 4 }, { interactive: false }],
      [{ type: "dungeon.resolve" }, { interactive: false }],
    ]);
  });

  it("automatically resolves an encounter already present", async () => {
    const dispatchCommand = vi.fn(async () => true);
    renderHook(() => useDungeonAutomation({
      activeFloor: 2,
      autoExplore: false,
      currentEncounter: { encounterId: "encounter-1" } as never,
      enabled: true,
      leaderRef: { current: true },
      dispatchCommand,
    }));

    await vi.waitFor(() => expect(dispatchCommand).toHaveBeenCalledWith(
      { type: "dungeon.resolve" },
      { interactive: false },
    ));
    expect(dispatchCommand).toHaveBeenCalledOnce();
  });

  it("does not resolve after a retreat requested during exploration", async () => {
    let releaseExplore!: (value: boolean) => void;
    let releaseRetreat!: (value: boolean) => void;
    const explore = new Promise<boolean>((resolve) => { releaseExplore = resolve; });
    const retreat = new Promise<boolean>((resolve) => { releaseRetreat = resolve; });
    const dispatchCommand = vi.fn((command: GameCommand) => {
      if (command.type === "dungeon.explore") return explore;
      if (command.type === "dungeon.retreat") return retreat;
      return Promise.resolve(true);
    });
    const { result } = renderHook(() => useDungeonAutomation({
      activeFloor: 1,
      autoExplore: false,
      currentEncounter: null,
      enabled: true,
      leaderRef: { current: true },
      dispatchCommand,
    }));

    const sequence = result.current.exploreAndResolve();
    await vi.waitFor(() => expect(dispatchCommand).toHaveBeenCalledWith(
      { type: "dungeon.explore", floor: 1 },
      { interactive: true },
    ));
    const retreating = result.current.retreat();
    await vi.waitFor(() => expect(dispatchCommand).toHaveBeenCalledWith({ type: "dungeon.retreat" }));
    releaseExplore(true);
    releaseRetreat(true);
    await Promise.all([sequence, retreating]);
    expect(dispatchCommand).not.toHaveBeenCalledWith(
      { type: "dungeon.resolve" },
      expect.anything(),
    );
  });
});
