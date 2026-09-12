import { describe, expect, it } from "vitest";
import { UNDERCITY_ZONES } from "../shared/domain/undercity";
import {
  DUNGEON_COMBAT_EFFECT_LIMIT,
  createDungeonCombatSceneView,
} from "../src/domain/dungeonCombatScene";
import type {
  EncounterSceneActor,
  EncounterSceneImpact,
  EncounterSceneState,
  EncounterSceneStep,
  EncounterSceneTeam,
} from "../src/domain/encounterSceneProjection";

function actor(
  id: string,
  team: EncounterSceneTeam,
  slot: number,
  overrides: Partial<EncounterSceneActor> = {},
): EncounterSceneActor {
  return {
    id,
    sourceId: id,
    team,
    slot,
    name: id,
    visualKey: team === "heroes" ? "Guerrier_Female_1" : null,
    contentKey: team === "enemies" ? `rat-pack:${String.fromCharCode(97 + slot)}` : null,
    visualVariant: null,
    currentHp: 20,
    maximumHp: 20,
    currentMana: team === "heroes" ? 5 : null,
    maximumMana: team === "heroes" ? 10 : null,
    knockedOut: false,
    ...overrides,
  };
}

function impact(
  id: string,
  targetActorId: string,
  overrides: Partial<EncounterSceneImpact> = {},
): EncounterSceneImpact {
  return {
    id,
    kind: "damage",
    sourceActorId: "hero-0",
    targetActorId,
    announcedValue: 12,
    appliedValue: 10,
    hp: { before: 10, after: 0, maximum: 20 },
    mana: null,
    knockedOutAfter: true,
    ...overrides,
  };
}

function step(overrides: Partial<EncounterSceneStep> = {}): EncounterSceneStep {
  return {
    id: "step-1",
    actionId: "action-1",
    index: 0,
    sequence: 1,
    round: 1,
    type: "hero.hit",
    category: "combat-hero",
    summary: "Le héros frappe.",
    sourceActorId: "hero-0",
    targetActorIds: ["enemy-0"],
    impacts: [impact("impact-1", "enemy-0")],
    visualVariantChanges: [],
    rewards: [],
    projection: "structured",
    result: null,
    ...overrides,
  };
}

function scene(overrides: Partial<EncounterSceneState> = {}): EncounterSceneState {
  return {
    encounterId: "combat-scene",
    visibleCount: 1,
    complete: false,
    actors: [
      actor("hero-0", "heroes", 0),
      actor("hero-1", "heroes", 1, { visualKey: "Mage_Male_2" }),
      actor("hero-2", "heroes", 2, { visualKey: "Archer_Female_1" }),
      actor("hero-3", "heroes", 3, { visualKey: "Acolyte_Male_1" }),
      actor("enemy-0", "enemies", 0),
      actor("enemy-1", "enemies", 1),
      actor("enemy-2", "enemies", 2),
    ],
    activeStep: step(),
    result: null,
    rewards: [],
    limitations: [],
    ...overrides,
  };
}

