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
import {
  asLegacyUnversionedState,
  currentV2GoldenAfter,
  legacyV0GoldenBefore,
} from "./fixtures/stateMigrations";
import { makeHero } from "./fixtures/game";
import { calculateXpNeeded } from "../shared/domain/hero-xp";
import { LEGACY_HERO_PROGRESSION_MODEL } from "../shared/data/hero-progression-models";

const migrationContext = (seed = 42) => ({ defaults: initialTownState(seed), legacySeed: seed });

describe("canonical state migrations", () => {
  it("registers contiguous v0 -> v1 -> v2 migrations", () => {
    expect(CURRENT_CANONICAL_STATE_VERSION).toBe(2);
    expect(CANONICAL_STATE_MIGRATIONS.map(({ from, to }) => ({ from, to }))).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ]);
  });

  it("matches the anonymized golden pair for an unversioned alpha snapshot", () => {
    expect(migrateCanonicalState(legacyV0GoldenBefore, migrationContext()))
      .toEqual(currentV2GoldenAfter);
  });

  it("is pure, deterministic and idempotent", () => {
    const before = asLegacyUnversionedState({
      ...initialTownState(42),
      storedItems: [{ instanceId: "fixture-item", itemId: "starter_sword", rarity: "common" as const }],
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
    expect(first.encounterHistory).toEqual(before.encounterHistory);
    expect(validateCanonicalGameState(first)).toEqual([]);
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

    expect(migrated.heroProgressionModelId).toBe("harmonized-t0-t1-v1");
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

    expect(migrated.heroProgressionModelId).toBe("harmonized-t0-t1-v1");
    expect(migrated.heroes[0]).toMatchObject({ xp: hero.xp, xpNeeded: hero.xpNeeded });
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
          mainHand: { instanceId: "fixture-lute", itemId: "basic_lute", rarity: "common" },
          offHand: { instanceId: "fixture-shield", itemId: "wooden_shield", rarity: "common" },
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
