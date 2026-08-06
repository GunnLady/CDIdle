import type {
  CanonicalGameState,
  CanonicalHero,
  CanonicalPendingClassTransition,
} from "../../../shared/contracts/authoritative.ts";
import { createExistingHeroPendingTransition } from "../../../shared/domain/class-transition.ts";

export function reconcileExistingVocations(state: CanonicalGameState): CanonicalGameState {
  const previousById = new Map(
    state.pendingClassTransitions.map((entry) => [entry.heroId, entry]),
  );
  const pending: CanonicalPendingClassTransition[] = [];
  for (const hero of state.heroes as CanonicalHero[]) {
    if (hero.classType !== "Novice" || hero.level < 10) continue;
    const created = createExistingHeroPendingTransition(hero, state.buildings);
    if (!created) continue;
    const previous = previousById.get(hero.id);
    pending.push(previous ? {
      ...created,
      originLevel: previous.originLevel,
      wasActive: previous.wasActive,
      previousStatus: previous.previousStatus,
    } : created);
  }
  return { ...state, pendingClassTransitions: pending };
}
