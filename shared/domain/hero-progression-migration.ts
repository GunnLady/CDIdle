import type { CanonicalGameState, CanonicalHero } from "../contracts/authoritative.ts";
import {
  CURRENT_HERO_PROGRESSION_MODEL,
  CURRENT_HERO_PROGRESSION_MODEL_ID,
  LEGACY_HERO_PROGRESSION_MODEL,
} from "../data/hero-progression-models.ts";
import { migrateHeroXpProgress } from "./hero-xp.ts";

export function upgradeCanonicalHeroProgression(state: CanonicalGameState): CanonicalGameState {
  if (state.heroProgressionModelId === CURRENT_HERO_PROGRESSION_MODEL_ID) return state;
  if (state.heroProgressionModelId !== LEGACY_HERO_PROGRESSION_MODEL.id) {
    throw new Error(`UNSUPPORTED_HERO_PROGRESSION_MODEL:${state.heroProgressionModelId}`);
  }
  const migrateHero = (hero: CanonicalHero): CanonicalHero =>
    migrateHeroXpProgress(hero, CURRENT_HERO_PROGRESSION_MODEL);
  return {
    ...state,
    heroProgressionModelId: CURRENT_HERO_PROGRESSION_MODEL_ID,
    heroes: state.heroes.map(migrateHero),
    onboardingCandidates: (state.onboardingCandidates ?? []).map(migrateHero),
    pendingRecruit: state.pendingRecruit ? migrateHero(state.pendingRecruit) : state.pendingRecruit,
  };
}
