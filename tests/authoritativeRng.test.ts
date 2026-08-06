import { describe, expect, it } from "vitest";
import type { CanonicalHero } from "../shared/contracts/authoritative";
import {
  CanonicalRngExhaustedError,
  CanonicalRngStateError,
  MAX_CANONICAL_RNG_DRAWS,
  canonicalRngSeedFromUserId,
  forkCanonicalRng,
  initialCanonicalRngState,
  restoreCanonicalRng,
} from "../supabase/functions/game-api/authoritative-rng";
import {
  applyTownCommand,
  initialTownState,
  migrateTownState,
} from "../supabase/functions/game-api/town-authority";
import { makeHero } from "./fixtures/game";
import { asLegacyUnversionedState } from "./fixtures/stateMigrations";

const activeDungeonState = () => ({
  ...initialTownState(),
  heroes: [makeHero({
    id: "hero-1",
    name: "Ariane",
    isActive: true,
    currentHp: 100,
    calculatedStats: {
      ...makeHero().calculatedStats,
      maxHp: 100,
      hp: 100,
      physicalDamage: 20,
    },
  })],
});

describe("canonical authoritative RNG", () => {
  it("migrates an old save to the deterministic versioned initial state", () => {
    const legacy = asLegacyUnversionedState(initialTownState()) as Record<string, unknown>;
    delete legacy.rngState;
    const userSeed = canonicalRngSeedFromUserId("50505050-5050-4050-8050-505050505050");
    expect(migrateTownState(legacy, userSeed).rngState).toEqual({
      algorithm: "xorshift32",
      version: 1,
      seed: userSeed,
      state: userSeed,
      draws: 0,
    });
  });

  it("derives a stable and account-specific seed", () => {
    const first = canonicalRngSeedFromUserId("50505050-5050-4050-8050-505050505050");
    // Golden value shared with supabase/tests/database/022_canonical_rng.sql.
    // This prevents the TypeScript and PostgreSQL FNV-1a implementations
    // from drifting while remaining independently deterministic.
    expect(first).toBe(652989193);
    expect(first).toBe(canonicalRngSeedFromUserId("50505050-5050-4050-8050-505050505050"));
    expect(first).not.toBe(canonicalRngSeedFromUserId("51515151-5151-4151-8151-515151515152"));
    expect(first).not.toBe(0);
  });

  it("rejects a present malformed or unsupported RNG state", () => {
    expect(() => migrateTownState({
      ...initialTownState(),
      rngState: { algorithm: "xorshift32", version: 2, seed: 42, state: 42, draws: 0 },
    })).toThrow("canonical game state is invalid: rngState.version must be 1");
    expect(() => restoreCanonicalRng(null)).toThrow(CanonicalRngStateError);
  });

  it("rejects a structurally valid RNG seed owned by another account", () => {
    expect(() => migrateTownState({
      ...initialTownState(42),
    }, 43)).toThrowError(expect.objectContaining({
      code: "INVALID_GAME_STATE",
      reason: "RNG_SEED_USER_MISMATCH",
    }));
  });

  it("accepts the shared maximum draw count but refuses to exceed it", () => {
    const rng = restoreCanonicalRng({
      ...initialCanonicalRngState(42),
      draws: MAX_CANONICAL_RNG_DRAWS,
    });
    expect(() => rng.next()).toThrow(CanonicalRngExhaustedError);
    expect(rng.snapshot().draws).toBe(MAX_CANONICAL_RNG_DRAWS);
  });

  it("restores and reproduces the same sequence from the same snapshot", () => {
    const initial = initialCanonicalRngState(42);
    const first = restoreCanonicalRng(initial);
    const second = restoreCanonicalRng(initial);
    const firstValues = [first.next(), first.nextInt(17), first.next()];
    const secondValues = [second.next(), second.nextInt(17), second.next()];
    expect(secondValues).toEqual(firstValues);
    expect(second.snapshot()).toEqual(first.snapshot());
    expect(first.snapshot()).toMatchObject({ seed: 42, draws: 3 });
  });

  it("forks one independent sub-sequence per atomic random block", () => {
    const master = restoreCanonicalRng(initialCanonicalRngState(42));
    const firstBlock = forkCanonicalRng(master);
    const secondBlock = forkCanonicalRng(master);
    expect(firstBlock.snapshot().seed).not.toBe(secondBlock.snapshot().seed);
    expect([firstBlock.next(), firstBlock.next()]).not.toEqual([
      secondBlock.next(),
      secondBlock.next(),
    ]);
    expect(master.snapshot().draws).toBe(2);
  });

  it("advances RNG state only with an accepted stochastic transition", () => {
    const initial = activeDungeonState();
    const started = applyTownCommand(initial, {
      type: "dungeon.explore",
      floor: 1,
      commandId: "rng-explore",
    });
    expect(started.state.rngState).toEqual(initial.rngState);

    const resolved = applyTownCommand(started.state, {
      type: "dungeon.resolve",
      commandId: "rng-resolve",
    });
    expect(resolved.state.rngState).not.toEqual(initial.rngState);
    expect((resolved.state.rngState as { draws: number }).draws).toBe(1);
  });

  it("uses and persists the same canonical sequence for novice generation", () => {
    const initial = initialTownState();
    const firstOffer = applyTownCommand(initial, {
      type: "onboarding.offer",
      cityName: "Oakhaven",
      commandId: "offer-a",
    });
    const secondOffer = applyTownCommand(initial, {
      type: "onboarding.offer",
      cityName: "Oakhaven",
      commandId: "offer-b",
    });
    const profiles = (value: CanonicalHero[]) => value
      .map(({ id: _id, equipment, ...profile }) => ({
        ...profile,
        equipment: Object.fromEntries(Object.entries(equipment ?? {})
          .map(([slot, item]) => {
            if (!item) return [slot, item];
            const { instanceId: _instanceId, ...itemProfile } = item;
            return [slot, itemProfile];
          })),
      }));
    expect(profiles(firstOffer.state.onboardingCandidates)).toEqual(
      profiles(secondOffer.state.onboardingCandidates),
    );
    expect(firstOffer.state.rngState).toEqual(secondOffer.state.rngState);
    expect((firstOffer.state.rngState as { draws: number }).draws).toBe(5);
    expect(firstOffer.state.onboardingCandidates
      .every((candidate) => candidate.race === "Humain")).toBe(true);
    const instanceIds = firstOffer.state.onboardingCandidates
      .flatMap((candidate) => Object.values(candidate.equipment ?? {}))
      .flatMap((item) => item?.instanceId ? [item.instanceId] : []);
    expect(new Set(instanceIds).size).toBe(instanceIds.length);
  });

  it("does not mutate persisted RNG input when a command is rejected", () => {
    const current = initialTownState();
    const before = structuredClone(current.rngState);
    expect(() => applyTownCommand(current, { type: "dungeon.resolve" })).toThrow("there is no active encounter");
    expect(current.rngState).toEqual(before);
  });

  it("reproduces identical state for the same seed and command sequence", () => {
    const run = () => {
      const initial = activeDungeonState();
      const started = applyTownCommand(initial, {
        type: "dungeon.explore",
        floor: 1,
        commandId: "same-explore",
      });
      return applyTownCommand(started.state, {
        type: "dungeon.resolve",
        commandId: "same-resolve",
      });
    };
    expect(run()).toEqual(run());
  });
});
