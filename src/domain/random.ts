export interface Clock {
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

export function fixedClock(timestamp: number): Clock {
  if (!Number.isFinite(timestamp)) throw new Error("timestamp must be finite");
  return { now: () => timestamp };
}

export interface Rng {
  next(): number;
  nextInt(maxExclusive: number): number;
}

/** UI/runtime boundary adapter. Authoritative code must inject seededRng instead. */
export const systemRng: Rng = {
  next: () => Math.random(),
  nextInt: (maxExclusive: number) => {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new Error("maxExclusive must be a positive integer");
    return Math.floor(Math.random() * maxExclusive);
  }
};

/** Deterministic xorshift32 generator; persist the seed/state at the server boundary. */
export function seededRng(seed: number): Rng {
  if (!Number.isInteger(seed)) throw new Error("seed must be an integer");
  let state = seed | 0;
  return {
    next: () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 0x1_0000_0000;
    },
    nextInt: (maxExclusive: number) => {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new Error("maxExclusive must be a positive integer");
      return Math.floor((state ^= state << 13, state ^= state >>> 17, state ^= state << 5, (state >>> 0) / 0x1_0000_0000) * maxExclusive);
    }
  };
}
