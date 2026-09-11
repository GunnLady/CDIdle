import { describe, expect, it } from "vitest";
import {
  DECIMAL_GB,
  estimateEgressBudget,
  jsonUtf8Bytes,
  maximumDailyCallsWithinBudget,
} from "../src/lib/egressBudget";
import {
  validateCanonicalGameState,
  type CanonicalDungeonEncounterRecord,
  type CanonicalGameState,
} from "../shared/contracts/authoritative";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { makeHero, makeStoredItem } from "./fixtures/game";

const serverTime = "2026-08-20T12:00:00.000Z";
const commitMetadata = {
  schema_version: 1,
  revision: 42,
  last_processed_at: serverTime,
};

const productionHeroId = (index: number) => (
  `hero-00000000-0000-4000-8000-${String(index).padStart(12, "0")}`
);

function representativeState(options: {
  heroCount?: number;
  storedItemCount?: number;
  encounterCount?: number;
  includeInitialActors?: boolean;
  includeTraceDetails?: boolean;
} = {}): CanonicalGameState {
  const heroCount = options.heroCount ?? 4;
  const storedItemCount = options.storedItemCount ?? 50;
  const encounterCount = options.encounterCount ?? 8;
  const includeInitialActors = options.includeInitialActors ?? true;
  const includeTraceDetails = options.includeTraceDetails ?? true;
  const transcript = Array.from({ length: 12 }, (_, sequence) => ({
    sequence,
    type: sequence % 2 === 0 ? "hero.hit" : "enemy.hit",
    message: "Evenement de combat representatif " + sequence + " avec donnees structurees.",
    round: Math.floor(sequence / 2) + 1,
    heroId: "hero-1",
    heroName: "Ariane",
    monsterId: "monster-1",
    monsterName: "Rat enorme des egouts",
    damage: 12 + sequence,
    enemyHp: Math.max(0, 100 - sequence * 8),
    enemyMaxHp: 100,
    ...(includeTraceDetails && sequence === 0 ? {
      sourceMana: [1_000, 976, 1_000] as [number, number, number],
      targets: ["e", 0, 1, 2] as ["e", number, number, number],
    } : {}),
  }));
  const encounterHistory: CanonicalDungeonEncounterRecord[] = Array.from(
    { length: encounterCount },
    (_, index) => ({
      encounterId: "encounter-" + index,
      kind: "fight",
      floor: 10,
      room: index + 1,
      outcome: "victory",
      roundCount: 6,
      enemy: { id: "monster-1", name: "Rat enorme des egouts", hp: 0, maxHp: 100 },
      enemies: Array.from({ length: 3 }, (_, enemyIndex) => ({
        id: `monster-1:member:${enemyIndex}`,
        name: ["Rat des canaux", "Rat galeux", "Rat pestifere"][enemyIndex],
        hp: 0,
        maxHp: 34 - (enemyIndex === 2 ? 2 : 0),
        role: "ordinary" as const,
        intent: "Attaque",
        effects: [],
      })),
      ...(includeInitialActors ? {
        initialActors: {
          v: 1 as const,
          h: Array.from({ length: Math.min(heroCount, 4) }, (_, heroIndex) => ([
            productionHeroId(heroIndex),
            `Artificier_${heroIndex % 2 === 0 ? "Male" : "Female"}_19`,
            10_000,
            10_000,
            1_000,
            1_000,
            0,
          ] as [string, string, number, number, number, number, 0])),
          b: "outcast-standard-bearer",
          e: Array.from({ length: 3 }, (_, enemyIndex) => ([
            ["a", "b", "c"][enemyIndex],
            10_000,
            10_000,
          ] as [string, number, number])),
        },
      } : {}),
      transcript,
      rewards: { gold: 25, loot: [] },
    }),
  );
  return {
    ...initialTownState(42),
    cityName: "Aube",
    heroes: Array.from({ length: heroCount }, (_, index) => makeHero({
      id: "hero-" + index,
      name: "Hero " + index,
      equipment: {},
      isActive: index < 3,
    })),
    storedItems: Array.from({ length: storedItemCount }, (_, index) => makeStoredItem({
      instanceId: "stored-" + index,
      itemId: "starter_sword",
      rarity: "common" as const,
      modifiers: [{ stat: "physicalDamage" as const, type: "flat" as const, value: index % 7 }],
    })),
    encounterHistory,
  };
}

