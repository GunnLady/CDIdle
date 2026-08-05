import { describe, expect, it, vi } from "vitest";
import { hydrateCanonicalBootstrapCache } from "../src/lib/bootstrapCacheHydration";
import { initialTownState } from "../supabase/functions/game-api/town-authority";

describe("bootstrap cache hydration", () => {
  it("renders a confirmed cache before a slow authoritative response", async () => {
    let now = 0;
    const apply = vi.fn(async () => { now = 12; });
    const onMetrics = vi.fn();
    const outcome = await hydrateCanonicalBootstrapCache({
      read: async () => ({ ...initialTownState(), revision: 7 }),
      apply,
      shouldIgnore: () => false,
      now: () => now,
      onMetrics,
    });

    expect(outcome).toBe("applied");
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ revision: 7 }), 7);
    expect(onMetrics).toHaveBeenCalledWith({ outcome: "applied", durationMs: 12 });
  });

  it("does nothing when the cache is absent or invalid", async () => {
    const apply = vi.fn();
    await expect(hydrateCanonicalBootstrapCache({
      read: async () => ({ revision: 2 }),
      apply,
      shouldIgnore: () => false,
      now: () => 0,
    })).resolves.toBe("missing");
    expect(apply).not.toHaveBeenCalled();
  });

  it("never overwrites an authoritative response that arrived first", async () => {
    const apply = vi.fn();
    await expect(hydrateCanonicalBootstrapCache({
      read: async () => ({ ...initialTownState(), revision: 7 }),
      apply,
      shouldIgnore: () => true,
      now: () => 0,
    })).resolves.toBe("superseded");
    expect(apply).not.toHaveBeenCalled();
  });
});
