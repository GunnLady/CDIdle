import { describe, expect, it } from "vitest";
import { hydrateCanonicalBootstrapCache } from "../src/lib/bootstrapCacheHydration";
import {
  CACHE_TIME_TO_USABLE_BUDGET_MS,
} from "../src/domain/bootstrapPolicy";
import { CanonicalOperationQueue } from "../src/lib/canonicalOperationQueue";
import { canMutateCanonicalState, canUseAccountDangerActions } from "../src/lib/canonicalMutationAccess";
import { initialTownState } from "../supabase/functions/game-api/town-authority";

describe("bootstrap latency simulation", () => {
  it("makes a confirmed cache usable inside the local budget while authority remains pending", async () => {
    let now = 0;
    let usableAt: number | null = null;
    const outcome = await hydrateCanonicalBootstrapCache({
      read: async () => {
        now = 8;
        return { ...initialTownState(), revision: 4 };
      },
      apply: async () => {
        now = 12;
        usableAt = now;
      },
      shouldIgnore: () => false,
      now: () => now,
    });

    expect(outcome).toBe("applied");
    expect(usableAt).toBeLessThanOrEqual(CACHE_TIME_TO_USABLE_BUDGET_MS);
  });

  it("keeps mutations locked while only the cached projection is usable", () => {
    expect(canMutateCanonicalState({
      online: true,
      authoritativeReady: false,
      automationLeader: false,
    })).toBe(false);
    expect(canMutateCanonicalState({
      online: true,
      authoritativeReady: false,
      automationLeader: true,
    })).toBe(false);
    expect(canMutateCanonicalState({
      online: true,
      authoritativeReady: true,
      automationLeader: true,
    })).toBe(true);
  });

  it("keeps destructive account recovery available for an incompatible canonical save", () => {
    expect(canUseAccountDangerActions({
      browserOnline: true,
      transportOnline: false,
      authoritativeReady: true,
      automationLeader: false,
      canonicalStateFailed: true,
    })).toBe(true);
    expect(canUseAccountDangerActions({
      browserOnline: false,
      transportOnline: false,
      authoritativeReady: true,
      automationLeader: false,
      canonicalStateFailed: true,
    })).toBe(false);
    expect(canUseAccountDangerActions({
      browserOnline: true,
      transportOnline: true,
      authoritativeReady: true,
      automationLeader: false,
      canonicalStateFailed: false,
    })).toBe(false);
  });

  it("never lets a heartbeat compete with a queued user mutation", async () => {
    let releaseUser!: () => void;
    const userPending = new Promise<void>((resolve) => { releaseUser = resolve; });
    const queue = new CanonicalOperationQueue();
    const command = queue.enqueueUser(() => userPending, "command:test");

    expect(queue.tryEnqueueBackground(async () => undefined, "bootstrap:heartbeat")).toBeNull();
    releaseUser();
    await command;
  });
});
