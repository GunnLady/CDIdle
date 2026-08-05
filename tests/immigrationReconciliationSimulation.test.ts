import { describe, expect, it, vi } from "vitest";
import { projectTownDisplay } from "../src/domain/townProjection";
import {
  createAuthoritativeTimeAnchor,
  projectAuthoritativeElapsedSeconds,
} from "../src/domain/authoritativeTimeProjection";
import { CanonicalOperationQueue } from "../src/lib/canonicalOperationQueue";
import { CanonicalAuthorityGeneration } from "../src/lib/canonicalReconciliation";
import { makeResources } from "./fixtures/game";

describe("immigration reconciliation simulation", () => {
  it("queues one canonical reconciliation and never exposes the projected citizen", async () => {
    const projection = projectTownDisplay({
      resources: makeResources({ food: 100 }),
      rates: { food: 0, wood: 0, stone: 0, ore: 0 },
      elapsedSeconds: 20,
      totalCitizens: 3,
      habitationLevel: 2,
      citizenGrowthProgress: 0,
    });
    expect(projection).toMatchObject({
      totalCitizens: 3,
      citizenGrowthProgress: 100,
      hasPendingImmigration: true,
    });

    const reconcile = vi.fn(async () => undefined);
    const queue = new CanonicalOperationQueue();
    const first = queue.enqueueCoalescedBackground("town-authority", reconcile, "bootstrap:immigration");
    const duplicate = queue.enqueueCoalescedBackground("town-authority", reconcile, "bootstrap:immigration");

    expect(duplicate).toBe(first);
    await first;
    expect(reconcile).toHaveBeenCalledTimes(1);
  });

  it("runs after a concurrent player command without racing it", async () => {
    const order: string[] = [];
    let releaseCommand!: () => void;
    const commandPending = new Promise<void>((resolve) => { releaseCommand = resolve; });
    const queue = new CanonicalOperationQueue();
    const command = queue.enqueueUser(async () => {
      order.push("command:start");
      await commandPending;
      order.push("command:end");
    }, "command:citizens.allocate");
    const immigration = queue.enqueueCoalescedBackground("town-authority", async () => {
      order.push("immigration");
    }, "bootstrap:immigration");

    await Promise.resolve();
    expect(order).toEqual(["command:start"]);
    releaseCommand();
    await Promise.all([command, immigration]);
    expect(order).toEqual(["command:start", "command:end", "immigration"]);
  });

  it("skips the queued bootstrap when a command already reconciled the threshold", async () => {
    const authorityGeneration = new CanonicalAuthorityGeneration();
    const scheduledGeneration = authorityGeneration.current;
    const network = vi.fn(async () => undefined);
    const queue = new CanonicalOperationQueue();
    const command = queue.enqueueUser(async () => {
      authorityGeneration.advance();
    }, "command:citizens.allocate");
    const immigration = queue.enqueueCoalescedBackground(
      "canonical-bootstrap:user-1",
      async () => {
        if (!authorityGeneration.isCurrent(scheduledGeneration)) return;
        await network();
      },
      "bootstrap:immigration",
    );

    await Promise.all([command, immigration]);
    expect(network).not.toHaveBeenCalled();
  });

  it("freezes the read-only threshold during an outage and leaves reconciliation to reconnect", () => {
    const anchor = createAuthoritativeTimeAnchor(
      "2026-08-05T20:00:00.000Z",
      "2026-08-05T20:00:00.000Z",
      1_000,
    );
    const disconnectedAt = 21_000;
    const elapsedAtDisconnect = projectAuthoritativeElapsedSeconds(anchor, disconnectedAt);
    const projectFrozenOfflineState = () => projectTownDisplay({
      resources: makeResources({ food: 100 }),
      rates: { food: 0, wood: 0, stone: 0, ore: 0 },
      elapsedSeconds: elapsedAtDisconnect,
      totalCitizens: 3,
      habitationLevel: 2,
      citizenGrowthProgress: 0,
    });

    expect(projectFrozenOfflineState()).toMatchObject({
      totalCitizens: 3,
      citizenGrowthProgress: 100,
      hasPendingImmigration: true,
    });
    expect(projectFrozenOfflineState()).toEqual(projectFrozenOfflineState());
  });
});
