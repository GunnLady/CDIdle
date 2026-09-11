import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import type { ActiveTab } from "../src/domain/activeTabPreference";
import { EncounterPlaybackRuntime } from "../src/domain/encounterPlayback";
import { useEncounterPlayback } from "../src/hooks/useEncounterPlayback";

const encounter = {
  encounterId: "hook-encounter",
} as CanonicalDungeonEncounterRecord;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});

describe("encounter playback hook", () => {
  it("scopes playback to the session and synchronizes tab and document visibility", async () => {
    const cancel = vi.spyOn(EncounterPlaybackRuntime.prototype, "cancel").mockImplementation(() => undefined);
    const play = vi.spyOn(EncounterPlaybackRuntime.prototype, "play").mockResolvedValue(undefined);
    const setSession = vi.spyOn(EncounterPlaybackRuntime.prototype, "setSession").mockImplementation(() => undefined);
    const synchronize = vi.spyOn(EncounterPlaybackRuntime.prototype, "synchronize").mockImplementation(() => undefined);
    type HookProps = { tab: ActiveTab; sessionId: string | null };
    const { result, rerender, unmount } = renderHook(
      ({ tab, sessionId }: HookProps) => useEncounterPlayback(tab, sessionId),
      { initialProps: { tab: "dungeon", sessionId: "user-1" } as HookProps },
    );

    expect(setSession).toHaveBeenCalledWith("user-1");
    await act(async () => {
      await result.current.playEncounterTranscript(encounter, { revision: 7 });
    });
    expect(play).toHaveBeenCalledWith(encounter, { revision: 7 });

    act(() => result.current.prepareEncounterPlayback(encounter.encounterId));
    expect(cancel).toHaveBeenCalled();
    expect(result.current.encounterPlayback).toEqual({
      encounterId: encounter.encounterId,
      visibleCount: 0,
      complete: false,
    });

    const beforeTabChange = synchronize.mock.calls.length;
    rerender({ tab: "city", sessionId: "user-1" });
    expect(synchronize.mock.calls.length).toBeGreaterThan(beforeTabChange);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(synchronize.mock.calls.length).toBeGreaterThan(beforeTabChange + 1);

    rerender({ tab: "city", sessionId: "user-2" });
    expect(setSession).toHaveBeenLastCalledWith("user-2");
    expect(result.current.encounterPlayback).toBeNull();

    act(() => {
      result.current.prepareEncounterPlayback("new-session-encounter");
      result.current.resetEncounterPlayback("user-1");
    });
    expect(result.current.encounterPlayback?.encounterId).toBe("new-session-encounter");
    act(() => result.current.resetEncounterPlayback("user-2"));
    expect(result.current.encounterPlayback).toBeNull();

    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
