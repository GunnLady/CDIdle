export const DECIMAL_GB = 1_000_000_000;

export type EgressRouteProfile = {
  name: string;
  callsPerDay: number;
  postgrestBytesPerCall?: number;
  functionsBytesPerCall?: number;
  authBytesPerCall?: number;
};

export type EgressBudgetEstimate = {
  dailyBytes: {
    postgrest: number;
    functions: number;
    auth: number;
    total: number;
  };
  projectedCycleBytes: number;
  targetCycleBytes: number;
  withinTarget: boolean;
};

export const jsonUtf8Bytes = (value: unknown): number =>
  new TextEncoder().encode(JSON.stringify(value)).byteLength;

export function estimateEgressBudget(options: {
  cycleDays: number;
  targetCycleBytes: number;
  safetyFactor: number;
  routes: EgressRouteProfile[];
}): EgressBudgetEstimate {
  if (!Number.isFinite(options.cycleDays) || options.cycleDays <= 0) {
    throw new Error("cycleDays must be positive");
  }
  if (!Number.isFinite(options.targetCycleBytes) || options.targetCycleBytes <= 0) {
    throw new Error("targetCycleBytes must be positive");
  }
  if (!Number.isFinite(options.safetyFactor) || options.safetyFactor < 1) {
    throw new Error("safetyFactor must be at least 1");
  }
  const category = (field: "postgrestBytesPerCall" | "functionsBytesPerCall" | "authBytesPerCall") =>
    options.routes.reduce((total, route) => {
      if (!Number.isFinite(route.callsPerDay) || route.callsPerDay < 0) {
        throw new Error(route.name + ".callsPerDay must be non-negative");
      }
      const bytes = route[field] ?? 0;
      if (!Number.isFinite(bytes) || bytes < 0) {
        throw new Error(route.name + "." + field + " must be non-negative");
      }
      return total + route.callsPerDay * bytes;
    }, 0);
  const postgrest = category("postgrestBytesPerCall");
  const functions = category("functionsBytesPerCall");
  const auth = category("authBytesPerCall");
  const total = postgrest + functions + auth;
  const projectedCycleBytes = total * options.cycleDays * options.safetyFactor;
  return {
    dailyBytes: { postgrest, functions, auth, total },
    projectedCycleBytes,
    targetCycleBytes: options.targetCycleBytes,
    withinTarget: projectedCycleBytes <= options.targetCycleBytes,
  };
}

export function maximumDailyCallsWithinBudget(options: {
  cycleDays: number;
  targetCycleBytes: number;
  safetyFactor: number;
  fixedDailyBytes: number;
  bytesPerCall: number;
}): number {
  if (!Number.isFinite(options.cycleDays) || options.cycleDays <= 0) {
    throw new Error("cycleDays must be positive");
  }
  if (!Number.isFinite(options.targetCycleBytes) || options.targetCycleBytes <= 0) {
    throw new Error("targetCycleBytes must be positive");
  }
  if (!Number.isFinite(options.safetyFactor) || options.safetyFactor < 1) {
    throw new Error("safetyFactor must be at least 1");
  }
  if (!Number.isFinite(options.fixedDailyBytes) || options.fixedDailyBytes < 0) {
    throw new Error("fixedDailyBytes must be non-negative");
  }
  if (!Number.isFinite(options.bytesPerCall) || options.bytesPerCall < 0) {
    throw new Error("bytesPerCall must be non-negative");
  }
  const dailyBudget = options.targetCycleBytes / options.cycleDays / options.safetyFactor;
  if (options.bytesPerCall === 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((dailyBudget - options.fixedDailyBytes) / options.bytesPerCall));
}
