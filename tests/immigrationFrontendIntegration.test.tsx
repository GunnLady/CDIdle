import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createAuthoritativeTimeAnchor } from "../src/domain/authoritativeTimeProjection";
import { useImmigrationReconciliation } from "../src/hooks/useImmigrationReconciliation";
import { INITIAL_TOWN_BUILDINGS, useTownSystem } from "../src/hooks/useTownSystem";
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
    const initialCitizens = {
      farmers: 0,
      woodcutters: 0,
      quarrymen: 0,
      miners: 0,
      unassigned: 3,
    };
    const { result, rerender } = renderHook(
      (props: {
        online: boolean;
        anchor: ReturnType<typeof createAuthoritativeTimeAnchor>;
        totalCitizens: number;
        citizens: typeof initialCitizens;
        citizenGrowthProgress: number;
      }) => useTownSystem({
        currentUser: { id: "user-1" },
        isOnline: props.online,
        timeAnchor: props.anchor,
        buildings: { ...INITIAL_TOWN_BUILDINGS, habitation: 2 },
        resources: makeResources({ food: 100 }),
        citizens: props.citizens,
        totalCitizens: props.totalCitizens,
        citizenGrowthProgress: props.citizenGrowthProgress,
      }),
      { initialProps: {
        online: true,
        anchor: pendingAnchor,
        totalCitizens: 3,
        citizens: initialCitizens,
        citizenGrowthProgress: 0,
      } },
    );
    expect(result.current).toMatchObject({
      displayTotalCitizens: 3,
      displayCitizenGrowthProgress: 100,
      hasPendingImmigration: true,
    });

    rerender({
      online: false,
      anchor: pendingAnchor,
      totalCitizens: 3,
      citizens: initialCitizens,
      citizenGrowthProgress: 0,
    });
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
    rerender({
      online: true,
      anchor: reconciledAnchor,
      totalCitizens: 4,
      citizens: {
        farmers: 0,
        woodcutters: 0,
        quarrymen: 0,
        miners: 0,
        unassigned: 4,
      },
      citizenGrowthProgress: 0,
    });
    expect(result.current).toMatchObject({
      displayTotalCitizens: 4,
      displayCitizenGrowthProgress: 0,
      hasPendingImmigration: false,
    });
    expect(result.current.citizens.unassigned).toBe(4);
  });
});
