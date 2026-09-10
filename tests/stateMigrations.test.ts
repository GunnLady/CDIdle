import { describe, expect, it } from "vitest";
import {
  CURRENT_CANONICAL_STATE_VERSION,
  validateCanonicalGameState,
} from "../shared/contracts/authoritative";
import {
  CANONICAL_STATE_MIGRATIONS,
  CanonicalStateMigrationError,
  migrateCanonicalState,
} from "../supabase/functions/game-api/state-migrations";
import { initialTownState, migrateTownState } from "../supabase/functions/game-api/town-authority";
import { applyForgeCommand } from "../supabase/functions/game-api/forge-authority";
import {
  asLegacyUnversionedState,
  currentV4GoldenAfter,
  legacyV0GoldenBefore,
} from "./fixtures/stateMigrations";
import { makeHero } from "./fixtures/game";
import { calculateXpNeeded } from "../shared/domain/hero-xp";
import {
  LEGACY_ITEM_EVOLUTION_TARGETS,
  LEGACY_ITEM_LIBRARY,
  PROGRESSION_ITEM_BASES,
} from "../shared/domain/items/items";
import {
  LEGACY_HERO_PROGRESSION_MODEL,
  PUBLISHED_TIER_DEPENDENT_HERO_PROGRESSION_MODEL,
} from "../shared/data/hero-progression-models";

const migrationContext = (seed = 42) => ({ defaults: initialTownState(seed), legacySeed: seed });