describe("dungeon combat scene presentation", () => {
  it("uses the approved CDIdle formation and depth scale for four heroes and three enemies", () => {
    const state = scene({
      actors: [
        ...scene().actors,
        actor("hero-hidden", "heroes", 4),
        actor("enemy-hidden", "enemies", 3),
      ],
    });

    const view = createDungeonCombatSceneView(state, [
      { id: "enemy-0", role: "Combattant" },
      { id: "enemy-1", role: "Protecteur" },
    ]);

    expect(view.actors).toHaveLength(7);
    expect(new Set(view.actors.map((entry) => entry.idleDurationMs)).size).toBeGreaterThan(1);
    expect(new Set(view.actors.map((entry) => entry.idleDelayMs)).size).toBeGreaterThan(1);
    expect(view.actors.some((entry) => entry.id === "hero-hidden" || entry.id === "enemy-hidden")).toBe(false);
    expect(view.actors.map((entry) => entry.standard)).toMatchObject([
      { xPercent: 35, yPercent: 70 },
      { xPercent: 26, yPercent: 52 },
      { xPercent: 9, yPercent: 60 },
      { xPercent: 18, yPercent: 82 },
      { xPercent: 69, yPercent: 74 },
      { xPercent: 79, yPercent: 64 },
      { xPercent: 87, yPercent: 83 },
    ]);
    expect(view.actors[1].standard.scale).toBeLessThan(view.actors[3].standard.scale);
    expect(view.actors[4]).toMatchObject({ visualKey: "undercity:rat-pack:a", role: "Combattant" });
    expect(view.environment).toBe("sewers");
  });

  it("selects the canonical environment for every UnderCity blueprint", () => {
    for (const zone of UNDERCITY_ZONES) {
      for (const blueprint of [...zone.encounters, zone.elite, zone.boss]) {
        const memberKey = blueprint.members[0].key;
        const view = createDungeonCombatSceneView(scene({
          actors: [
            actor("hero-0", "heroes", 0),
            actor("enemy-0", "enemies", 0, { contentKey: `${blueprint.id}:${memberKey}` }),
          ],
        }));
        expect(view.environment).toBe(zone.id);
        expect(view.actors[1].visualKey).toBe(`undercity:${blueprint.id}:${memberKey}`);
      }
    }
  });

  it("selects the phase-two visual without changing the Rat King content identity", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("rat-king", "enemies", 0, {
          contentKey: "rat-king:c",
          visualVariant: "monstrous",
        }),
      ],
    }));

    expect(view.environment).toBe("court");
    expect(view.actors[1].visualKey).toBe("undercity:rat-king:c:monstrous");
  });

  it("derives the environment from enemies rather than colliding hero content keys", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0, { contentKey: "rat-pack:a" }),
        actor("enemy-0", "enemies", 0, { contentKey: "water-parasites:a" }),
      ],
    }));
    expect(view.environment).toBe("cisterns");
  });

  it("moves the second hero onto the smugglers gallery floor on desktop only", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("hero-1", "heroes", 1),
        actor("hero-2", "heroes", 2),
        actor("enemy-0", "enemies", 0, { contentKey: "goblin-scavengers:a" }),
      ],
    }));

    expect(view.environment).toBe("smugglers");
    expect(view.actors[0]?.standard.yPercent).toBe(72);
    expect(view.actors[0]?.zoomed.yPercent).toBe(76);
    expect(view.actors[1]?.standard.yPercent).toBe(60);
    expect(view.actors[1]?.zoomed.yPercent).toBe(83);
    expect(view.actors[2]?.standard.yPercent).toBe(62);
    expect(view.actors[2]?.zoomed.yPercent).toBe(76);
  });

  it("spreads the water-parasite encounter across the cistern quay on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("hero-1", "heroes", 1),
        actor("hero-2", "heroes", 2),
        actor("hero-3", "heroes", 3),
        actor("enemy-0", "enemies", 0, { contentKey: "water-parasites:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "water-parasites:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "water-parasites:c" }),
      ],
    }));

    expect(view.environment).toBe("cisterns");
    expect(view.actors.map((actorView) => actorView.standard)).toEqual([
      expect.objectContaining({ xPercent: 36, yPercent: 75 }),
      expect.objectContaining({ xPercent: 27, yPercent: 64 }),
      expect.objectContaining({ xPercent: 10, yPercent: 70 }),
      expect.objectContaining({ xPercent: 19, yPercent: 84 }),
      expect.objectContaining({ xPercent: 68, yPercent: 76 }),
      expect.objectContaining({ xPercent: 80, yPercent: 69 }),
      expect.objectContaining({ xPercent: 92, yPercent: 84 }),
    ]);
    expect(view.actors[1]?.zoomed).toEqual(expect.objectContaining({ xPercent: 38, yPercent: 83 }));
    expect(view.actors[5]?.zoomed).toEqual(expect.objectContaining({ xPercent: 47, yPercent: 52 }));
  });

  it("lowers the reservoir slime four percent on the cistern quay", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "reservoir-slime:a" }),
      ],
    }));

    expect(view.environment).toBe("cisterns");
    expect(view.actors[1]?.standard).toEqual(expect.objectContaining({ xPercent: 69, yPercent: 78 }));
    expect(view.actors[1]?.zoomed).toEqual(expect.objectContaining({ xPercent: 22, yPercent: 55 }));
  });

  it("aligns the drowned refuge warden with the reservoir slime on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "refuge-warden:a" }),
      ],
    }));

    expect(view.environment).toBe("cisterns");
    expect(view.actors[1]?.standard).toEqual(expect.objectContaining({ xPercent: 69, yPercent: 78 }));
    expect(view.actors[1]?.zoomed).toEqual(expect.objectContaining({ xPercent: 22, yPercent: 55 }));
  });

  it("stages the cistern leeches as a grounded desktop pair", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "cistern-leeches:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "cistern-leeches:b" }),
      ],
    }));

    expect(view.environment).toBe("cisterns");
    expect(view.actors[1]?.standard).toEqual(expect.objectContaining({ xPercent: 68, yPercent: 78 }));
    expect(view.actors[2]?.standard).toEqual(expect.objectContaining({ xPercent: 79, yPercent: 74 }));
    expect(view.actors[1]?.zoomed).toEqual(expect.objectContaining({ xPercent: 22, yPercent: 55 }));
    expect(view.actors[2]?.zoomed).toEqual(expect.objectContaining({ xPercent: 47, yPercent: 52 }));
  });

  it("grounds the valve sentinel and its crab on the cistern quay", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "valve-sentinel:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "valve-sentinel:b" }),
      ],
    }));

    expect(view.environment).toBe("cisterns");
    expect(view.actors[1]?.standard).toEqual(expect.objectContaining({ xPercent: 69, yPercent: 77 }));
    expect(view.actors[2]?.standard).toEqual(expect.objectContaining({ xPercent: 81, yPercent: 69 }));
    expect(view.actors[1]?.zoomed).toEqual(expect.objectContaining({ xPercent: 22, yPercent: 55 }));
    expect(view.actors[2]?.zoomed).toEqual(expect.objectContaining({ xPercent: 47, yPercent: 52 }));
  });

  it("lowers the dead-water warden two percent on the cistern quay", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "dead-water-warden:a" }),
      ],
    }));

    expect(view.environment).toBe("cisterns");
    expect(view.actors[1]?.standard).toEqual(expect.objectContaining({ xPercent: 69, yPercent: 76 }));
    expect(view.actors[1]?.zoomed).toEqual(expect.objectContaining({ xPercent: 22, yPercent: 55 }));
  });

  it("moves only the colossal rat five percent to the right", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "colossal-rat:a" }),
      ],
    }));

    expect(view.actors[0]?.standard.xPercent).toBe(35);
    expect(view.actors[1]?.standard.xPercent).toBe(74);
    expect(view.actors[1]?.zoomed.xPercent).toBe(27);
  });

  it("aligns the solo pipe slime with the colossal rat position", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "pipe-slime:a" }),
      ],
    }));

    expect(view.actors[0]?.standard.xPercent).toBe(35);
    expect(view.actors[1]?.standard.xPercent).toBe(74);
    expect(view.actors[1]?.zoomed.xPercent).toBe(27);
  });

  it("moves only the hound four percent left on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "hound-handler:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "hound-handler:b" }),
      ],
    }));

    expect(view.actors[1]?.standard.xPercent).toBe(65);
    expect(view.actors[1]?.zoomed.xPercent).toBe(22);
    expect(view.actors[2]?.standard.xPercent).toBe(79);
  });

  it("positions the captain front line on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "smuggler-captain:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "smuggler-captain:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "smuggler-captain:c" }),
      ],
    }));

    expect(view.actors[1]?.standard.xPercent).toBe(67);
    expect(view.actors[1]?.standard.yPercent).toBe(75);
    expect(view.actors[2]?.standard.xPercent).toBe(78);
    expect(view.actors[3]?.standard.xPercent).toBe(87);
    expect(view.actors[3]?.standard.yPercent).toBe(82);
    expect(view.actors[1]?.zoomed.xPercent).toBe(22);
    expect(view.actors[2]?.zoomed.xPercent).toBe(47);
  });

  it("reuses the captain front-line positions for the tribute collector on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "tribute-collector:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "tribute-collector:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "tribute-collector:c" }),
      ],
    }));

    expect(view.actors[1]?.standard).toMatchObject({ xPercent: 67, yPercent: 75 });
    expect(view.actors[2]?.standard).toMatchObject({ xPercent: 78, yPercent: 64 });
    expect(view.actors[3]?.standard).toMatchObject({ xPercent: 87, yPercent: 82 });
    expect(view.actors[1]?.zoomed.xPercent).toBe(22);
    expect(view.actors[2]?.zoomed.xPercent).toBe(47);
    expect(view.actors[3]?.zoomed.xPercent).toBe(78);
  });

  it("raises the rampart eye and moves the outcast surgeon one percent right", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "bastion-defenders:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "bastion-defenders:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "bastion-defenders:c" }),
      ],
    }));

    expect(view.actors[1]?.standard).toMatchObject({ xPercent: 69, yPercent: 74 });
    expect(view.actors[2]?.standard).toMatchObject({ xPercent: 79, yPercent: 61 });
    expect(view.actors[3]?.standard).toMatchObject({ xPercent: 88, yPercent: 83 });
  });

  it("raises and moves the barricade warden one percent left on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "barricade-warden:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "barricade-warden:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "barricade-warden:c" }),
      ],
    }));

    expect(view.actors[1]?.standard).toMatchObject({ xPercent: 69, yPercent: 74 });
    expect(view.actors[2]?.standard).toMatchObject({ xPercent: 78, yPercent: 63 });
    expect(view.actors[3]?.standard).toMatchObject({ xPercent: 87, yPercent: 83 });
  });

  it("moves the court rat one percent left and down on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "court-vermin:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "court-vermin:b" }),
      ],
    }));

    expect(view.actors[1]?.standard).toMatchObject({ xPercent: 68, yPercent: 75 });
    expect(view.actors[2]?.standard).toMatchObject({ xPercent: 79, yPercent: 64 });
  });

  it("stages the chamberlain escort on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "chamberlain-escort:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "chamberlain-escort:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "chamberlain-escort:c" }),
      ],
    }));

    expect(view.actors[1]?.standard).toMatchObject({ xPercent: 67, yPercent: 74 });
    expect(view.actors[2]?.standard).toMatchObject({ xPercent: 78, yPercent: 63 });
    expect(view.actors[3]?.standard).toMatchObject({ xPercent: 87, yPercent: 83 });
  });

  it("stages the Rat King's herald group on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "king-herald:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "king-herald:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "king-herald:c" }),
      ],
    }));

    expect(view.actors[1]?.standard).toMatchObject({ xPercent: 67, yPercent: 74 });
    expect(view.actors[2]?.standard).toMatchObject({ xPercent: 78, yPercent: 64 });
    expect(view.actors[3]?.standard).toMatchObject({ xPercent: 87, yPercent: 83 });
  });

  it("stages the outcast standard-bearer group on desktop", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "outcast-standard-bearer:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "outcast-standard-bearer:b" }),
        actor("enemy-2", "enemies", 2, { contentKey: "outcast-standard-bearer:c" }),
      ],
    }));

    expect(view.actors[1]?.standard).toMatchObject({ xPercent: 67, yPercent: 74 });
    expect(view.actors[2]?.standard).toMatchObject({ xPercent: 79, yPercent: 63 });
    expect(view.actors[3]?.standard).toMatchObject({ xPercent: 87, yPercent: 83 });
  });

  it("moves the vermin mother ten percent to the right", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("hero-0", "heroes", 0),
        actor("enemy-0", "enemies", 0, { contentKey: "vermin-mother:a" }),
      ],
    }));

    expect(view.actors[0]?.standard.xPercent).toBe(35);
    expect(view.actors[1]?.standard.xPercent).toBe(79);
    expect(view.actors[1]?.zoomed.xPercent).toBe(32);
  });

  it("moves only the lock-biter two percent to the left", () => {
    const view = createDungeonCombatSceneView(scene({
      actors: [
        actor("enemy-0", "enemies", 0, { contentKey: "sewer-warden:a" }),
        actor("enemy-1", "enemies", 1, { contentKey: "sewer-warden:b" }),
      ],
    }));

    expect(view.actors[0]?.standard.xPercent).toBe(67);
    expect(view.actors[0]?.zoomed.xPercent).toBe(20);
    expect(view.actors[1]?.standard.xPercent).toBe(79);
    expect(view.actors[0]?.metaOffsetYPercent).toBe(0);
    expect(view.actors[1]?.metaOffsetYPercent).toBe(2);
  });

  it("projects a critical lethal melee action on the exact source and target", () => {
    const view = createDungeonCombatSceneView(scene({
      activeStep: step({ type: "hero.hit.critical" }),
    }));

    expect(view.actionMode).toBe("melee");
    expect(view.actors.find((entry) => entry.id === "hero-0")).toMatchObject({ active: true, motion: "melee" });
    expect(view.actors.find((entry) => entry.id === "enemy-0")).toMatchObject({ reaction: "ko" });
    expect(view.effects).toEqual([
      expect.objectContaining({
        targetActorId: "enemy-0",
        kind: "critical",
        label: "−10",
      }),
    ]);
  });

  it("keeps enemy attacks and dodges explicit without inventing a hit", () => {
    const dodge = impact("dodge", "hero-1", {
      kind: "dodge",
      sourceActorId: "enemy-1",
      announcedValue: null,
      appliedValue: null,
      hp: null,
      knockedOutAfter: false,
    });
    const view = createDungeonCombatSceneView(scene({
      activeStep: step({
        type: "enemy.dodged",
        sourceActorId: "enemy-1",
        targetActorIds: ["hero-1"],
        impacts: [dodge],
      }),
    }));

    expect(view.actors.find((entry) => entry.id === "enemy-1")).toMatchObject({ active: true, motion: "melee" });
    expect(view.actors.find((entry) => entry.id === "hero-1")).toMatchObject({ reaction: "dodge" });
    expect(view.effects[0]).toMatchObject({ kind: "dodge", label: "Esquive" });
  });

  it("caps temporary effects and exposes the limitation", () => {
    const impacts = Array.from({ length: DUNGEON_COMBAT_EFFECT_LIMIT + 3 }, (_, index) => (
      impact(`impact-${index}`, "enemy-0", { knockedOutAfter: false })
    ));
    const view = createDungeonCombatSceneView(scene({ activeStep: step({ impacts }) }));

    expect(view.effects).toHaveLength(DUNGEON_COMBAT_EFFECT_LIMIT);
    expect(view.effects.at(-1)?.offset).toBe(DUNGEON_COMBAT_EFFECT_LIMIT - 1);
  });

  it("falls back neutrally for advanced, legacy and completed encounter states", () => {
    const legacyActors = [
      actor("legacy-hero", "heroes", 0, {
        visualKey: null,
        currentHp: null,
        maximumHp: null,
        currentMana: null,
        maximumMana: null,
        knockedOut: null,
      }),
    ];
    const neutralState = scene({
      actors: legacyActors,
      activeStep: step({
        type: "hero.skill.future",
        sourceActorId: "legacy-hero",
        targetActorIds: [],
        impacts: [],
        summary: "Une action avancée est conservée.",
      }),
      limitations: ["initial-actors-unavailable"],
    });
    const beforeProjection = structuredClone(neutralState);
    const neutral = createDungeonCombatSceneView(neutralState);
    const completed = createDungeonCombatSceneView(scene({
      complete: true,
      activeStep: null,
      result: "victory",
    }));

    expect(neutral).toMatchObject({
      actionMode: "neutral",
      environment: "fallback",
      actors: [expect.objectContaining({ visualKey: null, healthPercent: null })],
    });
    expect(createDungeonCombatSceneView(neutralState)).toEqual(neutral);
    expect(neutralState).toEqual(beforeProjection);
    expect(completed).toMatchObject({
      actionMode: "result",
      actionSummary: "Victoire.",
      effects: [],
    });
  });
});
