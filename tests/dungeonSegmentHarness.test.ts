import { describe, expect, it } from "vitest";
import { CURRENT_CANONICAL_STATE_VERSION } from "../shared/contracts/authoritative";
import { createUndercityProgress } from "../shared/domain/undercity-progression";
import { UNDERCITY_ZONES } from "../shared/domain/undercity";
import {
  calculateSharedCombatXp,
  CANONICAL_DUNGEON_XP_REWARD_POLICY,
  getPolicyXpPool,
} from "../shared/domain/dungeon-xp-rewards";
import { migrateCanonicalState } from "../supabase/functions/game-api/state-migrations";
import { applyTownCommand, initialTownState } from "../supabase/functions/game-api/town-authority";
import {
  DUNGEON_SEGMENT_HARNESS_SOURCE,
  DUNGEON_SEGMENT_SCENARIOS,
  DungeonSegmentHarness,
  createDungeonSegmentRng,
} from "./fixtures/dungeonSegmentHarness";
import { makeStoredItem } from "./fixtures/game";

const ACTIVE_SCENARIOS = new Set([
  "H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08", "H09", "H10", "H11", "H12", "H13", "H14", "H15", "H16", "H17", "H18", "H19", "H20",
]);

function legacyV5State(completedFloor: number, active = true) {
  const harness = new DungeonSegmentHarness();
  const heroIds = harness.state.heroes.map((hero) => hero.id);
  const dungeonProgress = createUndercityProgress(heroIds, completedFloor) as unknown as Record<string, unknown>;
  const expedition = dungeonProgress.expedition as Record<string, unknown>;
  for (const field of [
    "phase",
    "segmentHeroIds",
    "knockedOutHeroIds",
    "checkpointFloor",
    "autoExploreBeforeCheckpoint",
  ]) delete expedition[field];
  return {
    ...harness.state,
    stateVersion: 5,
    heroes: harness.state.heroes.map((hero) => ({
      ...hero,
      isActive: active,
      status: active ? "idle" as const : "resting" as const,
      currentHp: active ? hero.currentHp : 0,
    })),
    activeDungeonFloor: Math.min(50, completedFloor + 1),
    activeDungeonRoom: 3,
    autoExplore: true,
    currentEncounter: {
      encounterId: "legacy-v5-encounter",
      kind: "pending" as const,
      status: "active" as const,
      dungeonId: "undercity",
      floor: Math.min(50, completedFloor + 1),
      room: 3,
      participantHeroIds: heroIds,
    },
    dungeonProgress,
  } as unknown as Record<string, unknown>;
}

