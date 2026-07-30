import type { CanonicalGameState } from "../shared/contracts/authoritative";

/** Compile-time proof that the Supabase surface can import the shared contract. */
export function acceptsSharedGameState(state: CanonicalGameState): CanonicalGameState {
  return state;
}
