import {
  CURRENT_CANONICAL_STATE_VERSION,
  validateCanonicalGameState,
  type CanonicalGameState,
  type CanonicalPendingClassTransition,
} from "../../../shared/contracts/authoritative.ts";
import { migrateAuthoritativeHeroProgression } from "../../../shared/domain/authoritative-hero-validation.ts";
import { getDungeonRoomCount } from "../../../shared/domain/dungeon-progression.ts";
import { getItemById } from "../../../shared/domain/items/items.ts";
import { migrateCanonicalRngState } from "./authoritative-rng.ts";
import { DEFAULT_NOVICE_ITEM_BLUEPRINTS } from "./forge-authority.ts";
import {
  calculateAuthoritativeHeroStats,
  type AuthoritativeEquipment,
  type AuthoritativeNoviceStats,
} from "./novice-stats-authority.ts";
import { reconcileExistingVocations } from "./vocation-reconciliation.ts";

export const LEGACY_UNVERSIONED_STATE_VERSION = 0 as const;

export type CanonicalStateMigrationContext = {
  defaults: CanonicalGameState;
  legacySeed?: number;
};

export class CanonicalStateMigrationError extends Error {
  constructor(
    public readonly code:
      | "STATE_VERSION_INVALID"
      | "STATE_VERSION_FUTURE"
      | "STATE_MIGRATION_MISSING"
      | "STATE_MIGRATION_INVALID_RESULT",
    message: string,
    public readonly version?: number,
  ) {
    super(message);
  }
}

