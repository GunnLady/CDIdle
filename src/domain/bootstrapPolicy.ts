export type CanonicalBootstrapReason =
  | "initial"
  | "reconnect"
  | "immigration"
  | "recovery"
  | "visibility"
  | "leadership"
  | "conflict"
  | "manual";

export type CanonicalBootstrapPolicy = {
  priority: "user" | "background";
  skipWhenQueueBusy: boolean;
  mayReuseRecentSnapshot: boolean;
  justification: string;
};

export const CACHE_TIME_TO_USABLE_BUDGET_MS = 100;

export const CANONICAL_BOOTSTRAP_POLICIES: Record<CanonicalBootstrapReason, CanonicalBootstrapPolicy> = {
  initial: {
    priority: "background",
    skipWhenQueueBusy: false,
    mayReuseRecentSnapshot: false,
    justification: "Reconcile authentication and apply authoritative idle progression.",
  },
  reconnect: {
    priority: "background",
    skipWhenQueueBusy: false,
    mayReuseRecentSnapshot: false,
    justification: "Reconcile changes that may have happened while transport was unavailable.",
  },
  recovery: {
    priority: "background",
    skipWhenQueueBusy: true,
    mayReuseRecentSnapshot: false,
    justification: "Commit a projected hero recovery deadline without periodic polling.",
  },
  immigration: {
    priority: "background",
    skipWhenQueueBusy: false,
    mayReuseRecentSnapshot: false,
    justification: "Commit a projected immigration threshold before exposing the new citizen.",
  },
  visibility: {
    priority: "background",
    skipWhenQueueBusy: true,
    mayReuseRecentSnapshot: false,
    justification: "Reconcile server-owned idle progression once when a controlling tab becomes visible.",
  },
  leadership: {
    priority: "background",
    skipWhenQueueBusy: false,
    mayReuseRecentSnapshot: false,
    justification: "Confirm revision before enabling mutations in a newly controlling tab.",
  },
  conflict: {
    priority: "user",
    skipWhenQueueBusy: false,
    mayReuseRecentSnapshot: false,
    justification: "Reload the exact revision after a rejected mutation.",
  },
  manual: {
    priority: "user",
    skipWhenQueueBusy: false,
    mayReuseRecentSnapshot: false,
    justification: "Honor an explicit player synchronization request.",
  },
};
