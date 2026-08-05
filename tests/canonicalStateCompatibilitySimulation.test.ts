import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CANONICAL_GAME_STATE_REQUIRED_FIELDS,
  validateCanonicalGameState,
} from "../shared/contracts/authoritative";
import {
  applyTownCommand,
  initialTownState,
  migrateTownState,
} from "../supabase/functions/game-api/town-authority";
import { projectCanonicalState } from "../src/domain/canonicalStateProjection";
import { makeHero } from "./fixtures/game";
import { readGameCache, writeGameCache } from "../src/lib/gameCache";
import { createIndexedDbMock } from "./helpers/indexedDbMock";
import {
  createCrossTabAuthorityMessage,
  parseCrossTabAuthorityMessage,
} from "../src/domain/crossTabAuthority";

describe("canonical state compatibility simulation", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("migrates a pre-RNG, pre-DPS snapshot into the complete typed contract", () => {
    const legacyHero = structuredClone(makeHero({ id: "legacy-hero" })) as unknown as Record<string, unknown>;
    delete (legacyHero.calculatedStats as Record<string, unknown>).estimatedDps;
    const legacy = {
      ...initialTownState(42),
      heroes: [legacyHero],
    } as unknown as Record<string, unknown>;
    delete legacy.rngState;

    const migrated = migrateTownState(structuredClone(legacy), 42);

    expect(validateCanonicalGameState(migrated)).toEqual([]);
    expect(migrated.heroes[0].calculatedStats.estimatedDps).toBeGreaterThan(0);
    expect(migrated.rngState).toMatchObject({ algorithm: "xorshift32", version: 1 });
    expect(CANONICAL_GAME_STATE_REQUIRED_FIELDS.every((field) => field in migrated)).toBe(true);
  });

  it("preserves the snapshot through JSON, projection and a command", () => {
    const snapshot = { ...initialTownState(84), cityName: "Compatibilité" };
    const roundTrip = JSON.parse(JSON.stringify(snapshot)) as unknown;
    const migrated = migrateTownState(roundTrip as Record<string, unknown>, 84);
    const projected = projectCanonicalState(migrated);
    const result = applyTownCommand(migrated, {
      type: "cheat.grant_resources",
      amounts: { gold: 1 },
    }, { allowCheats: true });

    expect(validateCanonicalGameState(roundTrip)).toEqual([]);
    expect(projected.cityName).toBe("Compatibilité");
    expect(result.state.resources).toMatchObject({ gold: snapshot.resources.gold + 1 });
    expect(result.state).not.toHaveProperty("combatTimer");
    expect(result.state).not.toHaveProperty("currentMonster");
    expect(result.state).not.toHaveProperty("battleLogs");
    expect(result.state).not.toHaveProperty("soundEnabled");
  });

  it("round-trips every pending frontend state and dungeon loot through the cache", async () => {
    vi.stubGlobal("indexedDB", createIndexedDbMock().indexedDb);
    const pendingRecruit = makeHero({ id: "pending-recruit", equipment: {} });
    const onboardingCandidate = makeHero({ id: "onboarding-candidate", equipment: {} });
    const state = {
      ...initialTownState(126),
      cityName: "État complet",
      pendingForge: {
        previewId: "preview-complete",
        recipeId: "starter_sword",
        itemId: "starter_sword",
        itemType: "weapon" as const,
        upgradeProc: "uncommon" as const,
      },
      pendingRecruit,
      onboardingCandidates: [onboardingCandidate],
      pendingOnboardingCityName: "État complet",
      currentEncounter: {
        encounterId: "encounter-complete",
        kind: "pending" as const,
        status: "active" as const,
        floor: 2,
        room: 3,
        commandId: "command-complete",
      },
      encounterHistory: [{
        encounterId: "encounter-history",
        kind: "treasure" as const,
        floor: 2,
        room: 2,
        outcome: "victory" as const,
        roundCount: 0,
        enemy: null,
        transcript: [{ sequence: 0, type: "reward.item", category: "loot" as const, message: "Butin" }],
        rewards: { gold: 5, loot: [
          { type: "item" as const, instanceId: "loot-item", itemId: "starter_sword", rarity: "common" as const, count: 1 },
          { type: "material" as const, materialId: "metal_scrap", rarity: "common" as const, count: 2, name: "Métal" },
          { type: "blueprint" as const, itemId: "quick_dagger", count: 1 },
        ] },
      }],
    };

    expect(validateCanonicalGameState(state)).toEqual([]);
    await writeGameCache("complete-user", { ...state, revision: 9 });
    const cached = await readGameCache("complete-user");
    expect(validateCanonicalGameState(cached)).toEqual([]);
    expect(projectCanonicalState(cached as typeof state)).toMatchObject({
      pendingForge: state.pendingForge,
      pendingRecruit: { id: pendingRecruit.id },
      currentEncounter: state.currentEncounter,
      encounterHistory: state.encounterHistory,
    });
    const message = createCrossTabAuthorityMessage("tab-complete", {
      revision: 9,
      state,
      serverTime: "2026-08-05T19:00:00.000Z",
      lastProcessedAt: "2026-08-05T19:00:00.000Z",
    });
    expect(parseCrossTabAuthorityMessage(message)).toEqual(message);
  });
});
