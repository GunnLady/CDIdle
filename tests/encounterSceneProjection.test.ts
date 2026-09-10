import { describe, expect, it } from "vitest";
import type { CanonicalDungeonEncounterRecord } from "../shared/contracts/authoritative";
import {
  applyEncounterSceneStep,
  completeEncounterSceneState,
  createEncounterSceneInitialState,
  createEncounterSceneTimeline,
  projectEncounterScene,
} from "../src/domain/encounterSceneProjection";

const modernFight = {
  encounterId: "projection-modern",
  kind: "fight",
  floor: 1,
  room: 1,
  outcome: "victory",
  roundCount: 1,
  enemy: { id: "pack", name: "Meute", hp: 0, maxHp: 32 },
  enemies: [
    { id: "enemy-a", name: "Rat des canaux", hp: 0, maxHp: 16 },
    { id: "enemy-b", name: "Rat galeux", hp: 0, maxHp: 16 },
  ],
  initialActors: {
    v: 1,
    h: [
      ["hero-a", "Guerrier_Female_1", 30, 40, 10, 20, 0],
      ["retired-hero", "Mage_Male_2", 12, 35, 5, 15, 0],
    ],
    b: "rat-pack",
    e: [["a", 16, 16], ["b", 16, 16]],
  },
  transcript: [
    {
      sequence: 0,
      type: "encounter.started",
      message: "La meute approche.",
      monsterId: "enemy-a",
      monsterName: "Rat des canaux",
      enemyHp: 16,
      enemyMaxHp: 16,
    },
    {
      sequence: 1,
      type: "hero.hit",
      message: "Ariane frappe.",
      round: 1,
      heroId: "hero-a",
      heroName: "Ariane",
      monsterId: "enemy-a",
      damage: 6,
      enemyHp: 10,
      enemyMaxHp: 16,
      strike: 1,
      strikeCount: 2,
    },
    {
      sequence: 2,
      type: "hero.hit.critical",
      message: "Ariane achève sa cible.",
      round: 1,
      heroId: "hero-a",
      heroName: "Ariane",
      monsterId: "enemy-a",
      damage: 20,
      enemyHp: 0,
      enemyMaxHp: 16,
      strike: 2,
      strikeCount: 2,
    },
    {
      sequence: 3,
      type: "hero.defeated",
      message: "Le second rat met un héros KO.",
      round: 1,
      heroId: "retired-hero",
      monsterId: "enemy-b",
      monsterName: "Rat galeux",
      damage: 15,
      heroHpBefore: 12,
      heroHp: 0,
      heroMaxHp: 35,
      strike: 1,
      strikeCount: 1,
    },
    { sequence: 4, type: "encounter.victory", message: "Victoire." },
  ],
  rewards: { gold: 3, loot: [] },
} satisfies CanonicalDungeonEncounterRecord;

function actorBySource(
  actors: ReturnType<typeof createEncounterSceneInitialState>["actors"],
  sourceId: string,
) {
  const actor = actors.find((candidate) => candidate.sourceId === sourceId);
  if (!actor) throw new Error(`Missing actor ${sourceId}`);
  return actor;
}

