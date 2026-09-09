import { describe, expect, it } from "vitest";
import { makeHero } from "./fixtures/game";
import { applyTownCommand, initialTownState, migrateTownState } from "../supabase/functions/game-api/town-authority";
import { applyDungeonCommand, type DungeonRng } from "../supabase/functions/game-api/dungeon-authority";
import { applyForgeCommand } from "../supabase/functions/game-api/forge-authority";
import {
  UNDERCITY_DUNGEON_ID,
  UNDERCITY_ZONES,
  createUndercityEnemyGroup,
  getUndercityEncounterBlueprint,
  getUndercityFixedVictoryId,
  getUndercityZone,
  resolveUndercityThemeModifier,
} from "../shared/domain/undercity";
import {
  canFarmUndercity,
  createUndercityProgress,
  haltUndercityExpedition,
  restartUndercityExpedition,
  selectUndercityFarmZone,
  settleUndercityVictory,
  synchronizeUndercityParty,
  validateUndercityProgress,
} from "../shared/domain/undercity-progression";
import {
  createUndercityCombatGroup,
  damageUndercityEnemy,
  prepareUndercityEnemyRound,
} from "../shared/domain/undercity-combat";
import {
  RAT_KING_MARK_ID,
  RAT_KING_SIGNATURE_FINAL_MODIFIERS,
  RAT_KING_SIGNATURE_IDS,
  RAT_KING_SIGNATURE_PARAMETERS,
} from "../shared/domain/items/items_rat_king";
import { getItemById } from "../shared/domain/items/items";
import { getDungeonRoomCount } from "../shared/domain/dungeon-progression";
import { validateAuthoritativeHero } from "../shared/domain/authoritative-hero-validation";

const zeroRng = (): DungeonRng => ({ next: () => 0, nextInt: () => 0 });
const rewardHero = (id: string) => makeHero({
  id,
  isActive: true,
  currentHp: 1_000_000,
  calculatedStats: {
    ...makeHero().calculatedStats,
    maxHp: 1_000_000,
    hp: 1_000_000,
    physicalDamage: 1_000_000,
  },
});

