export type AuthoritativeTimeAnchor = {
  serverTimeMs: number;
  lastProcessedAtMs: number;
  receivedAtMonotonicMs: number;
};

export function createAuthoritativeTimeAnchor(
  serverTime: string,
  lastProcessedAt: string,
  receivedAtMonotonicMs: number,
): AuthoritativeTimeAnchor | null {
  const serverTimeMs = Date.parse(serverTime);
  const lastProcessedAtMs = Date.parse(lastProcessedAt);
  if (!Number.isFinite(serverTimeMs)
      || !Number.isFinite(lastProcessedAtMs)
      || !Number.isFinite(receivedAtMonotonicMs)) return null;
  return { serverTimeMs, lastProcessedAtMs, receivedAtMonotonicMs };
}

export function projectAuthoritativeElapsedSeconds(
  anchor: AuthoritativeTimeAnchor | null,
  monotonicNowMs: number,
): number {
  if (!anchor || !Number.isFinite(monotonicNowMs)) return 0;
  const authoritativeRemainder = Math.max(0, anchor.serverTimeMs - anchor.lastProcessedAtMs);
  const localElapsed = Math.max(0, monotonicNowMs - anchor.receivedAtMonotonicMs);
  return (authoritativeRemainder + localElapsed) / 1000;
}