describe("Supabase egress budget", () => {
  it("measures canonical small, median and high snapshot profiles", () => {
    const profiles = {
      small: representativeState({ heroCount: 1, storedItemCount: 5, encounterCount: 0 }),
      median: representativeState(),
      high: representativeState({ storedItemCount: 100, encounterCount: 15 }),
    };
    for (const state of Object.values(profiles)) {
      expect(validateCanonicalGameState(state)).toEqual([]);
    }
    const sizes = Object.fromEntries(
      Object.entries(profiles).map(([name, state]) => [name, jsonUtf8Bytes(state)]),
    );
    const diagnostics = JSON.stringify(sizes);
    expect(sizes.small, diagnostics).toBeGreaterThan(2_000);
    expect(sizes.small, diagnostics).toBeLessThan(10_000);
    expect(sizes.median, diagnostics).toBeGreaterThan(30_000);
    expect(sizes.median, diagnostics).toBeLessThan(50_000);
    expect(sizes.high, diagnostics).toBeGreaterThan(60_000);
    expect(sizes.high, diagnostics).toBeLessThan(86_000);
    expect(sizes.small).toBeLessThan(sizes.median);
    expect(sizes.median).toBeLessThan(sizes.high);
  });

  it("bounds the initial actor extension across fifteen long encounter records", () => {
    const legacy = representativeState({ storedItemCount: 100, encounterCount: 15, includeInitialActors: false });
    const extended = representativeState({ storedItemCount: 100, encounterCount: 15, includeInitialActors: true });
    const legacyBytes = jsonUtf8Bytes(legacy);
    const extendedBytes = jsonUtf8Bytes(extended);
    const addedBytes = extendedBytes - legacyBytes;

    expect(validateCanonicalGameState(extended)).toEqual([]);
    expect(extended.encounterHistory).toHaveLength(15);
    expect(addedBytes).toBeGreaterThan(0);
    expect(addedBytes).toBeLessThanOrEqual(8_000);
    expect(addedBytes / 15).toBeLessThanOrEqual(500);
  });

  it("bounds compact resource and multi-target details across fifteen long traces", () => {
    const baseline = representativeState({
      storedItemCount: 100,
      encounterCount: 15,
      includeTraceDetails: false,
    });
    const enriched = representativeState({
      storedItemCount: 100,
      encounterCount: 15,
      includeTraceDetails: true,
    });
    const addedBytes = jsonUtf8Bytes(enriched) - jsonUtf8Bytes(baseline);
    const enrichedBytes = jsonUtf8Bytes(enriched);

    expect(validateCanonicalGameState(enriched)).toEqual([]);
    expect(addedBytes).toBeGreaterThan(0);
    expect(addedBytes).toBeLessThanOrEqual(1_000);
    expect(enrichedBytes).toBeLessThan(86_000);
  });

  it("proves compact commits remove the second PostgREST snapshot", () => {
    const state = representativeState({ storedItemCount: 100, encounterCount: 15 });
    const legacyCommitBytes = jsonUtf8Bytes([{ ...commitMetadata, state }]);
    const compactCommitBytes = jsonUtf8Bytes([commitMetadata]);
    expect(compactCommitBytes).toBeLessThan(200);
    expect(compactCommitBytes / legacyCommitBytes).toBeLessThan(0.01);
  });

  it("projects the representative optimized alpha workload below 4.5 GB", () => {
    const state = representativeState();
    const encounter = state.encounterHistory.at(-1);
    if (!encounter) throw new Error("representative command requires an encounter");
    const loadBytes = jsonUtf8Bytes([{ ...commitMetadata, state, server_time: serverTime }]);
    const compactCommitBytes = jsonUtf8Bytes([commitMetadata]);
    const commandEnvelopeBytes = jsonUtf8Bytes({
      ok: true,
      revision: 42,
      state,
      serverTime,
      lastProcessedAt: serverTime,
      events: [{ type: "dungeon.encounter_resolved", dungeonId: "undercity", encounterId: encounter.encounterId }],
      commandId: "00000000-0000-4000-8000-000000000001",
      replayed: false,
    });
    const bootstrapEnvelopeBytes = jsonUtf8Bytes({
      schemaVersion: 1,
      revision: 42,
      state,
      serverTime,
      lastProcessedAt: serverTime,
    });
    const postgrestCommandBytes = loadBytes + compactCommitBytes + 64;
    const estimate = estimateEgressBudget({
      cycleDays: 31,
      targetCycleBytes: 4.5 * DECIMAL_GB,
      safetyFactor: 1.1,
      routes: [
        {
          name: "scheduled-bootstrap",
          callsPerDay: 20,
          postgrestBytesPerCall: loadBytes + compactCommitBytes,
          functionsBytesPerCall: bootstrapEnvelopeBytes,
        },
        {
          name: "manual-command",
          callsPerDay: 100,
          postgrestBytesPerCall: postgrestCommandBytes,
          functionsBytesPerCall: commandEnvelopeBytes,
        },
        {
          name: "automatic-encounter",
          callsPerDay: 1_250,
          postgrestBytesPerCall: postgrestCommandBytes,
          functionsBytesPerCall: commandEnvelopeBytes,
        },
        {
          name: "auth",
          callsPerDay: 4,
          authBytesPerCall: 2_048,
        },
      ],
    });
    const diagnostics = JSON.stringify({
      stateBytes: jsonUtf8Bytes(state),
      loadBytes,
      compactCommitBytes,
      commandEnvelopeBytes,
      bootstrapEnvelopeBytes,
      dailyBytes: estimate.dailyBytes,
      projectedCycleBytes: estimate.projectedCycleBytes,
      projectedCycleGb: estimate.projectedCycleBytes / DECIMAL_GB,
    });
    expect(estimate.withinTarget, diagnostics).toBe(true);
    expect(estimate.projectedCycleBytes).toBeLessThanOrEqual(4.5 * DECIMAL_GB);

    const maximumCommands = maximumDailyCallsWithinBudget({
      cycleDays: 31,
      targetCycleBytes: 4.5 * DECIMAL_GB,
      safetyFactor: 1.1,
      fixedDailyBytes: 20 * (loadBytes + compactCommitBytes + bootstrapEnvelopeBytes) + 4 * 2_048,
      bytesPerCall: postgrestCommandBytes + commandEnvelopeBytes,
    });
    expect(maximumCommands).toBeGreaterThanOrEqual(1_350);
  });

  it("shows that the historical polling and double auto command exceed the budget", () => {
    const state = representativeState();
    const fullRowBytes = jsonUtf8Bytes([{ ...commitMetadata, state, server_time: serverTime }]);
    const edgeBytes = jsonUtf8Bytes({ state, revision: 42, serverTime, lastProcessedAt: serverTime });
    const legacyCallBytes = fullRowBytes * 2 + edgeBytes;
    const estimate = estimateEgressBudget({
      cycleDays: 31,
      targetCycleBytes: 4.5 * DECIMAL_GB,
      safetyFactor: 1.1,
      routes: [
        {
          name: "30-second-heartbeat",
          callsPerDay: 2_880,
          postgrestBytesPerCall: fullRowBytes * 2,
          functionsBytesPerCall: edgeBytes,
        },
        {
          name: "two-command-auto-encounter",
          callsPerDay: 2_500,
          postgrestBytesPerCall: fullRowBytes * 2,
          functionsBytesPerCall: edgeBytes,
        },
      ],
    });
    expect(legacyCallBytes).toBeGreaterThan(0);
    expect(estimate.withinTarget).toBe(false);
    expect(estimate.projectedCycleBytes).toBeGreaterThan(5 * DECIMAL_GB);
  });

  it("derives the required invocation reduction from the observed Supabase cycle", () => {
    const observedCycleBytes = 8.03 * DECIMAL_GB;
    const targetCycleBytes = 4.5 * DECIMAL_GB;
    const observedInvocations = 127_187;
    const authShare = 0.061;
    const postgrestShare = 0.649;
    const functionsShare = 0.29;
    const compactPostgrestFactor = 0.5;
    const variableTrafficShare = postgrestShare * compactPostgrestFactor + functionsShare;
    const maximumInvocationFactor = (
      targetCycleBytes / observedCycleBytes - authShare
    ) / variableTrafficShare;
    const maximumEquivalentInvocations = Math.floor(observedInvocations * maximumInvocationFactor);

    expect(maximumInvocationFactor).toBeGreaterThan(0.8);
    expect(maximumInvocationFactor).toBeLessThan(0.82);
    expect(maximumEquivalentInvocations).toBeGreaterThan(103_000);
    expect(maximumEquivalentInvocations).toBeLessThan(103_500);
  });

  it("rejects invalid budget inputs instead of producing a misleading ceiling", () => {
    const valid = {
      cycleDays: 31,
      targetCycleBytes: 4.5 * DECIMAL_GB,
      safetyFactor: 1.1,
      fixedDailyBytes: 1_000,
      bytesPerCall: 100,
    };
    expect(() => maximumDailyCallsWithinBudget({ ...valid, cycleDays: 0 })).toThrow("cycleDays");
    expect(() => maximumDailyCallsWithinBudget({ ...valid, targetCycleBytes: Number.NaN })).toThrow("targetCycleBytes");
    expect(() => maximumDailyCallsWithinBudget({ ...valid, safetyFactor: 0.9 })).toThrow("safetyFactor");
    expect(() => maximumDailyCallsWithinBudget({ ...valid, fixedDailyBytes: -1 })).toThrow("fixedDailyBytes");
    expect(() => maximumDailyCallsWithinBudget({ ...valid, bytesPerCall: -1 })).toThrow("bytesPerCall");
    expect(maximumDailyCallsWithinBudget({ ...valid, bytesPerCall: 0 })).toBe(Number.POSITIVE_INFINITY);
  });
});
