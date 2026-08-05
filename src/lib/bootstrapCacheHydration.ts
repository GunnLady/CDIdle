import { isCanonicalGameState, type CanonicalGameState } from "../../shared/contracts/authoritative";

export type BootstrapCacheHydrationOutcome = "applied" | "missing" | "superseded";

export type BootstrapCacheHydrationMetrics = {
  outcome: BootstrapCacheHydrationOutcome;
  durationMs: number;
};

export async function hydrateCanonicalBootstrapCache(options: {
  read(): Promise<unknown>;
  apply(state: CanonicalGameState, revision: number): Promise<unknown>;
  shouldIgnore(): boolean;
  now(): number;
  onMetrics?: (metrics: BootstrapCacheHydrationMetrics) => void;
}): Promise<BootstrapCacheHydrationOutcome> {
  const startedAt = options.now();
  let outcome: BootstrapCacheHydrationOutcome = "missing";
  try {
    const candidate = await options.read();
    if (!isCanonicalGameState(candidate)) return outcome;
    if (options.shouldIgnore()) {
      outcome = "superseded";
      return outcome;
    }
    await options.apply(candidate, Number(candidate.revision));
    outcome = options.shouldIgnore() ? "superseded" : "applied";
    return outcome;
  } finally {
    try {
      options.onMetrics?.({ outcome, durationMs: Math.max(0, options.now() - startedAt) });
    } catch {
      // Cache observability must never delay or reject bootstrap reconciliation.
    }
  }
}