describe(`dungeon segment harness — ${DUNGEON_SEGMENT_HARNESS_SOURCE}`, () => {
  it("loads the complete ordered scenario catalog from the Markdown contract", () => {
    expect(DUNGEON_SEGMENT_SCENARIOS.map(([id]) => id)).toEqual(
      Array.from({ length: 20 }, (_, index) => `H${String(index + 1).padStart(2, "0")}`),
    );
  });

  it("H02 — regresses the original KO reassignment defect between encounters", () => {
    const harness = new DungeonSegmentHarness();
    const rng = createDungeonSegmentRng();

    const started = harness.startRoom("characterize-ko-reassignment");
    expect(started.state.currentEncounter?.participantHeroIds).toEqual(
      harness.capturedSegmentHeroIds,
    );

    const resolved = harness.resolveRoom(rng);
    expect(resolved.state.currentEncounter).toBeNull();
    expect(resolved.state.encounterHistory.at(-1)).toMatchObject({
      kind: "fight",
      outcome: "victory",
    });
    expect(harness.hero("segment-hero-ko")).toMatchObject({
      currentHp: 0,
      isActive: false,
      status: "resting",
    });

    harness.state.heroes = harness.state.heroes.map((hero) => hero.id === "segment-hero-ko"
      ? { ...hero, currentHp: 1 }
      : hero);
    expect(() => harness.command({
      type: "hero.activity",
      heroId: "segment-hero-ko",
      active: true,
    })).toThrowError(expect.objectContaining({ code: "EXPEDITION_PARTY_LOCKED" }));
    expect(harness.hero("segment-hero-ko")).toMatchObject({ isActive: false });
    expect(harness.capturedSegmentHeroIds).toContain("segment-hero-ko");
    expect(harness.state.encounterHistory.at(-1)?.transcript.some((event) => (
      event.type === "hero.defeated"
      && event.message?.includes("reste KO dans l'expédition")
      && !event.message.includes("dortoirs")
    ))).toBe(true);
    expect(rng.draws()).toBeGreaterThan(0);
  });

  it("H06 — suppresses town recovery while the KO still belongs to the segment", () => {
    const harness = new DungeonSegmentHarness();
    harness.startRoom("h06-ko-recovery");
    harness.resolveRoom(createDungeonSegmentRng());

    const before = structuredClone(harness.hero("segment-hero-ko"));
    const recovered = harness.recoverFor(60);
    expect(recovered.report.heroesRecovered).toBe(0);
    expect(harness.hero("segment-hero-ko")).toEqual(before);
    expect(harness.state.dungeonProgress.expedition.knockedOutHeroIds)
      .toContain("segment-hero-ko");

    harness.state = {
      ...harness.state,
      activeDungeonFloor: 6,
      activeDungeonRoom: 1,
      autoExplore: false,
      currentEncounter: null,
      dungeonProgress: {
        ...harness.state.dungeonProgress,
        expedition: {
          ...harness.state.dungeonProgress.expedition,
          phase: "checkpoint_decision",
          floor: 6,
          room: 1,
          checkpointFloor: 5,
          autoExploreBeforeCheckpoint: true,
        },
      },
    };
    const reloaded = new DungeonSegmentHarness(structuredClone(harness.state));
    const checkpointBefore = structuredClone(reloaded.hero("segment-hero-ko"));
    expect(reloaded.recoverFor(60).report.heroesRecovered).toBe(0);
    expect(reloaded.hero("segment-hero-ko")).toEqual(checkpointBefore);
  });

  it("H03 — locks member mutations while preserving management of town heroes", () => {
    const harness = new DungeonSegmentHarness();
    const memberId = "segment-hero-1";
    const reserveId = "segment-hero-ko";
    const equipped = makeStoredItem({ instanceId: "h03-equipped", itemId: "starter_sword" });
    const available = makeStoredItem({ instanceId: "h03-available", itemId: "starter_sword" });
    harness.state.heroes = harness.state.heroes.map((hero) => {
      if (hero.id === reserveId) return { ...hero, isActive: false, status: "resting" as const };
      if (hero.id === memberId) return { ...hero, equipment: { ...hero.equipment, mainHand: equipped } };
      return hero;
    });
    harness.state.storedItems = [available];
    harness.state.pendingClassTransitions = [{
      heroId: memberId,
      fromClass: "Novice",
      fromTier: 0,
      toTier: 1,
      originLevel: 1,
      wasActive: true,
      previousStatus: "idle",
      reason: "h03",
      candidates: [{ classType: "Guerrier", affinity: 1 }],
    }];
    harness.startRoom("h03-locks");

    for (const command of [
      { type: "hero.activity", heroId: memberId, active: false },
      { type: "hero.dismiss", heroId: memberId },
      { type: "hero.equip", heroId: memberId, instanceId: available.instanceId },
      { type: "hero.unequip", heroId: memberId, slot: "mainHand" },
      { type: "hero.choose_vocation", heroId: memberId, classType: "Guerrier" },
    ]) {
      expect(() => harness.command(command)).toThrowError(expect.objectContaining({
        code: "EXPEDITION_PARTY_LOCKED",
      }));
    }
    expect(() => harness.command({ type: "hero.activity", heroId: reserveId, active: true }))
      .toThrowError(expect.objectContaining({ code: "EXPEDITION_PARTY_LOCKED" }));
    expect(harness.command({
      type: "hero.equip",
      heroId: reserveId,
      instanceId: available.instanceId,
    }).events).toContainEqual(expect.objectContaining({
      type: "hero.equipped",
      heroId: reserveId,
      instanceId: available.instanceId,
    }));
    expect(harness.command({
      type: "hero.unequip",
      heroId: reserveId,
      slot: "mainHand",
    }).events).toContainEqual(expect.objectContaining({
      type: "hero.unequipped",
      heroId: reserveId,
      instanceId: available.instanceId,
    }));
  });

  it("H04 — preserves canonical rest recovery for operational members", () => {
    const harness = new DungeonSegmentHarness();
    harness.state.heroes = harness.state.heroes.map((hero, index) => index === 0
      ? {
          ...hero,
          currentHp: 500,
          currentMana: 9,
          calculatedStats: { ...hero.calculatedStats, maxMana: 10, mana: 10 },
        }
      : hero);
    harness.startRoom("h04-rest");
    const xpBefore = new Map(harness.state.heroes.map((hero) => [hero.id, hero.xp]));
    const resolved = harness.resolveRoom(createDungeonSegmentRng([0.99]));
    const expectedXp = calculateSharedCombatXp(
      getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "rest", 1),
      4,
      { race: "Humain" },
    );
    expect(resolved.state.encounterHistory.at(-1)?.kind).toBe("rest");
    expect(harness.hero("segment-hero-1")).toMatchObject({ currentHp: 700, currentMana: 10 });
    expect(harness.hero("segment-hero-2").currentHp).toBe(1_000);
    for (const hero of harness.state.heroes) {
      expect(hero.xp - (xpBefore.get(hero.id) ?? 0)).toBe(expectedXp);
    }
  });

  it("H05 — revives every segment KO before sharing rest XP", () => {
    const harness = new DungeonSegmentHarness();
    harness.startRoom("h05-rest-revive");
    const knockedOutIds = new Set(["segment-hero-3", "segment-hero-ko"]);
    harness.state.heroes = harness.state.heroes.map((hero) => knockedOutIds.has(hero.id)
      ? {
          ...hero,
          currentHp: 0,
          currentMana: 2,
          isActive: false,
          status: "resting" as const,
          calculatedStats: { ...hero.calculatedStats, maxMana: 10, mana: 10 },
        }
      : hero);
    harness.state.dungeonProgress.expedition.knockedOutHeroIds = [...knockedOutIds];
    const xpBefore = new Map(harness.state.heroes.map((hero) => [hero.id, hero.xp]));
    harness.resolveRoom(createDungeonSegmentRng([0.99]));
    const initialActors = harness.state.encounterHistory.at(-1)?.initialActors;
    expect(initialActors).toMatchObject({ v: 1, e: [] });
    expect(initialActors?.h).toHaveLength(4);
    expect(initialActors?.h.map((hero) => ({
      id: hero[0],
      hp: [hero[2], hero[3]],
      mana: [hero[4], hero[5]],
      ko: hero[6] === 1,
    }))).toEqual([
      { id: "segment-hero-1", hp: [1_000, 1_000], mana: [0, 0], ko: false },
      { id: "segment-hero-2", hp: [1_000, 1_000], mana: [0, 0], ko: false },
      { id: "segment-hero-3", hp: [0, 1_000], mana: [2, 10], ko: true },
      { id: "segment-hero-ko", hp: [0, 20], mana: [2, 10], ko: true },
    ]);
    expect(harness.hero("segment-hero-ko")).toMatchObject({
      currentHp: 4,
      currentMana: 4,
      isActive: true,
      status: "idle",
    });
    expect(harness.hero("segment-hero-3")).toMatchObject({
      currentHp: 200,
      currentMana: 4,
      isActive: true,
      status: "idle",
    });
    const expectedXp = calculateSharedCombatXp(
      getPolicyXpPool(CANONICAL_DUNGEON_XP_REWARD_POLICY, "rest", 1),
      4,
      { race: "Humain" },
    );
    for (const heroId of knockedOutIds) {
      expect(harness.hero(heroId).xp - (xpBefore.get(heroId) ?? 0)).toBe(expectedXp);
    }
    expect(harness.state.dungeonProgress.expedition.knockedOutHeroIds).toEqual([]);
    const restTranscript = harness.state.encounterHistory.at(-1)?.transcript ?? [];
    expect(restTranscript.some((event) => event.type === "hero.hit" && knockedOutIds.has(event.heroId ?? ""))).toBe(false);
  });

  it("H07 — credits a milestone participant KO without ordinary combat XP", () => {
    const harness = new DungeonSegmentHarness();
    harness.positionAtFinalRoom(5);
    harness.startRoom("h07-ko-milestone");
    harness.state.heroes = harness.state.heroes.map((hero) => hero.id === "segment-hero-ko"
      ? { ...hero, currentHp: 0, isActive: false, status: "resting" as const }
      : hero);
    const resolved = harness.resolveRoom(createDungeonSegmentRng());
    const progress = resolved.state.dungeonProgress.heroes["segment-hero-ko"];
    const transcript = resolved.state.encounterHistory.at(-1)?.transcript ?? [];
    expect(progress.completedFloor).toBe(5);
    expect(progress.fixedVictoryIds).toContain("undercity:elite:05");
    expect(transcript).toContainEqual(expect.objectContaining({
      type: "reward.personal_first",
      heroId: "segment-hero-ko",
    }));
    expect(transcript).not.toContainEqual(expect.objectContaining({
      type: "reward.xp",
      heroId: "segment-hero-ko",
      source: "elite",
    }));
  });

  it("H01 — captures the roster on the first room and carries it through Continue", () => {
    const harness = new DungeonSegmentHarness();
    expect(harness.state.dungeonProgress.expedition).toMatchObject({
      phase: "preparing",
      segmentHeroIds: [],
    });

    harness.command({ type: "hero.activity", heroId: "segment-hero-ko", active: false });
    harness.command({ type: "hero.activity", heroId: "segment-hero-ko", active: true });
    const started = harness.startRoom("h01-first-room");
    expect(started.state.dungeonProgress.expedition).toMatchObject({
      phase: "running",
      segmentHeroIds: harness.capturedSegmentHeroIds,
    });

    harness.reachCheckpoint(5);
    const rosterAtCheckpoint = [...harness.state.dungeonProgress.expedition.segmentHeroIds];
    const continued = harness.command({
      type: "dungeon.checkpoint_decide",
      decision: "continue",
    });
    expect(continued.state.dungeonProgress.expedition).toMatchObject({
      phase: "running",
      floor: 6,
      room: 1,
      segmentHeroIds: rosterAtCheckpoint,
    });
  });

  it("H08 — persists a blocking checkpoint decision after floors divisible by five", () => {
    const harness = new DungeonSegmentHarness();
    harness.reachCheckpoint(5);

    expect(harness.state).toMatchObject({ autoExplore: false, currentEncounter: null });
    expect(harness.state.dungeonProgress.expedition).toMatchObject({
      phase: "checkpoint_decision",
      checkpointFloor: 5,
      floor: 6,
      room: 1,
    });
    expect(() => harness.command({ type: "dungeon.explore", floor: 6 }))
      .toThrowError(expect.objectContaining({ code: "CHECKPOINT_DECISION_REQUIRED" }));
  });

  it("H11 — resumes automation only when it was enabled before the checkpoint", () => {
    const automatic = new DungeonSegmentHarness();
    automatic.reachCheckpoint(5, true);
    expect(automatic.state.dungeonProgress.expedition.autoExploreBeforeCheckpoint).toBe(true);
    expect(automatic.state.autoExplore).toBe(false);
    automatic.command({ type: "dungeon.checkpoint_decide", decision: "continue" });
    expect(automatic.state.autoExplore).toBe(true);

    const manual = new DungeonSegmentHarness();
    manual.reachCheckpoint(5, false);
    manual.command({ type: "dungeon.checkpoint_decide", decision: "continue" });
    expect(manual.state.autoExplore).toBe(false);
  });

  it("H12 — returns the whole segment to town between rooms", () => {
    const harness = new DungeonSegmentHarness();
    harness.startRoom("h12-room");
    harness.resolveRoom(createDungeonSegmentRng());
    const returned = harness.command({ type: "dungeon.retreat" });
    expect(returned.state).toMatchObject({ currentEncounter: null, autoExplore: false });
    expect(returned.state.dungeonProgress.expedition).toMatchObject({
      phase: "preparing",
      halted: true,
      haltReason: "retreat",
      segmentHeroIds: [],
      knockedOutHeroIds: [],
    });
  });

  it("H13 — abandons an active encounter without rewards or progress", () => {
    const harness = new DungeonSegmentHarness();
    const before = structuredClone(harness.state);
    harness.startRoom("h13-active-room");
    const returned = harness.command({ type: "dungeon.retreat" });
    expect(returned.state.currentEncounter).toBeNull();
    expect(returned.state.resources).toEqual(before.resources);
    expect(returned.state.encounterHistory).toEqual(before.encounterHistory);
    expect(returned.state.dungeonProgress.heroes).toEqual(before.dungeonProgress.heroes);
  });

  it("H14 — wipes immediately when the last operational member falls", () => {
    const harness = new DungeonSegmentHarness();
    harness.state.heroes = harness.state.heroes.map((hero) => hero.id === "segment-hero-ko"
      ? hero
      : { ...hero, isActive: false, status: "resting" as const });
    harness.startRoom("h14-wipe");
    const resolved = harness.resolveRoom(createDungeonSegmentRng());
    expect(resolved.state.encounterHistory.at(-1)?.outcome).toBe("defeat");
    expect(resolved.state.dungeonProgress.expedition).toMatchObject({
      phase: "preparing",
      halted: true,
      haltReason: "wipe",
      segmentHeroIds: [],
      knockedOutHeroIds: [],
    });
    expect(resolved.state.currentEncounter).toBeNull();
  });

  it("H15 — accepts a wounded hero until the first room captures the roster", () => {
    const harness = new DungeonSegmentHarness();
    harness.state.heroes = harness.state.heroes.map((hero, index) => index === 0
      ? { ...hero, currentHp: 1 }
      : hero);
    expect(harness.state.dungeonProgress.expedition.phase).toBe("preparing");
    const started = harness.startRoom("h15-wounded");
    expect(started.state.currentEncounter?.participantHeroIds).toContain("segment-hero-1");
    expect(started.state.dungeonProgress.expedition.segmentHeroIds).toContain("segment-hero-1");
  });

  it("H18 — requires a town return after floor 50 before farm selection", () => {
    const harness = new DungeonSegmentHarness();
    harness.reachCheckpoint(50);

    expect(harness.state.dungeonProgress.expedition).toMatchObject({
      phase: "checkpoint_decision",
      checkpointFloor: 50,
    });
    expect(() => harness.command({ type: "dungeon.checkpoint_decide", decision: "continue" }))
      .toThrowError(expect.objectContaining({ code: "CHECKPOINT_RETURN_REQUIRED" }));

    harness.command({ type: "dungeon.checkpoint_decide", decision: "return_to_town" });
    expect(harness.state.dungeonProgress.expedition).toMatchObject({
      phase: "preparing",
      halted: true,
      haltReason: "retreat",
      segmentHeroIds: [],
    });
    for (const hero of harness.state.heroes) {
      harness.command({ type: "hero.activity", heroId: hero.id, active: true });
    }
    const farm = harness.command({
      type: "dungeon.select_farm_zone",
      dungeonId: "undercity",
      zoneId: UNDERCITY_ZONES[0].id,
    });
    expect(farm.state.dungeonProgress.expedition).toMatchObject({
      mode: "farm",
      phase: "running",
    });
  });

  it("H16 — keeps the farm roster locked and allows rest revival without a checkpoint", () => {
    const harness = new DungeonSegmentHarness();
    harness.state.dungeonProgress = createUndercityProgress(
      harness.state.heroes.map((hero) => hero.id),
      50,
    );
    harness.state.activeDungeonFloor = 50;
    harness.state.highestFloorReached = 50;
    harness.command({
      type: "dungeon.select_farm_zone",
      dungeonId: "undercity",
      zoneId: UNDERCITY_ZONES[0].id,
    });
    const farmBeforeZoneChange = structuredClone(harness.state);
    expect(() => harness.command({
      type: "dungeon.select_farm_zone",
      dungeonId: "undercity",
      zoneId: UNDERCITY_ZONES[1].id,
    })).toThrowError(expect.objectContaining({ code: "EXPEDITION_RUNNING" }));
    expect(harness.state).toEqual(farmBeforeZoneChange);
    const roster = [...harness.state.dungeonProgress.expedition.segmentHeroIds];
    harness.startRoom("h16-farm-rest");
    harness.state.heroes = harness.state.heroes.map((hero) => hero.id === "segment-hero-ko"
      ? { ...hero, currentHp: 0, isActive: false, status: "resting" as const }
      : hero);
    harness.state.dungeonProgress.expedition.knockedOutHeroIds = ["segment-hero-ko"];
    harness.resolveRoom(createDungeonSegmentRng([0.99]));
    expect(harness.state.dungeonProgress.expedition).toMatchObject({
      mode: "farm",
      phase: "running",
      checkpointFloor: null,
      segmentHeroIds: roster,
      knockedOutHeroIds: [],
    });
    expect(harness.hero("segment-hero-ko")).toMatchObject({ isActive: true });
  });

  it("H19 — migrates v5 expeditions to deterministic safe preparation", () => {
    const defaults = initialTownState(42);
    const rngBefore = structuredClone(legacyV5State(12).rngState);
    const migrated = migrateCanonicalState(legacyV5State(12), { defaults });

    expect(migrated).toMatchObject({
      stateVersion: CURRENT_CANONICAL_STATE_VERSION,
      activeDungeonFloor: 11,
      activeDungeonRoom: 1,
      currentEncounter: null,
      autoExplore: false,
    });
    expect(migrated.dungeonProgress.expedition).toMatchObject({
      mode: "progression",
      floor: 11,
      room: 1,
      phase: "preparing",
      segmentHeroIds: [],
      knockedOutHeroIds: [],
      checkpointFloor: null,
    });
    expect(migrated.rngState).toEqual(rngBefore);

    const withoutEligibleHero = migrateCanonicalState(legacyV5State(12, false), {
      defaults,
    });
    expect(withoutEligibleHero).toMatchObject({
      activeDungeonFloor: 1,
      activeDungeonRoom: 1,
    });

    const legacyFarm = legacyV5State(50);
    const legacyFarmProgress = legacyFarm.dungeonProgress as Record<string, unknown>;
    legacyFarmProgress.expedition = {
      ...(legacyFarmProgress.expedition as Record<string, unknown>),
      mode: "farm",
      zoneId: UNDERCITY_ZONES[0].id,
    };
    const migratedFarm = migrateCanonicalState(legacyFarm, { defaults });
    expect(migratedFarm.dungeonProgress.expedition).toMatchObject({
      mode: "progression",
      zoneId: null,
      phase: "preparing",
      segmentHeroIds: [],
      knockedOutHeroIds: [],
    });
    expect(Object.values(migratedFarm.dungeonProgress.heroes).every((progress) => progress.completedFloor === 50)).toBe(true);
    expect(migratedFarm.currentEncounter).toBeNull();
    expect(migratedFarm.autoExplore).toBe(false);
  });

  it("H20 — survives reload, replays deterministically and rejects a second decision", () => {
    const harness = new DungeonSegmentHarness();
    harness.reachCheckpoint(5, true);
    const persisted = structuredClone(harness.state);

    const first = applyTownCommand(persisted, {
      type: "dungeon.checkpoint_decide",
      decision: "continue",
    });
    const replayFromSameRevision = applyTownCommand(persisted, {
      type: "dungeon.checkpoint_decide",
      decision: "continue",
    });
    expect(replayFromSameRevision).toEqual(first);
    expect(first.state.dungeonProgress.expedition).toMatchObject({
      phase: "running",
      floor: 6,
      segmentHeroIds: persisted.dungeonProgress.expedition.segmentHeroIds,
    });
    expect(() => applyTownCommand(first.state, {
      type: "dungeon.checkpoint_decide",
      decision: "return_to_town",
    })).toThrowError(expect.objectContaining({ code: "CHECKPOINT_NOT_PENDING" }));
  });

  const pendingScenarios = DUNGEON_SEGMENT_SCENARIOS.filter(([id]) => !ACTIVE_SCENARIOS.has(id));
  if (pendingScenarios.length > 0) describe("target contract scenarios", () => {
    for (const [id, title] of pendingScenarios) {
      it.todo(`${id} — ${title}`);
    }
  });
});
