export function asLegacyUnversionedState<T extends Record<string, unknown>>(
  state: T,
): Omit<T, "stateVersion"> & Record<string, unknown> {
  const legacy = structuredClone(state);
  delete legacy.stateVersion;
  return legacy as Omit<T, "stateVersion"> & Record<string, unknown>;
}

const buildings = {
  habitation: 1,
  ferme: 0,
  scierie: 0,
  carriere: 0,
  mine: 0,
  maison_chef: 0,
  guilde: 0,
  temple: 0,
  caserne: 0,
  poste_chasse: 0,
  academie: 0,
  cercle: 0,
  lair: 0,
  forge: 0,
};

export const legacyV0GoldenBefore: Record<string, unknown> = {
  resources: { gold: 75, food: 50, wood: 20, stone: 0, ore: 0 },
  buildings,
  citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
  totalCitizensCount: 3,
  districts: {},
  heroes: [],
  storedItems: [],
  forgeMaterials: [],
  itemBlueprints: [],
  citizenGrowthProgress: 0,
  activeDungeonFloor: 1,
  activeDungeonRoom: 1,
  highestFloorReached: 1,
  currentEncounter: null,
  encounterHistory: [],
  autoExplore: false,
  onboardingCandidates: [],
  pendingOnboardingCityName: "",
  pendingClassTransitions: [],
};

export const currentV4GoldenAfter: Record<string, unknown> = {
  ...legacyV0GoldenBefore,
  stateVersion: 5,
  heroProgressionModelId: "legacy-global-v1",
  pendingRecruit: undefined,
  pendingForge: undefined,
  dungeonProgress: {
    dungeonId: "undercity",
    heroes: {},
    expedition: { dungeonId: "undercity", mode: "progression", zoneId: null, floor: 1, room: 1, halted: false, haltReason: null },
  },
  buildings: { ...buildings },
  itemBlueprints: [
    { itemId: "progression_sword", unlocked: true },
    { itemId: "progression_dagger", unlocked: true },
    { itemId: "progression_axe", unlocked: true },
    { itemId: "progression_shield", unlocked: true },
    { itemId: "progression_cloth_armor", unlocked: true },
    { itemId: "progression_leather_armor", unlocked: true },
  ],
  rngState: { algorithm: "xorshift32", version: 1, seed: 42, state: 42, draws: 0 },
};
