import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { useCanonicalSnapshot } from "../src/hooks/useCanonicalSnapshot";

describe("canonical snapshot hook", () => {
  it("keeps one confirmed snapshot while deriving optimistic projections", async () => {
    const state = { ...initialTownState(42), cityName: "Atomic", revision: 4 };
    const { result } = renderHook(() => useCanonicalSnapshot({
      getOptimisticCommands: () => [],
    }));

    await act(async () => {
      await result.current.applyAuthoritativeState(
        state,
        4,
        undefined,
        "2026-08-06T20:00:00.000Z",
        "2026-08-06T20:00:00.000Z",
        false,
      );
    });
    expect(result.current.getLatestSnapshot()).toMatchObject({ revision: 4, state: { cityName: "Atomic" } });
    expect(result.current.projection).toMatchObject({ cityName: "Atomic" });

    act(() => result.current.renderOptimisticCommands([{
      type: "citizens.allocate",
      role: "farmers",
      amount: 1,
    }]));
    expect(result.current.projection).toEqual(expect.objectContaining({
      citizens: expect.objectContaining({ farmers: 1, unassigned: 2 }),
    }));
    expect(result.current.getLatestSnapshot()?.state.citizens).toMatchObject({ farmers: 0, unassigned: 3 });

    act(() => result.current.restoreConfirmedProjection());
    expect(result.current.projection).toBe(state);
  });

  it("refuses to reapply a snapshot after the account is marked deleted", async () => {
    const state = initialTownState(42);
    const { result } = renderHook(() => useCanonicalSnapshot({
      getOptimisticCommands: () => [],
    }));
    act(() => result.current.markUserDeleted("deleted-user"));

    let applied = true;
    await act(async () => {
      applied = await result.current.applyAuthoritativeState(state, 1, "deleted-user", undefined, undefined, false);
    });
    expect(applied).toBe(false);
    expect(result.current.projection).toBeNull();
  });
});
