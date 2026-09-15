import {
  CURRENT_CANONICAL_STATE_VERSION,
  validateCanonicalGameState,
  type CanonicalGameState,
  type CanonicalPendingClassTransition,
} from "../../../shared/contracts/authoritative.ts";
import { migrateAuthoritativeHeroProgression } from "../../../shared/domain/authoritative-hero-validation.ts";
import {
  LEGACY_HERO_PROGRESSION_MODEL,
} from "../../../shared/data/hero-progression-models.ts";
import { getDungeonRoomCount } from "../../../shared/domain/dungeon-progression.ts";
import { getItemById } from "../../../shared/domain/items/items.ts";
import { migrateCanonicalRngState } from "./authoritative-rng.ts";
import {
  DEFAULT_NOVICE_ITEM_BLUEPRINTS,
  LEGACY_NOVICE_BLUEPRINT_REPLACEMENTS,
} from "./forge-blueprints.ts";
import {
  calculateAuthoritativeHeroStats,
  type AuthoritativeEquipment,
  type AuthoritativeNoviceStats,
} from "./novice-stats-authority.ts";
import { reconcileExistingVocations } from "./vocation-reconciliation.ts";
import {
  createUndercityProgress,
  ensureUndercityHeroes,
  getUndercityCommonCheckpoint,
} from "../../../shared/domain/undercity-progression.ts";
import { UNDERCITY_DUNGEON_ID, UNDERCITY_MAX_FLOOR } from "../../../shared/domain/undercity.ts";
import { getStableNovicePortraitVariant } from "../../../shared/domain/hero-portrait-identity.ts";
import {
  recoverItemInstance,
  type RecoverableEquipmentSlot,
} from "../../../shared/domain/items/item-instance-recovery.ts";

export const LEGACY_UNVERSIONED_STATE_VERSION = 0 as const;

const RECOVERY_EQUIPMENT_SLOTS: readonly RecoverableEquipmentSlot[] = [
  "mainHand", "offHand", "armor", "accessory",
];

function recoverHeroItemInstances(input: unknown, scope: string): unknown {
  if (!isRecord(input) || !isRecord(input.equipment)) return input;
  const heroId = typeof input.id === "string" && input.id.trim() ? input.id : scope;
  const equipment = { ...input.equipment };
  for (const slot of RECOVERY_EQUIPMENT_SLOTS) {
    const item = equipment[slot];
    if (item === null || item === undefined) continue;
    if (isRecord(item) && (
      typeof item.id === "string"
      || typeof item.itemId !== "string"
      || typeof item.instanceId !== "string"
    )) {
      equipment[slot] = recoverItemInstance(item, `item:recovery:${heroId}:${slot}`, slot);
    }
  }
  return { ...input, equipment };
}

function recoverPersistedItemInstances(input: Record<string, unknown>): Record<string, unknown> {
  const state = { ...input };
  if (Array.isArray(state.storedItems)) {
    state.storedItems = state.storedItems.flatMap((item, index) => {
      if (!isRecord(item)) return [item];
      const hasRecoverableIdentity = typeof item.itemId === "string" || typeof item.id === "string";
      if (!hasRecoverableIdentity) return [item];
      const needsRecovery = typeof item.id === "string"
        || typeof item.itemId !== "string"
        || typeof item.instanceId !== "string"
        || item.count !== undefined;
      if (!needsRecovery) return [item];
      const count = Number.isInteger(item.count) && Number(item.count) > 0 ? Number(item.count) : 1;
      return Array.from({ length: count }, (_, copyIndex) => recoverItemInstance(
        item,
        copyIndex === 0 && typeof item.instanceId === "string"
          ? item.instanceId
          : `item:recovery:storage:${index}:${copyIndex}`,
      ));
    });
  }
  for (const bucket of ["heroes", "onboardingCandidates"] as const) {
    if (Array.isArray(state[bucket])) {
      state[bucket] = state[bucket].map((hero, index) => recoverHeroItemInstances(hero, `${bucket}:${index}`));
    }
  }
  if (state.pendingRecruit) state.pendingRecruit = recoverHeroItemInstances(state.pendingRecruit, "pendingRecruit");
  return state;
}

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
  const progressed = migrateAuthoritativeHeroProgression(input, LEGACY_HERO_PROGRESSION_MODEL.xpCurve);
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
    stateVersion: 1,
    heroProgressionModelId: LEGACY_HERO_PROGRESSION_MODEL.id,
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

