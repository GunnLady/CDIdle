import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { useCanonicalSnapshot } from "../src/hooks/useCanonicalSnapshot";
import type { OptimisticGameCommand } from "../src/domain/optimisticStateProjection";

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

  it("reprojects still-valid commands after a conflict reload", async () => {
    let pending: OptimisticGameCommand[] = [];
    const initial = initialTownState(42);
    const { result } = renderHook(() => useCanonicalSnapshot({
      getOptimisticCommands: () => pending,
    }));

    await act(async () => {
      await result.current.applyAuthoritativeState(
        initial,
        1,
        undefined,
        "2026-08-07T08:00:00.000Z",
        "2026-08-07T08:00:00.000Z",
        false,
      );
    });
    pending = [{ type: "citizens.allocate", role: "farmers", amount: 1 }];
    act(() => result.current.renderOptimisticCommands(pending));

    const reloaded = {
      ...initial,
      citizens: { ...initial.citizens, farmers: 1, unassigned: 2 },
    };
    await act(async () => {
      await result.current.applyAuthoritativeState(
        reloaded,
        2,
        undefined,
        "2026-08-07T08:00:01.000Z",
        "2026-08-07T08:00:01.000Z",
        false,
      );
    });

    expect(result.current.getLatestSnapshot()).toMatchObject({
      revision: 2,
      state: { citizens: { farmers: 1, unassigned: 2 } },
    });
    expect(result.current.projection?.citizens).toMatchObject({ farmers: 2, unassigned: 1 });
  });

  it.each(["refusal", "network failure", "timeout"])(
    "restores the last confirmed snapshot after %s",
    async () => {
      const confirmed = initialTownState(42);
      const { result } = renderHook(() => useCanonicalSnapshot({ getOptimisticCommands: () => [] }));
      await act(async () => {
        await result.current.applyAuthoritativeState(
          confirmed,
          1,
          undefined,
          "2026-08-07T08:00:00.000Z",
          "2026-08-07T08:00:00.000Z",
          false,
        );
      });
      act(() => result.current.renderOptimisticCommands([{
        type: "citizens.allocate",
        role: "farmers",
        amount: 1,
      }]));
      expect(result.current.projection).not.toBe(confirmed);

      act(() => result.current.restoreConfirmedProjection());

      expect(result.current.projection).toBe(confirmed);
      expect(result.current.getLatestSnapshot()?.state).toBe(confirmed);
    },
  );
});
