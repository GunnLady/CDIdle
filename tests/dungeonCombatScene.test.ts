import { describe, expect, it } from "vitest";
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
      { xPercent: 25, yPercent: 52 },
      { xPercent: 10, yPercent: 58 },
      { xPercent: 18, yPercent: 82 },
      { xPercent: 69, yPercent: 74 },
      { xPercent: 79, yPercent: 64 },
      { xPercent: 87, yPercent: 83 },
    ]);
    expect(view.actors[1].standard.scale).toBeLessThan(view.actors[3].standard.scale);
    expect(view.actors[4]).toMatchObject({ visualKey: "undercity:rat-pack:a", role: "Combattant" });
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