function migrateV1ToV2(current: Record<string, unknown>): Record<string, unknown> {
  const migrated = {
    ...current,
    stateVersion: 2,
    heroProgressionModelId: LEGACY_HERO_PROGRESSION_MODEL.id,
  };
  return validateCanonicalGameState(migrated).length === 0
    ? reconcileExistingVocations(migrated as CanonicalGameState)
    : migrated;
}

function migrateItemInstanceToV3(input: unknown): unknown {
  if (!isRecord(input) || typeof input.itemId !== 'string') return input;
  const definition = getItemById(input.itemId);
  if (!definition) {
    return {
      ...input,
      itemLevel: Number.isInteger(input.itemLevel) ? input.itemLevel : 1,
      powerModelId: typeof input.powerModelId === 'string' ? input.powerModelId : 'legacy-fixed-v1',
    };
  }
  return {
    ...input,
    itemLevel: Number.isInteger(input.itemLevel) ? input.itemLevel : definition.requiredLevel,
    powerModelId: typeof input.powerModelId === 'string'
      ? input.powerModelId
      : definition.powerModelId,
  };
}

function migrateHeroItemsToV3(input: unknown): unknown {
  if (!isRecord(input) || !isRecord(input.equipment)) return input;
  return {
    ...input,
    equipment: Object.fromEntries(Object.entries(input.equipment).map(([slot, item]) => [
      slot,
      item === null ? null : migrateItemInstanceToV3(item),
    ])),
  };
}

function migrateEncounterHistoryItemsToV3(input: unknown): unknown {
  if (!isRecord(input) || !isRecord(input.rewards) || !Array.isArray(input.rewards.loot)) return input;
  return {
    ...input,
    rewards: {
      ...input.rewards,
      loot: input.rewards.loot.map((loot) => (
        isRecord(loot) && loot.type === 'item' ? migrateItemInstanceToV3(loot) : loot
      )),
    },
  };
}

function migrateV2ToV3(current: Record<string, unknown>): Record<string, unknown> {
  const pendingForge = isRecord(current.pendingForge) && typeof current.pendingForge.itemId === 'string'
    ? (() => {
        const definition = getItemById(current.pendingForge.itemId as string);
        return {
          ...current.pendingForge,
          itemLevel: Number.isInteger(current.pendingForge.itemLevel)
            ? current.pendingForge.itemLevel
            : definition?.requiredLevel ?? 1,
          powerModelId: typeof current.pendingForge.powerModelId === 'string'
            ? current.pendingForge.powerModelId
            : definition?.powerModelId ?? 'legacy-fixed-v1',
        };
      })()
    : current.pendingForge;
  const migrated = {
    ...current,
    stateVersion: 3,
    storedItems: Array.isArray(current.storedItems)
      ? current.storedItems.map(migrateItemInstanceToV3)
      : current.storedItems,
    heroes: Array.isArray(current.heroes) ? current.heroes.map(migrateHeroItemsToV3) : current.heroes,
    onboardingCandidates: Array.isArray(current.onboardingCandidates)
      ? current.onboardingCandidates.map(migrateHeroItemsToV3)
      : current.onboardingCandidates,
    pendingRecruit: current.pendingRecruit ? migrateHeroItemsToV3(current.pendingRecruit) : current.pendingRecruit,
    pendingForge,
    encounterHistory: Array.isArray(current.encounterHistory)
      ? current.encounterHistory.map(migrateEncounterHistoryItemsToV3)
      : current.encounterHistory,
  };
  return validateCanonicalGameState(migrated).length === 0
    ? reconcileExistingVocations(migrated as CanonicalGameState)
    : migrated;
}