describe("encounter scene projection", () => {
  it("keeps historical actors and groups ordered impacts under stable identifiers", () => {
    const first = createEncounterSceneTimeline(modernFight, new Map([["hero-a", "Ariane"]]));
    const second = createEncounterSceneTimeline(modernFight, new Map([["hero-a", "Ariane"]]));

    expect(second).toEqual(first);
    expect(first.steps).toHaveLength(modernFight.transcript.length);
    expect(first.steps[1].actionId).toBe(first.steps[2].actionId);
    expect(first.steps[1].id).toBe("projection-modern:event:1:1");
    expect(first.steps[2].impacts[0].id).toBe("projection-modern:event:2:2:impact:0");
    expect(first.steps[2].impacts[0]).toMatchObject({
      kind: "defeat",
      announcedValue: 20,
      appliedValue: 10,
      hp: { before: 10, after: 0, maximum: 16 },
    });

    const retired = actorBySource(first.actors, "retired-hero");
    expect(retired).toMatchObject({
      name: "Héros 2",
      visualKey: "Mage_Male_2",
      currentHp: 12,
      maximumHp: 35,
    });
    expect(first.steps[3]).toMatchObject({
      sourceActorId: actorBySource(first.actors, "enemy-b").id,
      targetActorIds: [retired.id],
      projection: "structured",
    });
  });

  it("produces the same state by direct projection and sequential application", () => {
    const encounterBeforeProjection = structuredClone(modernFight);
    const timeline = createEncounterSceneTimeline(modernFight, new Map([["hero-a", "Ariane"]]));
    let sequential = createEncounterSceneInitialState(timeline);

    expect(projectEncounterScene(timeline, { visibleCount: 0, complete: false })).toEqual(sequential);
    for (const [index, step] of timeline.steps.entries()) {
      sequential = applyEncounterSceneStep(sequential, step);
      expect(projectEncounterScene(timeline, { visibleCount: index + 1, complete: false })).toEqual(sequential);
    }

    const completedSequentially = completeEncounterSceneState(timeline, sequential);
    expect(projectEncounterScene(timeline, { visibleCount: 2, complete: true })).toEqual(completedSequentially);
    expect(completedSequentially).toMatchObject({ complete: true, result: "victory" });
    expect(actorBySource(completedSequentially.actors, "retired-hero")).toMatchObject({
      currentHp: 0,
      knockedOut: true,
    });
    expect(modernFight).toEqual(encounterBeforeProjection);
  });

  it("keeps legacy and unknown records useful without inventing missing health", () => {
    const legacy = {
      encounterId: "projection-legacy",
      kind: "fight",
      floor: 2,
      room: 3,
      outcome: "victory",
      roundCount: 1,
      enemy: { id: "legacy-enemy", name: "Ennemi ancien", hp: 0, maxHp: 12 },
      transcript: [
        { sequence: 7, type: "future.unmapped", message: "Trace future conservée." },
        {
          sequence: 8,
          type: "hero.hit",
          heroId: "removed-from-roster",
          monsterId: "legacy-enemy",
          damage: 20,
          enemyHp: 0,
          enemyMaxHp: 12,
        },
      ],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    const timeline = createEncounterSceneTimeline(legacy);
    const initial = createEncounterSceneInitialState(timeline);

    expect(timeline.limitations).toEqual(["initial-actors-unavailable"]);
    expect(timeline.steps[0]).toMatchObject({
      summary: "Trace future conservée.",
      projection: "summary",
      impacts: [],
    });
    expect(actorBySource(initial.actors, "legacy-enemy").currentHp).toBeNull();
    expect(actorBySource(initial.actors, "removed-from-roster")).toMatchObject({
      name: "Héros 1",
      currentHp: null,
      maximumHp: null,
    });

    const afterUnknown = projectEncounterScene(timeline, { visibleCount: 1, complete: false });
    expect(actorBySource(afterUnknown.actors, "legacy-enemy").currentHp).toBeNull();
    const afterHit = projectEncounterScene(timeline, { visibleCount: 2, complete: false });
    expect(actorBySource(afterHit.actors, "legacy-enemy").currentHp).toBe(0);
    expect(timeline.steps[1].impacts[0]).toMatchObject({
      announcedValue: 20,
      appliedValue: null,
      hp: { before: null, after: 0, maximum: 12 },
    });
  });

  it("projects already-structured group consequences without parsing their messages", () => {
    const consequence = {
      encounterId: "projection-consequence",
      kind: "rest",
      floor: 4,
      room: 2,
      outcome: "victory",
      roundCount: 0,
      enemy: null,
      initialActors: {
        v: 1,
        h: [
          ["hero-a", "Guerrier_Female_1", 20, 40, 5, 20, 0],
          ["hero-b", "Mage_Male_2", 0, 30, 0, 15, 1],
        ],
        e: [],
      },
      transcript: [{
        sequence: 0,
        type: "party.restored",
        heroes: [
          { heroId: "hero-a", hpBefore: 20, hpAfter: 28, manaBefore: 5, manaAfter: 9 },
          { heroId: "hero-b", hpBefore: 0, hpAfter: 6, manaBefore: 0, manaAfter: 3 },
        ],
      }],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    const timeline = createEncounterSceneTimeline(consequence);
    const projected = projectEncounterScene(timeline, { visibleCount: 1, complete: false });

    expect(timeline.steps[0]).toMatchObject({ projection: "structured", result: "victory" });
    expect(timeline.steps[0].impacts).toHaveLength(2);
    expect(timeline.steps[0].impacts[1]).toMatchObject({
      kind: "recovery",
      appliedValue: 6,
      hp: { before: 0, after: 6, maximum: 30 },
      mana: { before: 0, after: 3, maximum: 15 },
      knockedOutAfter: false,
    });
    expect(actorBySource(projected.actors, "hero-b")).toMatchObject({
      currentHp: 6,
      currentMana: 3,
      knockedOut: false,
    });
  });

  it("applies explicit challenge consequences to every affected hero", () => {
    const challenge = {
      encounterId: "projection-challenge-consequence",
      kind: "trap",
      floor: 6,
      room: 2,
      outcome: "defeat",
      roundCount: 0,
      enemy: null,
      initialActors: {
        v: 1,
        h: [
          ["hero-a", "Guerrier_Female_1", 40, 40, 10, 20, 0],
          ["hero-b", "Mage_Male_2", 30, 30, 15, 15, 0],
        ],
        e: [],
      },
      transcript: [{
        sequence: 0,
        type: "challenge.trap.consequence",
        message: "Conséquence canonique.",
        heroChanges: [
          { heroId: "hero-a", hpBefore: 40, hpAfter: 38, manaBefore: 10, manaAfter: 10 },
          { heroId: "hero-b", hpBefore: 30, hpAfter: 28, manaBefore: 15, manaAfter: 15 },
        ],
      }],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    const timeline = createEncounterSceneTimeline(challenge);
    const projected = projectEncounterScene(timeline, { visibleCount: 1, complete: false });

    expect(timeline.steps[0].impacts).toEqual([
      expect.objectContaining({ kind: "damage", appliedValue: 2 }),
      expect.objectContaining({ kind: "damage", appliedValue: 2 }),
    ]);
    expect(actorBySource(projected.actors, "hero-a").currentHp).toBe(38);
    expect(actorBySource(projected.actors, "hero-b").currentHp).toBe(28);
  });

  it("does not add playback steps for filtered intent metadata", () => {
    const record = {
      ...modernFight,
      encounterId: "projection-intent-filter",
      transcript: [
        { sequence: 0, type: "enemy.intent", monsterId: "enemy-a", intent: "attack" },
        modernFight.transcript[1],
      ],
    } satisfies CanonicalDungeonEncounterRecord;

    const timeline = createEncounterSceneTimeline(record);
    expect(timeline.steps).toHaveLength(1);
    expect(timeline.steps[0].type).toBe("hero.hit");
  });

  it("handles an empty historical record without throwing", () => {
    const empty = {
      encounterId: "projection-empty",
      kind: "trap",
      floor: 1,
      room: 1,
      outcome: "defeat",
      roundCount: 0,
      enemy: null,
      transcript: [],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;

    expect(projectEncounterScene(createEncounterSceneTimeline(empty))).toMatchObject({
      encounterId: "projection-empty",
      visibleCount: 0,
      complete: true,
      actors: [],
      activeStep: null,
      result: "defeat",
      limitations: ["initial-actors-unavailable"],
    });
  });
});
