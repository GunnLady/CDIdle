import type { GameState } from "../shared/contracts/game-state";

/** Compile-time proof that the Supabase surface can import the shared contract. */
export function acceptsSharedGameState(state: GameState): GameState {
  return state;
}
