import {
  CANONICAL_GAME_STATE_REQUIRED_FIELDS,
  type CanonicalGameState,
  type CanonicalGameStateFields,
} from "../../shared/contracts/authoritative";

export const CANONICAL_REACT_STATE_FIELDS = [
  "cityName",
  "resources",
  "buildings",
  "citizens",
  "totalCitizensCount",
  "citizenGrowthProgress",
  "storedItems",
  "forgeMaterials",
  "itemBlueprints",
  "heroes",
  "activeDungeonFloor",
  "activeDungeonRoom",
  "highestFloorReached",
  "autoExplore",
  "currentEncounter",
  "encounterHistory",
  "pendingForge",
  "pendingRecruit",
  "onboardingCandidates",
  "pendingOnboardingCityName",
  "pendingClassTransitions",
] as const;

// These canonical fields are deliberately persisted in the read-only cache but
// have no React setter: the format version and RNG are server-owned, while
// districts are disabled.
export const CANONICAL_CACHE_ONLY_STATE_FIELDS = ["stateVersion", "districts", "rngState"] as const;

type CanonicalReactStateField = (typeof CANONICAL_REACT_STATE_FIELDS)[number];
export type CanonicalReactState = Partial<Pick<CanonicalGameStateFields, CanonicalReactStateField>>;

export function canonicalReactMappingErrors(
  requiredFields: readonly string[] = CANONICAL_GAME_STATE_REQUIRED_FIELDS,
): string[] {
  const classified = new Set<string>([
    ...CANONICAL_REACT_STATE_FIELDS,
    ...CANONICAL_CACHE_ONLY_STATE_FIELDS,
  ]);
  return requiredFields
    .filter((field) => !classified.has(field))
    .map((field) => `canonical field ${field} is not mapped or explicitly cache-only`);
}

export function projectCanonicalState(state: CanonicalGameState): CanonicalReactState {
  return Object.fromEntries(
    CANONICAL_REACT_STATE_FIELDS
      .filter((field) => field in state)
      .map((field) => [field, state[field]]),
  ) as CanonicalReactState;
}