describe("canonical state migrations", () => {
  it("registers contiguous v0 -> v1 -> v2 -> v3 -> v4 -> v5 -> v6 migrations", () => {
    expect(CURRENT_CANONICAL_STATE_VERSION).toBe(6);
    expect(CANONICAL_STATE_MIGRATIONS.map(({ from, to }) => ({ from, to }))).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
    ]);
  });

  it("matches the anonymized golden pair for an unversioned alpha snapshot", () => {
    expect(migrateCanonicalState(legacyV0GoldenBefore, migrationContext()))
      .toEqual(currentV4GoldenAfter);
  });

  it("migrates v3 plans and pending previews to v4 without touching inventory", () => {
    const inventory = [{ instanceId: "kept", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1" as const, rarity: "common" as const }];
    const v3 = {
      ...initialTownState(42),
      stateVersion: 3,
      buildings: { ...initialTownState(42).buildings, forge: 1 },
      storedItems: inventory,
      itemBlueprints: [
        { itemId: "starter_sword", unlocked: false },
        { itemId: "progression_sword", unlocked: true },
        { itemId: "steel_sword", unlocked: true },
      ],
      pendingForge: {
        previewId: "legacy-preview",
        recipeId: "steel_sword",
        itemId: "steel_sword",
        itemType: "weapon",
        itemLevel: 20,
        powerModelId: "legacy-fixed-v1",
        upgradeProc: "none",
      },
    } as unknown as Record<string, unknown>;
    const migrated = migrateCanonicalState(v3, migrationContext());
    expect(migrated.stateVersion).toBe(6);
    expect(migrated.storedItems).toEqual(inventory);
    expect(migrated.itemBlueprints).toEqual([
      { itemId: "progression_sword", unlocked: true },
    ]);
    expect(migrated.pendingForge).toMatchObject({
      recipeId: "steel_sword",
      offeredRarity: "uncommon",
    });
    expect(migrated.pendingForge).not.toHaveProperty("upgradeProc");
    const finalized = applyForgeCommand(migrated, {
      type: "forge.finalize",
      previewId: "legacy-preview",
      acceptUpgrade: false,
    });
    expect(finalized.state.storedItems.at(-1)).toMatchObject({
      itemId: "steel_sword",
      itemLevel: 20,
      powerModelId: "legacy-fixed-v1",
      rarity: "uncommon",
    });
  });

  it("integrates every legacy plan into its evolving family", () => {
    const v3 = {
      ...initialTownState(42),
      stateVersion: 3,
      itemBlueprints: LEGACY_ITEM_LIBRARY.map((item) => ({ itemId: item.id, unlocked: true })),
    } as unknown as Record<string, unknown>;

    const migrated = migrateCanonicalState(v3, migrationContext());
    expect(migrated.itemBlueprints).toHaveLength(PROGRESSION_ITEM_BASES.length);
    expect(new Set(migrated.itemBlueprints.map((entry) => entry.itemId))).toEqual(
      new Set(Object.values(LEGACY_ITEM_EVOLUTION_TARGETS)),
    );
    expect(migrated.itemBlueprints.every((entry) => entry.unlocked)).toBe(true);
  });

  it('migrates every persisted item bucket from v2 without changing legacy power', () => {
    const equipment = (instanceId: string) => ({
      mainHand: { instanceId, itemId: 'starter_sword', itemLevel: 1, powerModelId: 'legacy-fixed-v1', rarity: 'common' },
    });
    const legacyHero = makeHero({ equipment: equipment('equipped-v2') as never });
    const v2 = {
      ...initialTownState(42),
      stateVersion: 2,
      storedItems: [{ instanceId: 'stored-v2', itemId: 'quick_dagger', itemLevel: 1, powerModelId: 'legacy-fixed-v1', rarity: 'common' }],
      heroes: [{ ...legacyHero, equipment: equipment('equipped-v2') }],
      onboardingCandidates: [{ ...legacyHero, id: 'candidate-v2', equipment: equipment('candidate-equipped-v2') }],
      pendingRecruit: { ...legacyHero, id: 'recruit-v2', equipment: equipment('recruit-equipped-v2') },
      pendingForge: {
        previewId: 'preview-v2', recipeId: 'starter_sword', itemId: 'starter_sword',
        itemType: 'weapon', upgradeProc: 'none',
      },
      encounterHistory: [{
        encounterId: 'loot-v2', kind: 'treasure', floor: 1, room: 1,
        outcome: 'victory', roundCount: 0, enemy: null, transcript: [],
        rewards: { gold: 0, loot: [{ type: 'item', instanceId: 'loot-instance-v2', itemId: 'wooden_shield', itemLevel: 1, powerModelId: 'legacy-fixed-v1', rarity: 'common', count: 1 }] },
      }],
    } as unknown as Record<string, unknown>;

    const migrated = migrateCanonicalState(v2, migrationContext());
    expect(migrated.stateVersion).toBe(6);
    expect(migrated.storedItems[0]).toMatchObject({ itemLevel: 1, powerModelId: 'legacy-fixed-v1' });
    for (const hero of [migrated.heroes[0], migrated.onboardingCandidates?.[0], migrated.pendingRecruit]) {
      expect(hero?.equipment?.mainHand).toMatchObject({ itemLevel: 1, powerModelId: 'legacy-fixed-v1' });
    }
    expect(migrated.pendingForge).toMatchObject({ itemLevel: 1, powerModelId: 'legacy-fixed-v1', offeredRarity: 'common' });
    expect(migrated.encounterHistory[0].rewards.loot[0]).toMatchObject({ itemLevel: 1, powerModelId: 'legacy-fixed-v1' });
    expect(validateCanonicalGameState(migrated)).toEqual([]);
  });

  it("is pure, deterministic and idempotent", () => {
    const before = asLegacyUnversionedState({
      ...initialTownState(42),
      storedItems: [{ instanceId: "fixture-item", itemId: "starter_sword", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" as const }],
      encounterHistory: [{
        encounterId: "fixture-history",
        kind: "treasure" as const,
        floor: 2,
        room: 1,
        outcome: "victory" as const,
        roundCount: 0,
        enemy: null,
        transcript: [],
        rewards: { gold: 5, loot: [] },
      }],
      rngState: { algorithm: "xorshift32" as const, version: 1 as const, seed: 42, state: 2_838_366_329, draws: 3 },
    });
    const untouched = structuredClone(before);

    const first = migrateCanonicalState(before, migrationContext());
    const second = migrateCanonicalState(before, migrationContext());
    const replayed = migrateCanonicalState(first as unknown as Record<string, unknown>, migrationContext());

    expect(before).toEqual(untouched);
    expect(second).toEqual(first);
    expect(replayed).toEqual(first);
    expect(first.rngState).toEqual(before.rngState);
    expect(first.storedItems[0].instanceId).toBe("fixture-item");
    expect(first.encounterHistory[0]).toMatchObject(before.encounterHistory[0]);
    expect(first.encounterHistory[0]).toMatchObject({ dungeonId: "undercity", enemies: [] });
    expect(validateCanonicalGameState(first)).toEqual([]);
  });

  it("preserves the optional initial actor extension on a current canonical state", () => {
    const initialActors = {
      v: 1 as const,
      h: [["historical-hero", "Novice_Female_7", 20, 20, 10, 10, 0] as [string, string, number, number, number, number, 0]],
      b: "rat-pack",
      e: [["a", 16, 16] as [string, number, number]],
    };
    const current = {
      ...initialTownState(42),
      encounterHistory: [{
        encounterId: "current-actors", dungeonId: "undercity", kind: "fight" as const,
        floor: 1, room: 1, outcome: "victory" as const, roundCount: 1,
        enemy: { id: "enemy-instance", name: "Rat des canaux", hp: 0, maxHp: 16 },
        enemies: [{ id: "enemy-instance", name: "Rat des canaux", hp: 0, maxHp: 16 }],
        initialActors, transcript: [], rewards: { gold: 3, loot: [] },
      }],
    };

    const migrated = migrateCanonicalState(current as unknown as Record<string, unknown>, migrationContext());

    expect(migrated.encounterHistory[0].initialActors).toEqual(initialActors);
    expect(validateCanonicalGameState(migrated)).toEqual([]);
  });

  it("recovers legacy ids and item stacks from a current snapshot", () => {
    const current = initialTownState(42) as unknown as Record<string, unknown>;
    current.storedItems = [
      { id: "wooden_shield", rarity: "common", count: 2 },
    ];

    const migrated = migrateCanonicalState(current, migrationContext());
    const recovered = migrated.storedItems;

    expect(recovered).toHaveLength(2);
    expect(recovered.map((item) => item.itemId)).toEqual(["wooden_shield", "wooden_shield"]);
    expect(new Set(recovered.map((item) => item.instanceId)).size).toBe(2);
    expect(migrateCanonicalState(migrated as unknown as Record<string, unknown>, migrationContext())).toEqual(migrated);
    expect(validateCanonicalGameState(migrated)).toEqual([]);
  });

  it("migrates every persisted hero bucket while preserving XP completion", () => {
    const legacyThreshold = calculateXpNeeded(21, "Guerrier", LEGACY_HERO_PROGRESSION_MODEL.xpCurve);
    const legacyHero = makeHero({
      level: 20,
      classType: "Guerrier",
      xp: Math.floor(legacyThreshold / 2),
      xpNeeded: legacyThreshold,
    });
    const v1 = {
      ...initialTownState(42),
      stateVersion: 1,
      heroes: [legacyHero],
      onboardingCandidates: [{ ...legacyHero, id: "candidate" }],
      pendingRecruit: { ...legacyHero, id: "pending" },
    } as unknown as Record<string, unknown>;
    delete v1.heroProgressionModelId;
    const rngBefore = structuredClone(v1.rngState);

    const migrated = migrateTownState(v1);
    const expectedThreshold = calculateXpNeeded(21, "Guerrier");
    const expectedXp = Math.floor((legacyHero.xp / legacyThreshold) * expectedThreshold);

    expect(migrated.heroProgressionModelId).toBe("harmonized-level-bands-v2");
    expect(migrated.heroes[0]).toMatchObject({ xp: expectedXp, xpNeeded: expectedThreshold });
    expect(migrated.onboardingCandidates[0]).toMatchObject({ xp: expectedXp, xpNeeded: expectedThreshold });
    expect(migrated.pendingRecruit).toMatchObject({ xp: expectedXp, xpNeeded: expectedThreshold });
    expect(migrated.rngState).toEqual(rngBefore);
  });

  it("does not reconvert XP from an already harmonized v2 snapshot", () => {
    const hero = makeHero({
      level: 20,
      classType: "Guerrier",
      xp: 123,
      xpNeeded: calculateXpNeeded(21, "Guerrier"),
    });
    const current = { ...initialTownState(42), heroes: [hero] };

    const migrated = migrateTownState(current);

    expect(migrated.heroProgressionModelId).toBe("harmonized-level-bands-v2");
    expect(migrated.heroes[0]).toMatchObject({ xp: hero.xp, xpNeeded: hero.xpNeeded });
  });

  it("migrates the published tier-dependent model without losing current-level progress", () => {
    const publishedThreshold = calculateXpNeeded(
      21,
      "Novice",
      PUBLISHED_TIER_DEPENDENT_HERO_PROGRESSION_MODEL.xpCurve,
    );
    const hero = makeHero({
      level: 20,
      classType: "Novice",
      xp: Math.floor(publishedThreshold / 2),
      xpNeeded: publishedThreshold,
    });
    const published = {
      ...initialTownState(42),
      heroProgressionModelId: PUBLISHED_TIER_DEPENDENT_HERO_PROGRESSION_MODEL.id,
      heroes: [hero],
    };

    const migrated = migrateTownState(published);
    const expectedThreshold = calculateXpNeeded(21, "Novice");
    const expectedXp = Math.floor((hero.xp / publishedThreshold) * expectedThreshold);

    expect(migrated.heroProgressionModelId).toBe("harmonized-level-bands-v2");
    expect(migrated.heroes[0]).toMatchObject({ xp: expectedXp, xpNeeded: expectedThreshold });
    expect(migrated.rngState).toEqual(published.rngState);
  });

  it("rejects excess legacy XP before model conversion instead of consuming hidden RNG", () => {
    const legacyThreshold = calculateXpNeeded(21, "Guerrier", LEGACY_HERO_PROGRESSION_MODEL.xpCurve);
    const v1 = {
      ...initialTownState(42),
      stateVersion: 1,
      heroes: [makeHero({
        level: 20,
        classType: "Guerrier",
        xp: legacyThreshold,
        xpNeeded: legacyThreshold,
      })],
    } as unknown as Record<string, unknown>;
    delete v1.heroProgressionModelId;

    expect(() => migrateTownState(v1)).toThrow("xp must be lower than xpNeeded");
  });

  it("does not mutate migration defaults when restoring a displaced off-hand", () => {
    const defaults = initialTownState(42);
    const untouchedDefaults = structuredClone(defaults);
    const legacy = asLegacyUnversionedState({
      ...initialTownState(42),
      heroes: [makeHero({
        id: "fixture-aede",
        equipment: {
          mainHand: { instanceId: "fixture-lute", itemId: "basic_lute", itemLevel: 10, powerModelId: "legacy-fixed-v1", rarity: "common" },
          offHand: { instanceId: "fixture-shield", itemId: "wooden_shield", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common" },
        },
      })],
    });
    delete legacy.storedItems;

    const migrated = migrateCanonicalState(legacy, { defaults, legacySeed: 42 });

    expect(defaults).toEqual(untouchedDefaults);
    expect(migrated.forgeMaterials).not.toBe(defaults.forgeMaterials);
    expect(migrated.districts).not.toBe(defaults.districts);
    expect(migrated.encounterHistory).not.toBe(defaults.encounterHistory);
    expect(migrated.storedItems).toContainEqual(expect.objectContaining({
      instanceId: "fixture-shield",
    }));
  });

  it("accepts explicit v0 and rejects invalid or future versions diagnostically", () => {
    expect(migrateCanonicalState({ ...initialTownState(42), stateVersion: 0 }, migrationContext()).stateVersion)
      .toBe(CURRENT_CANONICAL_STATE_VERSION);

    for (const stateVersion of [-1, 1.5, "1"]) {
      expect(() => migrateCanonicalState(
        { ...initialTownState(42), stateVersion },
        migrationContext(),
      )).toThrowError(expect.objectContaining({ code: "STATE_VERSION_INVALID" }));
    }
    expect(() => migrateCanonicalState(
      { ...initialTownState(42), stateVersion: CURRENT_CANONICAL_STATE_VERSION + 1 },
      migrationContext(),
    )).toThrowError(expect.objectContaining({
      code: "STATE_VERSION_FUTURE",
      version: CURRENT_CANONICAL_STATE_VERSION + 1,
    } satisfies Partial<CanonicalStateMigrationError>));
  });

  it("does not silently repair an incomplete current snapshot", () => {
    const current = initialTownState(42) as unknown as Record<string, unknown>;
    delete current.rngState;

    expect(() => migrateTownState(current, 42)).toThrowError(expect.objectContaining({
      code: "INVALID_GAME_STATE",
      reason: expect.stringContaining("rngState is required"),
    }));
  });

  it("rejects current v4 item instances without progression metadata", () => {
    for (const missingField of ["itemLevel", "powerModelId"] as const) {
      const current = initialTownState(42) as unknown as Record<string, unknown>;
      const incompleteItem: Record<string, unknown> = {
        instanceId: `incomplete-${missingField}`,
        itemId: "starter_sword",
        itemLevel: 1,
        powerModelId: "legacy-fixed-v1",
        rarity: "common",
      };
      delete incompleteItem[missingField];
      current.storedItems = [incompleteItem];

      expect(() => migrateTownState(current, 42)).toThrowError(expect.objectContaining({
        code: "INVALID_GAME_STATE",
        reason: expect.stringContaining(`storedItems[0].${missingField} is invalid`),
      }));
    }
  });

  it("rejects malformed legacy collections instead of replacing them", () => {
    for (const [field, value] of [
      ["storedItems", null],
      ["heroes", null],
      ["itemBlueprints", "broken"],
      ["pendingClassTransitions", "broken"],
      ["storedItems", [null]],
      ["storedItems", [42]],
      ["storedItems", [{}]],
      ["heroes", [null]],
      ["heroes", [42]],
      ["heroes", [{}]],
      ["itemBlueprints", [null]],
      ["itemBlueprints", [42]],
      ["itemBlueprints", [{}]],
      ["pendingClassTransitions", [null]],
      ["pendingClassTransitions", [42]],
      ["pendingClassTransitions", [{}]],
    ] as const) {
      const legacy = asLegacyUnversionedState(initialTownState(42));
      legacy[field] = value;
      expect(() => migrateTownState(legacy, 42)).toThrowError(expect.objectContaining({
        code: "INVALID_GAME_STATE",
      }));
    }
  });
});
