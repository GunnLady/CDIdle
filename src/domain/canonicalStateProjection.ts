import { CANONICAL_GAME_STATE_REQUIRED_FIELDS } from "../../shared/contracts/authoritative";

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
// currently have no React setter: districts are disabled and RNG is server-only.
export const CANONICAL_CACHE_ONLY_STATE_FIELDS = ["districts", "rngState"] as const;

type CanonicalReactStateField = (typeof CANONICAL_REACT_STATE_FIELDS)[number];

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

export function projectCanonicalState<T extends Record<string, unknown>>(
  state: T,
): Partial<Record<CanonicalReactStateField, T[keyof T]>> {
  return Object.fromEntries(
    CANONICAL_REACT_STATE_FIELDS
      .filter((field) => field in state)
      .map((field) => [field, state[field]]),
  ) as Partial<Record<CanonicalReactStateField, T[keyof T]>>;
}
