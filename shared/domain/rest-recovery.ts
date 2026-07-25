export const REST_RECOVERY_RATE_PER_SECOND = 0.02;

export function recoverRestingGauge(
  current: number,
  maximum: number,
  elapsedSeconds: number,
): number {
  return Math.min(
    maximum,
    current + maximum * REST_RECOVERY_RATE_PER_SECOND * Math.max(0, elapsedSeconds),
  );
}
