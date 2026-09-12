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

  it("switches the Rat King visual on the first visible action after his monstrous intent", () => {
    const encounter = {
      ...modernFight,
      encounterId: "rat-king-phase-two",
      enemy: { id: "rat-king", name: "Roi des Rats", hp: 80, maxHp: 120, isBoss: true },
      enemies: [
        { id: "king-guard-a", name: "Senestre", hp: 0, maxHp: 20, role: "guard" },
        { id: "king-guard-b", name: "Dextre", hp: 0, maxHp: 20, role: "guard" },
        { id: "king", name: "Roi des Rats", hp: 80, maxHp: 80, role: "king", isBoss: true },
      ],
      initialActors: {
        ...modernFight.initialActors,
        b: "rat-king",
        e: [["a", 20, 20], ["b", 20, 20], ["c", 80, 80]],
      },
      transcript: [
        { sequence: 0, type: "encounter.started", message: "Le Roi commande." },
        {
          sequence: 1,
          type: "enemy.intent",
          round: 2,
          monsterId: "king",
          monsterName: "Roi des Rats",
          intent: "Assaut monstrueux",
        },
        {
          sequence: 2,
          type: "enemy.hit",
          round: 2,
          monsterId: "king",
          monsterName: "Roi des Rats",
          targetHeroId: "hero-a",
          damage: 4,
          heroHpBefore: 30,
          heroHp: 26,
          heroMaxHp: 40,
        },
      ],
    } satisfies CanonicalDungeonEncounterRecord;
    const timeline = createEncounterSceneTimeline(encounter);
    const king = actorBySource(timeline.actors, "king");

    expect(timeline.steps).toHaveLength(2);
    expect(timeline.steps[0].visualVariantChanges).toEqual([]);
    expect(timeline.steps[1].visualVariantChanges).toEqual([
      { actorId: king.id, variant: "monstrous" },
    ]);
    expect(actorBySource(projectEncounterScene(timeline, { visibleCount: 1, complete: false }).actors, "king").visualVariant)
      .toBeNull();
    expect(actorBySource(projectEncounterScene(timeline, { visibleCount: 2, complete: false }).actors, "king").visualVariant)
      .toBe("monstrous");
  });

  it("projects ordered skill impacts and source mana without conflating announced and applied values", () => {
    const enriched = {
      ...modernFight,
      encounterId: "projection-resources",
      transcript: [{
        sequence: 0,
        type: "hero.skill.damage",
        round: 1,
        heroId: "hero-a",
        heroName: "Ariane",
        monsterId: "enemy-a",
        monsterName: "Rat des canaux",
        enemyHp: 0,
        enemyMaxHp: 16,
        damage: 30,
        announcedDamage: 30,
        sourceMana: [10, 4, 20],
        targets: ["e", 0, 1],
        hitResults: [
          { hit: 1, critical: false, damage: 10 },
          { hit: 2, critical: true, damage: 20 },
        ],
      }],
    } satisfies CanonicalDungeonEncounterRecord;
    const timeline = createEncounterSceneTimeline(enriched, new Map([["hero-a", "Ariane"]]));
    const projected = projectEncounterScene(timeline, { visibleCount: 1, complete: false });

    expect(timeline.steps[0].impacts).toMatchObject([
      { kind: "damage", announcedValue: 10, appliedValue: 10, hp: { before: 16, after: 6, maximum: 16 } },
      { kind: "defeat", announcedValue: 20, appliedValue: 6, hp: { before: 6, after: 0, maximum: 16 } },
      { kind: "resource", announcedValue: 6, appliedValue: 6, mana: { before: 10, after: 4, maximum: 20 } },
    ]);
    expect(timeline.steps[0].targetActorIds).toEqual([
      actorBySource(timeline.actors, "enemy-a").id,
      actorBySource(timeline.actors, "enemy-b").id,
    ]);
    expect(actorBySource(projected.actors, "enemy-a")).toMatchObject({ currentHp: 0, knockedOut: true });
    expect(actorBySource(projected.actors, "hero-a")).toMatchObject({ currentMana: 4, maximumMana: 20 });

    let sequential = createEncounterSceneInitialState(timeline);
    sequential = applyEncounterSceneStep(sequential, timeline.steps[0]);
    expect(sequential).toEqual(projected);
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

  it("projects exact treasure contents and party gold changes from structured fields", () => {
    const treasure = {
      encounterId: "projection-treasure",
      kind: "treasure",
      floor: 3,
      room: 2,
      outcome: "victory",
      roundCount: 0,
      enemy: null,
      initialActors: {
        v: 1,
        h: [["hero-a", "Guerrier_Female_1", 40, 40, 10, 20, 0]],
        e: [],
      },
      transcript: [
        { sequence: 0, type: "reward.gold", gold: 12 },
        { sequence: 1, type: "reward.material", materialId: "metal_scrap", name: "Métal", rarity: "common", count: 2 },
      ],
      rewards: {
        gold: 12,
        loot: [{ type: "material", materialId: "metal_scrap", name: "Métal", rarity: "common", count: 2 }],
      },
    } satisfies CanonicalDungeonEncounterRecord;
    const timeline = createEncounterSceneTimeline(treasure);
    const afterGold = projectEncounterScene(timeline, { visibleCount: 1, complete: false });
    const completed = projectEncounterScene(timeline);

    expect(timeline.steps[0]).toMatchObject({
      projection: "structured",
      rewards: [{ kind: "gold", amount: 12 }],
    });
    expect(afterGold.rewards).toMatchObject([{ kind: "gold", amount: 12 }]);
    expect(completed.rewards).toMatchObject([
      { kind: "gold", amount: 12 },
      { kind: "material", amount: 2, contentId: "metal_scrap", name: "Métal", rarity: "common" },
    ]);

    const negotiation = {
      ...treasure,
      encounterId: "projection-gold-loss",
      kind: "negotiation",
      outcome: "defeat",
      transcript: [{ sequence: 0, type: "challenge.negotiation.consequence", goldLost: 7 }],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    expect(createEncounterSceneTimeline(negotiation).steps[0].rewards).toEqual([
      expect.objectContaining({ kind: "gold-loss", amount: 7 }),
    ]);

    const bossMaterial = {
      ...treasure,
      encounterId: "projection-boss-material",
      kind: "fight",
      transcript: [{
        sequence: 0,
        type: "reward.rat_king_mark",
        materialId: "rat_king_mark",
        name: "Marque du Roi",
        rarity: "epic",
        count: 2,
      }],
    } satisfies CanonicalDungeonEncounterRecord;
    expect(createEncounterSceneTimeline(bossMaterial).steps[0].rewards).toEqual([
      expect.objectContaining({ kind: "material", contentId: "rat_king_mark", amount: 2 }),
    ]);

    const empty = {
      ...treasure,
      encounterId: "projection-empty-treasure",
      transcript: [{ sequence: 0, type: "reward.item.none" }],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    expect(projectEncounterScene(createEncounterSceneTimeline(empty)).rewards).toEqual([
      expect.objectContaining({ kind: "empty", amount: 0 }),
    ]);
  });

  it("projects an enemy support heal onto its explicit target", () => {
    const support = {
      ...modernFight,
      encounterId: "projection-enemy-support",
      initialActors: {
        ...modernFight.initialActors,
        e: [["a", 16, 16], ["b", 5, 16]],
      },
      transcript: [{
        sequence: 0,
        type: "enemy.support",
        monsterId: "enemy-a",
        targetMonsterId: "enemy-b",
        healing: 3,
        enemyHp: 8,
        enemyMaxHp: 16,
      }],
    } satisfies CanonicalDungeonEncounterRecord;
    const timeline = createEncounterSceneTimeline(support);

    expect(timeline.steps[0]).toMatchObject({
      sourceActorId: actorBySource(timeline.actors, "enemy-a").id,
      targetActorIds: [actorBySource(timeline.actors, "enemy-b").id],
      impacts: [{
        kind: "healing",
        announcedValue: 3,
        appliedValue: 3,
        hp: { before: 5, after: 8, maximum: 16 },
      }],
    });
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