function migrateBlueprintsToV4(input: unknown): unknown {
  if (input !== undefined && !Array.isArray(input)) return input;
  if (Array.isArray(input) && input.some((entry) => (
    !isRecord(entry)
    || typeof entry.itemId !== "string"
    || typeof entry.unlocked !== "boolean"
  ))) return input;
  const source = Array.isArray(input) && input.length > 0 ? input : DEFAULT_NOVICE_ITEM_BLUEPRINTS;
  const merged = new Map<string, boolean>();
  for (const entry of source) {
    if (!isRecord(entry) || typeof entry.itemId !== "string") continue;
    const itemId = LEGACY_NOVICE_BLUEPRINT_REPLACEMENTS[entry.itemId] ?? entry.itemId;
    merged.set(itemId, (merged.get(itemId) ?? false) || entry.unlocked === true);
  }
  return [...merged].map(([itemId, unlocked]) => ({ itemId, unlocked }));
}

function migrateV3ToV4(current: Record<string, unknown>): Record<string, unknown> {
  const pendingForge = isRecord(current.pendingForge)
    ? (() => {
        const recipeId = typeof current.pendingForge.recipeId === "string"
          ? current.pendingForge.recipeId
          : typeof current.pendingForge.itemId === "string"
            ? current.pendingForge.itemId
            : "";
        const recipe = getItemById(recipeId);
        const legacyProc = current.pendingForge.upgradeProc;
        const offeredRarity = legacyProc === "uncommon" || legacyProc === "rare"
          ? legacyProc
          : recipe?.minimumRarity ?? "common";
        const { upgradeProc: _legacyUpgradeProc, ...rest } = current.pendingForge;
        return { ...rest, offeredRarity };
      })()
    : current.pendingForge;
  const migrated = {
    ...current,
    stateVersion: 4,
    itemBlueprints: migrateBlueprintsToV4(current.itemBlueprints),
    pendingForge,
  };
  return validateCanonicalGameState(migrated).length === 0
    ? reconcileExistingVocations(migrated as CanonicalGameState)
    : migrated;
}

function migrateV4ToV5(current: Record<string, unknown>): Record<string, unknown> {
  const highest = Number.isInteger(current.highestFloorReached) ? Number(current.highestFloorReached) : 1;
  const completedFloor = Math.max(0, Math.min(UNDERCITY_MAX_FLOOR, highest - 1));
  const heroIds = Array.isArray(current.heroes)
    ? current.heroes.flatMap((hero) => isRecord(hero) && typeof hero.id === "string" ? [hero.id] : [])
    : [];
  const dungeonProgress = createUndercityProgress(heroIds, completedFloor);
  const floor = Math.max(1, Math.min(UNDERCITY_MAX_FLOOR, Number(current.activeDungeonFloor ?? 1)));
  const room = Math.max(1, Number(current.activeDungeonRoom ?? 1));
  dungeonProgress.expedition = { ...dungeonProgress.expedition, floor, room };
  const activeIds = Array.isArray(current.heroes)
    ? current.heroes.flatMap((hero) => isRecord(hero) && hero.isActive === true && Number(hero.currentHp ?? 0) > 0 && typeof hero.id === "string" ? [hero.id] : [])
    : [];
  const currentEncounter = isRecord(current.currentEncounter)
    ? {
        ...current.currentEncounter,
        dungeonId: UNDERCITY_DUNGEON_ID,
        participantHeroIds: activeIds,
      }
    : current.currentEncounter;
  const encounterHistory = Array.isArray(current.encounterHistory)
    ? current.encounterHistory.map((entry) => isRecord(entry)
      ? {
          ...entry,
          dungeonId: UNDERCITY_DUNGEON_ID,
          ...(Array.isArray(entry.enemies)
            ? {}
            : { enemies: isRecord(entry.enemy) ? [{ ...entry.enemy }] : [] }),
        }
      : entry)
    : current.encounterHistory;
  const migrated = {
    ...current,
    stateVersion: 5,
    dungeonProgress,
    highestFloorReached: Math.max(1, Math.min(UNDERCITY_MAX_FLOOR, highest)),
    currentEncounter,
    encounterHistory,
  };
  return validateCanonicalGameState(migrated).length === 0
    ? reconcileExistingVocations(migrated as CanonicalGameState)
    : migrated;
}