type CanonicalStateMigration = {
  from: number;
  to: number;
  migrate: (
    state: Record<string, unknown>,
    context: CanonicalStateMigrationContext,
  ) => Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function readStateVersion(state: Record<string, unknown>): number {
  if (state.stateVersion === undefined) return LEGACY_UNVERSIONED_STATE_VERSION;
  if (!Number.isInteger(state.stateVersion) || Number(state.stateVersion) < 0) {
    throw new CanonicalStateMigrationError(
      "STATE_VERSION_INVALID",
      "stateVersion must be a non-negative integer",
    );
  }
  return Number(state.stateVersion);
}

function migrateHeroWithDerivedStats(input: unknown): unknown {
  const progressed = migrateAuthoritativeHeroProgression(input);
  if (!isRecord(progressed)) return progressed;
  const existingCalculatedStats = progressed.calculatedStats;
  if (!isRecord(existingCalculatedStats) || !isRecord(progressed.baseStats)) return progressed;
  const calculatedStats = calculateAuthoritativeHeroStats(
    progressed.baseStats as AuthoritativeNoviceStats,
    Array.isArray(progressed.passiveSkills)
      ? progressed.passiveSkills.filter((id): id is string => typeof id === "string")
      : [],
    isRecord(progressed.equipment) ? progressed.equipment as AuthoritativeEquipment : {},
  );
  return {
    ...progressed,
    currentHp: typeof progressed.currentHp === "number"
      ? Math.min(progressed.currentHp, calculatedStats.maxHp)
      : calculatedStats.maxHp,
    currentMana: typeof progressed.currentMana === "number"
      ? Math.min(progressed.currentMana, calculatedStats.maxMana)
      : calculatedStats.maxMana,
    calculatedStats,
  };
}

function migrateInstrumentToTwoHands(input: unknown, storedItems: unknown): unknown {
  if (!isRecord(input) || !isRecord(input.equipment)) return input;
  const equipment = input.equipment;
  if (!isRecord(equipment.mainHand) || !isRecord(equipment.offHand)) return input;
  const mainHand = typeof equipment.mainHand.itemId === "string"
    ? getItemById(equipment.mainHand.itemId)
    : undefined;
  if (!mainHand || mainHand.itemType !== "weapon" || mainHand.weaponTypeId !== "instrument") {
    return input;
  }
  if (Array.isArray(storedItems)) {
    const instanceId = equipment.offHand.instanceId;
    const alreadyStored = typeof instanceId === "string"
      && storedItems.some((entry) => isRecord(entry) && entry.instanceId === instanceId);
    if (!alreadyStored) storedItems.push({ ...equipment.offHand });
  }
  const { offHand: _displacedOffHand, ...remainingEquipment } = equipment;
  return { ...input, equipment: remainingEquipment };
}

function migrateV0ToV1(
  current: Record<string, unknown>,
  context: CanonicalStateMigrationContext,
): Record<string, unknown> {
  const defaults = structuredClone(context.defaults);
  const mergeMap = <T extends object>(fallback: T, value: unknown): T | unknown =>
    value === undefined
      ? { ...fallback }
      : isRecord(value)
        ? { ...fallback, ...value }
        : value;
  const migratedStoredItems = Array.isArray(current.storedItems)
    ? current.storedItems.map((entry) => isRecord(entry) ? { ...entry } : entry)
    : current.storedItems === undefined
      ? defaults.storedItems.map((entry) => ({ ...entry }))
      : current.storedItems;
  const migrateHero = (hero: unknown) => migrateHeroWithDerivedStats(
    migrateInstrumentToTwoHands(hero, migratedStoredItems),
  );
  const migratedHeroes = Array.isArray(current.heroes)
    ? current.heroes.map(migrateHero)
    : current.heroes === undefined
      ? defaults.heroes.map((hero) => structuredClone(hero))
      : current.heroes;
  const candidate = {
    ...defaults,
    ...current,
    stateVersion: CURRENT_CANONICAL_STATE_VERSION,
    resources: mergeMap(defaults.resources, current.resources),
    buildings: mergeMap(defaults.buildings, current.buildings),
    citizens: mergeMap(defaults.citizens, current.citizens),
    heroes: migratedHeroes,
    storedItems: migratedStoredItems,
    onboardingCandidates: Array.isArray(current.onboardingCandidates)
      ? current.onboardingCandidates.map(migrateHero)
      : current.onboardingCandidates,
    pendingRecruit: current.pendingRecruit
      ? migrateHero(current.pendingRecruit)
      : current.pendingRecruit,
    itemBlueprints: current.itemBlueprints === undefined
      || (Array.isArray(current.itemBlueprints) && current.itemBlueprints.length === 0)
      ? DEFAULT_NOVICE_ITEM_BLUEPRINTS.map((entry) => ({ ...entry }))
      : current.itemBlueprints,
    pendingClassTransitions: Array.isArray(current.pendingClassTransitions)
      ? current.pendingClassTransitions as CanonicalPendingClassTransition[]
      : current.pendingClassTransitions === undefined
        ? []
        : current.pendingClassTransitions,
    rngState: migrateCanonicalRngState(current.rngState, context.legacySeed),
  };
  const migrated = validateCanonicalGameState(candidate).length === 0
    ? reconcileExistingVocations(candidate as CanonicalGameState)
    : candidate as CanonicalGameState;
  if (!migrated.currentEncounter) {
    const floor = Number(migrated.activeDungeonFloor ?? 1);
    const room = Number(migrated.activeDungeonRoom ?? 1);
    if (Number.isInteger(floor) && floor >= 1 && Number.isInteger(room) && room >= 1) {
      migrated.activeDungeonRoom = Math.min(room, getDungeonRoomCount(floor));
    }
  }
  return migrated;
}

export const CANONICAL_STATE_MIGRATIONS: readonly CanonicalStateMigration[] = [
  { from: LEGACY_UNVERSIONED_STATE_VERSION, to: 1, migrate: migrateV0ToV1 },
];

export function migrateCanonicalState(
  input: Record<string, unknown>,
  context: CanonicalStateMigrationContext,
): CanonicalGameState {
  let state = structuredClone(input);
  let version = readStateVersion(state);
  if (version > CURRENT_CANONICAL_STATE_VERSION) {
    throw new CanonicalStateMigrationError(
      "STATE_VERSION_FUTURE",
      `stateVersion ${version} is newer than supported version ${CURRENT_CANONICAL_STATE_VERSION}`,
      version,
    );
  }
  while (version < CURRENT_CANONICAL_STATE_VERSION) {
    const migration = CANONICAL_STATE_MIGRATIONS.find((entry) => entry.from === version);
    if (!migration) {
      throw new CanonicalStateMigrationError(
        "STATE_MIGRATION_MISSING",
        `no canonical state migration starts at version ${version}`,
        version,
      );
    }
    state = migration.migrate(state, context);
    const migratedVersion = readStateVersion(state);
    if (migratedVersion !== migration.to) {
      throw new CanonicalStateMigrationError(
        "STATE_MIGRATION_INVALID_RESULT",
        `migration ${migration.from} -> ${migration.to} produced version ${migratedVersion}`,
        migratedVersion,
      );
    }
    version = migratedVersion;
  }
  if (context.legacySeed !== undefined && "rngState" in state) {
    migrateCanonicalRngState(state.rngState, context.legacySeed);
  }
  return state as CanonicalGameState;
}
