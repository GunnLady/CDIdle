export * from "../../shared/domain/random.ts";

import type { Rng } from "../../shared/domain/random.ts";

/** Browser/runtime adapter. Authoritative and shared-domain code inject an RNG. */
export const systemRng: Rng = {
  next: () => Math.random(),
  nextInt: (maxExclusive: number) => {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error("maxExclusive must be a positive integer");
    }
    return Math.floor(Math.random() * maxExclusive);
  },
};