function migrateV5ToV6(current: Record<string, unknown>): Record<string, unknown> {
  const heroes = Array.isArray(current.heroes) ? current.heroes : [];
  const activeLivingHeroIds = heroes.flatMap((hero) => (
    isRecord(hero)
      && typeof hero.id === "string"
      && hero.isActive === true
      && Number(hero.currentHp ?? 0) > 0
      ? [hero.id]
      : []
  ));
  const existingProgress = current.dungeonProgress as CanonicalGameState["dungeonProgress"];
  const progress = ensureUndercityHeroes(existingProgress, activeLivingHeroIds);
  const checkpoint = activeLivingHeroIds.length > 0
    ? getUndercityCommonCheckpoint(progress, activeLivingHeroIds)
    : 0;
  const floor = Math.min(UNDERCITY_MAX_FLOOR, checkpoint + 1);
  const migrated = {
    ...current,
    stateVersion: 6,
    activeDungeonFloor: floor,
    activeDungeonRoom: 1,
    currentEncounter: null,
    autoExplore: false,
    dungeonProgress: {
      ...progress,
      expedition: {
        ...progress.expedition,
        mode: "progression" as const,
        zoneId: null,
        floor,
        room: 1,
        halted: false,
        haltReason: null,
        phase: "preparing" as const,
        segmentHeroIds: [],
        knockedOutHeroIds: [],
        checkpointFloor: null,
        autoExploreBeforeCheckpoint: false,
      },
    },
  };
  return validateCanonicalGameState(migrated).length === 0
    ? reconcileExistingVocations(migrated as CanonicalGameState)
    : migrated;
}

function migrateNovicePortrait(input: unknown): unknown {
  if (!isRecord(input) || input.classType !== "Novice" || typeof input.id !== "string") return input;
  return {
    ...input,
    spriteIndex: getStableNovicePortraitVariant(input.id),
  };
}

function migrateV6ToV7(current: Record<string, unknown>): Record<string, unknown> {
  const migrated = {
    ...current,
    stateVersion: 7,
    heroes: Array.isArray(current.heroes)
      ? current.heroes.map(migrateNovicePortrait)
      : current.heroes,
    onboardingCandidates: Array.isArray(current.onboardingCandidates)
      ? current.onboardingCandidates.map(migrateNovicePortrait)
      : current.onboardingCandidates,
    pendingRecruit: current.pendingRecruit
      ? migrateNovicePortrait(current.pendingRecruit)
      : current.pendingRecruit,
  };
  return validateCanonicalGameState(migrated).length === 0
    ? reconcileExistingVocations(migrated as CanonicalGameState)
    : migrated;
}

export const CANONICAL_STATE_MIGRATIONS: readonly CanonicalStateMigration[] = [
  { from: LEGACY_UNVERSIONED_STATE_VERSION, to: 1, migrate: migrateV0ToV1 },
  { from: 1, to: 2, migrate: migrateV1ToV2 },
  { from: 2, to: 3, migrate: migrateV2ToV3 },
  { from: 3, to: 4, migrate: migrateV3ToV4 },
  { from: 4, to: 5, migrate: migrateV4ToV5 },
  { from: 5, to: 6, migrate: migrateV5ToV6 },
  { from: 6, to: 7, migrate: migrateV6ToV7 },
];

export function migrateCanonicalState(
  input: Record<string, unknown>,
  context: CanonicalStateMigrationContext,
): CanonicalGameState {
  let state = recoverPersistedItemInstances(structuredClone(input));
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