describe("UnderCity product domain", () => {
  it("defines the validated fifty-floor route and fixed encounters", () => {
    expect(UNDERCITY_ZONES.map((zone) => [zone.id, zone.floorMin, zone.floorMax])).toEqual([
      ["sewers", 1, 10],
      ["smugglers", 11, 20],
      ["cisterns", 21, 30],
      ["bastion", 31, 40],
      ["court", 41, 50],
    ]);
    expect(getUndercityZone(50).boss.name).toBe("Le Roi des Rats");
    for (const zone of UNDERCITY_ZONES) {
      expect(new Set([...zone.encounters, zone.elite, zone.boss].map((encounter) => encounter.members.length))).toEqual(new Set([1, 2, 3]));
    }
    expect(getUndercityFixedVictoryId(45, getDungeonRoomCount(45), getDungeonRoomCount(45))).toBe("undercity:elite:45");
    expect(getUndercityFixedVictoryId(50, getDungeonRoomCount(50), getDungeonRoomCount(50))).toBe("undercity:boss:50");
  });

  it("creates targetable groups and changes the Rat King phase on the following round", () => {
    const source = {
      id: "king",
      name: "legacy",
      hp: 300,
      maxHp: 300,
      atk: 90,
      def: 40,
      magicDef: 30,
      damageType: "physical" as const,
      isBoss: true,
      xpYield: 1,
      goldYield: 1,
      image: "",
    };
    const blueprint = getUndercityEncounterBlueprint(50, getDungeonRoomCount(50), getDungeonRoomCount(50), 0);
    const members = createUndercityEnemyGroup(source, blueprint);
    expect(members.map((member) => member.role)).toEqual(["guard", "guard", "king"]);
    expect(members.filter((member) => member.isBoss).map((member) => member.role)).toEqual(["king"]);
    const group = createUndercityCombatGroup(source, blueprint);
    prepareUndercityEnemyRound(group, 1);
    const king = group.members.find((member) => member.role === "king")!;
    expect(king.intent).toBe("Commandement protégé");
    for (const guard of group.members.filter((member) => member.role === "guard")) {
      damageUndercityEnemy(group, guard.id, guard.hp);
    }
    prepareUndercityEnemyRound(group, 2);
    expect(king.intent).toBe("Assaut monstrueux");
  });

  it("selects one stable compatible thematic modifier", () => {
    const sword = getItemById("progression_sword")!;
    const first = resolveUndercityThemeModifier(50, "same-instance", sword);
    const second = resolveUndercityThemeModifier(50, "same-instance", sword);
    expect(second).toEqual(first);
    expect(first.stat).not.toBe("magicDamage");
    const armor = getItemById("progression_leather_armor")!;
    expect(resolveUndercityThemeModifier(20, "armor-instance", armor).stat).not.toBe("physicalDamage");
  });

  it("tracks sequential personal progress, one fixed receipt and the common checkpoint", () => {
    const progress = createUndercityProgress(["veteran", "novice"]);
    progress.heroes.veteran.completedFloor = 20;
    progress.heroes.novice.completedFloor = 9;
    const settled = settleUndercityVictory(progress, ["novice"], 10, 5, 5);
    expect(settled.firstVictoryHeroIds).toEqual(["novice"]);
    expect(settled.progress.heroes.novice.completedFloor).toBe(10);
    const replay = settleUndercityVictory(settled.progress, ["novice"], 10, 5, 5);
    expect(replay.firstVictoryHeroIds).toEqual([]);
    const halted = haltUndercityExpedition(replay.progress, "wipe");
    expect(synchronizeUndercityParty(halted, ["novice"]).expedition).toMatchObject({
      halted: true,
      haltReason: "wipe",
      floor: 11,
    });
    expect(restartUndercityExpedition(halted, ["veteran", "novice"]).expedition).toMatchObject({
      floor: 11,
      room: 1,
      halted: false,
    });
  });

  it("unlocks farm only for parties whose every member defeated the Rat King", () => {
    const progress = createUndercityProgress(["a", "b"], 50);
    expect(canFarmUndercity(progress, ["a", "b"])).toBe(true);
    progress.heroes.b.fixedVictoryIds = progress.heroes.b.fixedVictoryIds.filter((id) => id !== "undercity:boss:50");
    expect(canFarmUndercity(progress, ["a", "b"])).toBe(false);
  });

  it("rejects incoherent farm routes and fixed-victory receipts", () => {
    const progress = createUndercityProgress(["hero"]);
    progress.expedition = {
      ...progress.expedition,
      mode: "farm",
      zoneId: "sewers",
      floor: 50,
    };
    progress.heroes.hero.fixedVictoryIds.push("undercity:boss:50");

    expect(validateUndercityProgress(progress)).toEqual(expect.arrayContaining([
      "dungeonProgress.expedition.floor is outside the selected farm zone",
      "dungeonProgress.heroes.hero.fixedVictoryIds contains an unearned receipt",
    ]));
  });

  it("resumes a halted expedition explicitly at the common checkpoint", () => {
    const hero = makeHero({ id: "returning", isActive: true });
    const progress = haltUndercityExpedition(createUndercityProgress([hero.id], 10), "wipe");
    const resumed = applyDungeonCommand({
      ...initialTownState(42),
      heroes: [hero],
      highestFloorReached: 11,
      activeDungeonFloor: 11,
      dungeonProgress: progress,
    }, { type: "dungeon.resume", dungeonId: UNDERCITY_DUNGEON_ID });

    expect(resumed.state.dungeonProgress.expedition).toMatchObject({
      floor: 11,
      room: 1,
      halted: false,
      haltReason: null,
    });
    expect(resumed.state.autoExplore).toBe(false);
  });

  it("rejects resume while running and floor selection while farming", () => {
    const hero = makeHero({ id: "guarded-route", isActive: true });
    const running = {
      ...initialTownState(42),
      heroes: [hero],
      dungeonProgress: createUndercityProgress([hero.id], 10),
      highestFloorReached: 11,
      activeDungeonFloor: 11,
    };
    expect(() => applyDungeonCommand(running, {
      type: "dungeon.resume",
      dungeonId: UNDERCITY_DUNGEON_ID,
    })).toThrow("the expedition is not halted");

    const farmProgress = selectUndercityFarmZone(createUndercityProgress([hero.id], 50), [hero.id], "sewers");
    expect(() => applyDungeonCommand({
      ...running,
      dungeonProgress: farmProgress,
      activeDungeonFloor: 1,
      highestFloorReached: 50,
    }, {
      type: "dungeon.select_floor",
      dungeonId: UNDERCITY_DUNGEON_ID,
      floor: 2,
    })).toThrow("change the farm zone instead");
  });

  it("returns canonical errors for locked or unknown farm zones", () => {
    const hero = makeHero({ id: "farm-errors", isActive: true });
    const locked = {
      ...initialTownState(42),
      heroes: [hero],
      dungeonProgress: createUndercityProgress([hero.id]),
    };
    expect(() => applyDungeonCommand(locked, {
      type: "dungeon.select_farm_zone",
      dungeonId: UNDERCITY_DUNGEON_ID,
      zoneId: "sewers",
    })).toThrowError(expect.objectContaining({ code: "FARM_LOCKED" }));

    expect(() => applyDungeonCommand({
      ...locked,
      dungeonProgress: createUndercityProgress([hero.id], 50),
    }, {
      type: "dungeon.select_farm_zone",
      dungeonId: UNDERCITY_DUNGEON_ID,
      zoneId: "missing-zone",
    })).toThrowError(expect.objectContaining({ code: "ZONE_NOT_FOUND" }));
  });

  it("bases fixed-victory eligibility only on the participants captured at encounter start", () => {
    const progress = createUndercityProgress(["knocked-out", "survivor"], 9);
    const settled = settleUndercityVictory(
      progress,
      ["knocked-out", "survivor"],
      10,
      getDungeonRoomCount(10),
      getDungeonRoomCount(10),
    );

    expect(settled.firstVictoryHeroIds).toEqual(["knocked-out", "survivor"]);
    expect(settled.progress.heroes["knocked-out"]).toMatchObject({
      completedFloor: 10,
      fixedVictoryIds: expect.arrayContaining(["undercity:boss:10"]),
    });
  });

  it("requires a town return before switching farm zones and preserves snapshots through reload", () => {
    const hero = makeHero({ id: "persistent-farmer", isActive: true });
    const completed = createUndercityProgress([hero.id], 50);
    const sewers = selectUndercityFarmZone(completed, [hero.id], "sewers");
    sewers.expedition = { ...sewers.expedition, floor: 7, room: 4 };
    const source = {
      ...initialTownState(42),
      heroes: [hero],
      highestFloorReached: 50,
      activeDungeonFloor: 7,
      activeDungeonRoom: 4,
      dungeonProgress: sewers,
    };
    const beforeRejectedSwitch = structuredClone(source);
    expect(() => applyDungeonCommand(source, {
      type: "dungeon.select_farm_zone",
      dungeonId: UNDERCITY_DUNGEON_ID,
      zoneId: "bastion",
    })).toThrowError(expect.objectContaining({ code: "EXPEDITION_RUNNING" }));
    expect(source).toEqual(beforeRejectedSwitch);

    const returned = applyDungeonCommand(source, {
      type: "dungeon.retreat",
      dungeonId: UNDERCITY_DUNGEON_ID,
    }).state;
    expect(returned.dungeonProgress.expedition).toMatchObject({ phase: "preparing", halted: true });
    expect(returned.heroes[0]).toMatchObject({ isActive: false });
    const prepared = applyTownCommand(returned, {
      type: "hero.activity",
      heroId: hero.id,
      active: true,
    }).state;
    const switched = applyDungeonCommand(prepared, {
      type: "dungeon.select_farm_zone",
      dungeonId: UNDERCITY_DUNGEON_ID,
      zoneId: "bastion",
    }).state;
    expect(switched.dungeonProgress.expedition).toMatchObject({
      mode: "farm",
      zoneId: "bastion",
      floor: 31,
      room: 1,
      halted: false,
    });
    expect(switched.autoExplore).toBe(true);

    const reloadedFarm = migrateTownState(JSON.parse(JSON.stringify(switched)));
    expect(reloadedFarm.dungeonProgress).toEqual(switched.dungeonProgress);
    const stopped = {
      ...switched,
      autoExplore: false,
      dungeonProgress: haltUndercityExpedition(switched.dungeonProgress, "wipe"),
    };
    const reloadedStopped = migrateTownState(JSON.parse(JSON.stringify(stopped)));
    expect(reloadedStopped.dungeonProgress).toEqual(stopped.dungeonProgress);
    expect(reloadedStopped.autoExplore).toBe(false);
  });

  it("forges a signature with its dedicated costs and exact epic modifiers", () => {
    const source = initialTownState(42);
    source.buildings.forge = 7;
    source.itemBlueprints.push({ itemId: "rat_king_fang", unlocked: true });
    source.forgeMaterials = RAT_KING_SIGNATURE_PARAMETERS.recipeCosts.map((cost) => ({ ...cost }));
    const started = applyForgeCommand(source, { type: "forge.start", recipeId: "rat_king_fang", commandId: "signature" }, { next: () => 0.5, nextInt: () => 0, snapshot: () => source.rngState });
    expect(started.state.forgeMaterials).toEqual([]);
    expect(started.state.pendingForge).toMatchObject({ offeredRarity: "epic", itemLevel: 35 });
    const finalized = applyForgeCommand(started.state, { type: "forge.finalize", previewId: "preview-signature" });
    expect(finalized.state.storedItems.at(-1)).toMatchObject({
      itemId: "rat_king_fang",
      rarity: "epic",
      modifiers: RAT_KING_SIGNATURE_FINAL_MODIFIERS.epic.rat_king_fang,
      sourceDungeonId: UNDERCITY_DUNGEON_ID,
      sourceZoneId: "court",
    });
  });

  it("awards four personal boss lots, none on replay, then only the novice lot", () => {
    const room = getDungeonRoomCount(10);
    const heroIds = ["a", "b", "c", "d"];
    const heroes = heroIds.map(rewardHero);
    const progress = createUndercityProgress(heroIds, 9);
    progress.expedition = { ...progress.expedition, floor: 10, room };
    const source = {
      ...initialTownState(42),
      heroes,
      activeDungeonFloor: 10,
      activeDungeonRoom: room,
      highestFloorReached: 10,
      dungeonProgress: progress,
    };
    const started = applyDungeonCommand(source, { type: "dungeon.explore", floor: 10, commandId: "four-lots" });
    const first = applyDungeonCommand({
      ...started.state,
      heroes: started.state.heroes.map((hero) => hero.id === "a"
        ? { ...hero, currentHp: 0, isActive: false, status: "resting" as const }
        : hero),
    }, { type: "dungeon.resolve" }, zeroRng());
    const firstEncounter = first.state.encounterHistory.at(-1)!;
    expect(firstEncounter.transcript.filter((event) => event.type === "reward.personal_first")).toHaveLength(4);
    expect(firstEncounter.transcript.filter((event) => event.type === "reward.personal_first_item")).toHaveLength(4);
    expect(firstEncounter.transcript).toContainEqual(expect.objectContaining({ type: "reward.personal_first", heroId: "a" }));
    expect(firstEncounter.transcript).toContainEqual(expect.objectContaining({ type: "reward.personal_first_item", heroId: "a" }));
    expect(first.state.heroes.find((hero) => hero.id === "a")?.xp).toBeGreaterThan(heroes[0].xp);

    const replaySource = {
      ...first.state,
      activeDungeonFloor: 10,
      activeDungeonRoom: room,
      dungeonProgress: {
        ...first.state.dungeonProgress,
        expedition: {
          ...first.state.dungeonProgress.expedition,
          floor: 10,
          room,
          phase: "preparing" as const,
          segmentHeroIds: [],
          knockedOutHeroIds: [],
          checkpointFloor: null,
          autoExploreBeforeCheckpoint: false,
        },
      },
    };
    const replayStarted = applyDungeonCommand(replaySource, { type: "dungeon.explore", floor: 10, commandId: "four-lots-replay" });
    const replay = applyDungeonCommand(replayStarted.state, { type: "dungeon.resolve" }, zeroRng());
    expect(replay.state.encounterHistory.at(-1)!.transcript.filter((event) => event.type === "reward.personal_first")).toHaveLength(0);

    const mixedProgress = createUndercityProgress(heroIds, 10);
    mixedProgress.heroes.d = createUndercityProgress(["d"], 9).heroes.d;
    mixedProgress.expedition = { ...mixedProgress.expedition, floor: 10, room };
    const mixedSource = {
      ...initialTownState(84),
      heroes,
      activeDungeonFloor: 10,
      activeDungeonRoom: room,
      highestFloorReached: 11,
      dungeonProgress: mixedProgress,
    };
    const mixedStarted = applyDungeonCommand(mixedSource, { type: "dungeon.explore", floor: 10, commandId: "novice-lot" });
    const mixed = applyDungeonCommand(mixedStarted.state, { type: "dungeon.resolve" }, zeroRng());
    expect(mixed.state.encounterHistory.at(-1)!.transcript.filter((event) => event.type === "reward.personal_first")).toHaveLength(1);
    expect(mixed.state.encounterHistory.at(-1)!.transcript.find((event) => event.type === "reward.personal_first")?.heroId).toBe("d");
  });

  it("awards personal boss loot and the Rat King's repeatable table in the canonical resolver", () => {
    const hero = makeHero({
      id: "king-slayer",
      isActive: true,
      currentHp: 1_000_000,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 1_000_000,
        hp: 1_000_000,
        physicalDamage: 1_000_000,
      },
    });
    expect(validateAuthoritativeHero(hero)).toEqual([]);
    const room = getDungeonRoomCount(50);
    const progress = createUndercityProgress([hero.id], 49);
    progress.expedition.floor = 50;
    progress.expedition.room = room;
    const source = {
      ...initialTownState(42),
      heroes: [hero],
      activeDungeonFloor: 50,
      activeDungeonRoom: room,
      highestFloorReached: 50,
      dungeonProgress: progress,
      autoExplore: true,
    };
    const started = applyDungeonCommand(source, { type: "dungeon.explore", dungeonId: UNDERCITY_DUNGEON_ID, floor: 50, commandId: "king" });
    const resolved = applyDungeonCommand(started.state, { type: "dungeon.resolve", dungeonId: UNDERCITY_DUNGEON_ID }, zeroRng());
    expect(resolved.state.dungeonProgress.heroes[hero.id]).toMatchObject({ completedFloor: 50 });
    expect(resolved.state).toMatchObject({ activeDungeonFloor: 50, highestFloorReached: 50 });
    expect(resolved.state.autoExplore).toBe(false);
    expect(resolved.state.dungeonProgress.heroes[hero.id].fixedVictoryIds).toContain("undercity:boss:50");
    expect(resolved.state.forgeMaterials).toContainEqual(expect.objectContaining({ materialId: RAT_KING_MARK_ID, count: 1 }));
    expect(resolved.state.itemBlueprints.some((entry) => RAT_KING_SIGNATURE_IDS.includes(entry.itemId as typeof RAT_KING_SIGNATURE_IDS[number]))).toBe(true);
    expect(resolved.state.storedItems.some((item) => RAT_KING_SIGNATURE_IDS.includes(item.itemId as typeof RAT_KING_SIGNATURE_IDS[number]))).toBe(true);
    expect(resolved.state.storedItems.some((item) => (
      item.sourceDungeonId === UNDERCITY_DUNGEON_ID
      && item.sourceZoneId === "court"
      && !RAT_KING_SIGNATURE_IDS.includes(item.itemId as typeof RAT_KING_SIGNATURE_IDS[number])
      && (item.modifiers?.length ?? 0) > 0
    ))).toBe(true);
    const encounter = resolved.state.encounterHistory.at(-1)!;
    expect(encounter.enemies).toHaveLength(3);
    expect(encounter.transcript.filter((event) => event.type === "reward.personal_first")).toHaveLength(1);
    expect(encounter.transcript.filter((event) => event.type === "reward.personal_first_item")).toHaveLength(1);
    expect(encounter.transcript.filter((event) => event.type === "dungeon.floor_completed")).toHaveLength(1);
    expect(() => applyDungeonCommand(resolved.state, {
      type: "dungeon.explore",
      dungeonId: UNDERCITY_DUNGEON_ID,
      floor: 50,
      commandId: "king-again-without-farm",
    })).toThrow("resolve the checkpoint decision first");

    expect(() => applyDungeonCommand(resolved.state, {
      type: "dungeon.select_farm_zone",
      dungeonId: UNDERCITY_DUNGEON_ID,
      zoneId: "court",
    })).toThrow("resolve the checkpoint decision first");
    const returned = applyDungeonCommand(resolved.state, {
      type: "dungeon.checkpoint_decide",
      decision: "return_to_town",
    }).state;
    const selectedFarm = applyDungeonCommand({
      ...returned,
      heroes: returned.heroes.map((entry) => entry.id === hero.id
        ? { ...entry, isActive: true, status: "idle" as const }
        : entry),
    }, {
      type: "dungeon.select_farm_zone",
      dungeonId: UNDERCITY_DUNGEON_ID,
      zoneId: "court",
    }).state;
    expect(selectedFarm.autoExplore).toBe(true);
    const farmRoom = getDungeonRoomCount(50);
    const farmAtKing = {
      ...selectedFarm,
      activeDungeonFloor: 50,
      activeDungeonRoom: farmRoom,
      dungeonProgress: {
        ...selectedFarm.dungeonProgress,
        expedition: { ...selectedFarm.dungeonProgress.expedition, floor: 50, room: farmRoom },
      },
    };
    const repeatedStarted = applyDungeonCommand(farmAtKing, {
      type: "dungeon.explore",
      dungeonId: UNDERCITY_DUNGEON_ID,
      floor: 50,
      commandId: "king-farm",
    });
    const repeated = applyDungeonCommand(repeatedStarted.state, {
      type: "dungeon.resolve",
      dungeonId: UNDERCITY_DUNGEON_ID,
    }, zeroRng());
    const repeatedEncounter = repeated.state.encounterHistory.at(-1)!;
    expect(repeatedEncounter.transcript.filter((event) => event.type === "dungeon.floor_completed")).toHaveLength(0);
    expect(repeatedEncounter.transcript.filter((event) => event.type === "reward.personal_first")).toHaveLength(0);
  });
});
