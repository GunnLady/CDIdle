import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DUNGEON_ANIMATION_PREFERENCE_KEY,
  useDungeonAnimationPreference,
} from "../src/hooks/useDungeonAnimationPreference";

describe("dungeon animation preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });
  afterEach(() => {
    window.localStorage.clear();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });

  it("defaults to enabled, persists locally and stops rendering motion while hidden", () => {
    const { result, unmount } = renderHook(() => useDungeonAnimationPreference());
    expect(result.current.animationsEnabled).toBe(true);

    act(() => result.current.toggleAnimations());
    expect(result.current.animationsEnabled).toBe(false);
    expect(window.localStorage.getItem(DUNGEON_ANIMATION_PREFERENCE_KEY)).toBe("disabled");

    act(() => result.current.toggleAnimations());
    expect(result.current.animationsEnabled).toBe(true);
    expect(result.current.animationsRunning).toBe(true);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.animationsEnabled).toBe(true);
    expect(result.current.animationsRunning).toBe(false);
    unmount();

    window.localStorage.setItem(DUNGEON_ANIMATION_PREFERENCE_KEY, "disabled");
    const remounted = renderHook(() => useDungeonAnimationPreference());
    expect(remounted.result.current.animationsEnabled).toBe(false);
  });
});
