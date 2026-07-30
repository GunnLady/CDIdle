import {
  MAX_CANONICAL_RNG_DRAWS,
  type CanonicalRngState,
} from "../../../shared/contracts/authoritative.ts";

export const DEFAULT_CANONICAL_RNG_SEED = 0x6d2b79f5;
export { MAX_CANONICAL_RNG_DRAWS };

export class CanonicalRngStateError extends Error {
  readonly code = "INVALID_GAME_STATE";

  constructor(public readonly reason: string) {
    super("canonical RNG state is invalid or unsupported");
  }
}

export class CanonicalRngExhaustedError extends Error {
  readonly code = "RNG_EXHAUSTED";
  readonly reason = "RNG_DRAWS_EXHAUSTED";

  constructor() {
    super("canonical RNG draw counter is exhausted");
  }
}

export function canonicalRngSeedFromUserId(userId: string): number {
  const canonicalId = userId.replace(/-/g, "").toLowerCase();
  let seed = 0x811c9dc5;
  for (let index = 0; index < canonicalId.length; index += 1) {
    seed ^= canonicalId.charCodeAt(index);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  return seed || DEFAULT_CANONICAL_RNG_SEED;
}

export const initialCanonicalRngState = (
  seed = DEFAULT_CANONICAL_RNG_SEED,
): CanonicalRngState => {
  const normalizedSeed = seed >>> 0 || DEFAULT_CANONICAL_RNG_SEED;
  return {
    algorithm: "xorshift32",
    version: 1,
    seed: normalizedSeed,
    state: normalizedSeed,
    draws: 0,
  };
};

export function canonicalRngStateIssue(value: unknown): string | null {
  if (!value || typeof value !== "object") return "RNG_STATE_NOT_OBJECT";
  const state = value as Record<string, unknown>;
  if (state.algorithm !== "xorshift32") return "RNG_ALGORITHM_UNSUPPORTED";
  if (state.version !== 1) return "RNG_VERSION_UNSUPPORTED";
  if (!Number.isInteger(state.seed) || Number(state.seed) < 1 || Number(state.seed) > 0xffff_ffff) {
    return "RNG_SEED_INVALID";
  }
  if (!Number.isInteger(state.state) || Number(state.state) < 1 || Number(state.state) > 0xffff_ffff) {
    return "RNG_STATE_INVALID";
  }
  if (!Number.isSafeInteger(state.draws) || Number(state.draws) < 0 || Number(state.draws) > MAX_CANONICAL_RNG_DRAWS) {
    return "RNG_DRAWS_INVALID";
  }
  return null;
}


export function migrateCanonicalRngState(
  value: unknown,
  legacySeed?: number,
): CanonicalRngState {
  if (value === undefined) return initialCanonicalRngState(legacySeed);
  const issue = canonicalRngStateIssue(value);
  if (issue) throw new CanonicalRngStateError(issue);
  const state = value as CanonicalRngState;
  if (
    legacySeed !== undefined
    && state.seed !== initialCanonicalRngState(legacySeed).seed
  ) {
    throw new CanonicalRngStateError("RNG_SEED_USER_MISMATCH");
  }
  return { ...state };
}

export type CanonicalRng = {
  next(): number;
  nextInt(maxExclusive: number): number;
  snapshot(): CanonicalRngState;
};

export function nextCanonicalSubseed(master: CanonicalRng): number {
  return Math.floor(master.next() * 0x1_0000_0000) >>> 0;
}

export function forkCanonicalRng(master: CanonicalRng): CanonicalRng {
  return restoreCanonicalRng(initialCanonicalRngState(nextCanonicalSubseed(master)));
}

export function restoreCanonicalRng(value: unknown): CanonicalRng {
  const initial = migrateCanonicalRngState(value);
  let state = initial.state >>> 0;
  let draws = initial.draws;
  const next = () => {
    if (draws >= MAX_CANONICAL_RNG_DRAWS) throw new CanonicalRngExhaustedError();
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    draws += 1;
    return state / 0x1_0000_0000;
  };
  return {
    next,
    nextInt(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error("RNG_MAX_EXCLUSIVE_REQUIRED");
      }
      return Math.floor(next() * maxExclusive);
    },
    snapshot: () => ({
      algorithm: "xorshift32",
      version: 1,
      seed: initial.seed,
      state,
      draws,
    }),
  };
}
