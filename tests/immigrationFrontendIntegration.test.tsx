import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createAuthoritativeTimeAnchor } from "../src/domain/authoritativeTimeProjection";
import { useImmigrationReconciliation } from "../src/hooks/useImmigrationReconciliation";
import { useTownSystem } from "../src/hooks/useTownSystem";
import { makeResources } from "./fixtures/game";

describe("immigration frontend integration", () => {
  it("triggers only in the leader and forwards the observed authority generation", async () => {
    const reconcile = vi.fn(async () => undefined);
    const { rerender } = renderHook(
      (props: { leader: boolean; pending: boolean; generation: number }) =>
        useImmigrationReconciliation({
          isAutomationLeader: props.leader,
          hasPendingImmigration: props.pending,
          authorityGeneration: props.generation,
          reconcile,
        }),
      { initialProps: { leader: false, pending: true, generation: 7 } },
    );

    expect(reconcile).not.toHaveBeenCalled();
    rerender({ leader: true, pending: true, generation: 7 });
    await waitFor(() => expect(reconcile).toHaveBeenCalledWith(7));
    expect(reconcile).toHaveBeenCalledTimes(1);
  });

  it("freezes the projected threshold offline and accepts the reconciled snapshot", () => {
    const receivedAt = globalThis.performance.now();
    const pendingAnchor = createAuthoritativeTimeAnchor(
      "2026-08-05T20:00:00.000Z",
      "2026-08-05T20:00:00.000Z",
      receivedAt - 20_000,
    );
    const { result, rerender } = renderHook(
      (props: { online: boolean; anchor: ReturnType<typeof createAuthoritativeTimeAnchor> }) =>
        useTownSystem({ id: "user-1" }, props.online, props.anchor),
      { initialProps: { online: true, anchor: pendingAnchor } },
    );
    act(() => {
      result.current.setBuildings({ ...result.current.buildings, habitation: 2 });
      result.current.setResources(makeResources({ food: 100 }));
    });
    expect(result.current).toMatchObject({
      displayTotalCitizens: 3,
      displayCitizenGrowthProgress: 100,
      hasPendingImmigration: true,
    });

    rerender({ online: false, anchor: pendingAnchor });
    expect(result.current).toMatchObject({
      displayTotalCitizens: 3,
      displayCitizenGrowthProgress: 100,
      hasPendingImmigration: true,
    });

    const reconciledAnchor = createAuthoritativeTimeAnchor(
      "2026-08-05T20:00:20.000Z",
      "2026-08-05T20:00:20.000Z",
      globalThis.performance.now(),
    );
    act(() => {
      result.current.setTotalCitizens(4);
      result.current.setCitizens({
        farmers: 0,
        woodcutters: 0,
        quarrymen: 0,
        miners: 0,
        unassigned: 4,
      });
      result.current.setCitizenGrowthProgress(0);
    });
    rerender({ online: true, anchor: reconciledAnchor });
    expect(result.current).toMatchObject({
      displayTotalCitizens: 4,
      displayCitizenGrowthProgress: 0,
      hasPendingImmigration: false,
    });
    expect(result.current.citizens.unassigned).toBe(4);
  });
});
