import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DungeonCombatScene from "../src/components/dungeon/DungeonCombatScene";
import {
  DUNGEON_COMBAT_EFFECT_LIMIT,
  createDungeonCombatSceneView,
} from "../src/domain/dungeonCombatScene";
import type {
  EncounterSceneActor,
  EncounterSceneImpact,
  EncounterSceneState,
  EncounterSceneStep,
} from "../src/domain/encounterSceneProjection";

vi.mock("../src/hooks/useEncounterVisualAsset", () => ({
  useEncounterVisualAsset: (key: string) => ({
    descriptor: {
      key,
      kind: key.includes("background") ? "background" : "actor",
      version: 1,
      provenance: "fixture",
      anchor: { x: 0.5, y: 0.9 },
      scale: 1,
      fallbackGlyph: "?",
      fallback: key === "fallback:actor" || key === "fallback:background",
    },
    url: key.startsWith("fallback:") ? null : `/fixture/${encodeURIComponent(key)}.png`,
    status: key.startsWith("fallback:") ? "fallback" : "ready",
    loading: false,
  }),
}));

const hero: EncounterSceneActor = {
  id: "hero",
  sourceId: "hero-source",
  team: "heroes",
  slot: 0,
  name: "Ariane",
  visualKey: "Guerrier_Female_1",
  contentKey: null,
  currentHp: 20,
  maximumHp: 20,
  currentMana: 5,
  maximumMana: 10,
  knockedOut: false,
};

const enemy: EncounterSceneActor = {
  id: "enemy",
  sourceId: "rat-a",
  team: "enemies",
  slot: 0,
  name: "Rat des canaux",
  visualKey: null,
  contentKey: "rat-pack:a",
  currentHp: 10,
  maximumHp: 16,
  currentMana: null,
  maximumMana: null,
  knockedOut: false,
};

function damageImpact(index = 0): EncounterSceneImpact {
  return {
    id: `impact-${index}`,
    kind: "damage",
    sourceActorId: hero.id,
    targetActorId: enemy.id,
    announcedValue: 6,
    appliedValue: 6,
    hp: { before: 16, after: 10, maximum: 16 },
    mana: null,
    knockedOutAfter: false,
  };
}

function action(overrides: Partial<EncounterSceneStep> = {}): EncounterSceneStep {
  return {
    id: "step",
    actionId: "action",
    index: 0,
    sequence: 1,
    round: 1,
    type: "hero.hit",
    category: "combat-hero",
    summary: "Ariane frappe le rat des canaux.",
    sourceActorId: hero.id,
    targetActorIds: [enemy.id],
    impacts: [damageImpact()],
    projection: "structured",
    result: null,
    ...overrides,
  };
}

function state(overrides: Partial<EncounterSceneState> = {}): EncounterSceneState {
  return {
    encounterId: "component-scene",
    visibleCount: 1,
    complete: false,
    actors: [hero, enemy],
    activeStep: action(),
    result: null,
    limitations: [],
    ...overrides,
  };
}

afterEach(cleanup);

describe("DungeonCombatScene", () => {
  it("renders the authoritative source, target, health and bounded effects", () => {
    const impacts = Array.from({ length: DUNGEON_COMBAT_EFFECT_LIMIT + 2 }, (_, index) => damageImpact(index));
    render(<DungeonCombatScene view={createDungeonCombatSceneView(state({
      activeStep: action({ impacts }),
    }), [{ id: "rat-a", role: "Combattant" }])} />);

    const scene = screen.getByTestId("dungeon-combat-scene");
    expect(scene).toHaveAttribute("data-action-mode", "melee");
    expect(within(scene).getAllByTestId("dungeon-combat-actor")).toHaveLength(2);
    expect(within(scene).getByLabelText(/Ariane, Guerrier, 20\/20 PV, Prêt/)).toHaveAttribute("data-active", "true");
    expect(within(scene).getByRole("progressbar", { name: "PV de Rat des canaux : 10 sur 16" })).toBeInTheDocument();
    expect(within(scene).getAllByTestId("dungeon-combat-effect")).toHaveLength(DUNGEON_COMBAT_EFFECT_LIMIT);
    expect(within(scene).getAllByLabelText("−6, Rat des canaux")).toHaveLength(DUNGEON_COMBAT_EFFECT_LIMIT);
    expect(within(scene).getAllByTestId("dungeon-combat-effect")[0]).toHaveAttribute("data-target-actor-id", enemy.id);
  });

  it("keeps an incomplete legacy actor neutral and explicit", () => {
    const legacyHero = {
      ...hero,
      visualKey: null,
      currentHp: null,
      maximumHp: null,
      knockedOut: null,
    } satisfies EncounterSceneActor;
    render(<DungeonCombatScene view={createDungeonCombatSceneView(state({
      actors: [legacyHero],
      activeStep: action({
        type: "hero.skill.future",
        sourceActorId: legacyHero.id,
        targetActorIds: [],
        impacts: [],
      }),
    }))} />);

    expect(screen.getByTestId("dungeon-combat-neutral-action")).toHaveTextContent("fidèle au journal");
    expect(screen.getByText("PV historiques du héros inconnus")).toBeInTheDocument();
    expect(screen.getByTestId("dungeon-combat-visual")).toHaveAttribute("data-asset-status", "fallback");
    expect(screen.queryByTestId("dungeon-combat-effect")).not.toBeInTheDocument();
  });

  it("renders KO and the final result without allowing the KO actor to act", () => {
    const knockedOutHero = { ...hero, currentHp: 0, knockedOut: null } satisfies EncounterSceneActor;
    const playing = createDungeonCombatSceneView(state({
      actors: [knockedOutHero, enemy],
      activeStep: action({ sourceActorId: knockedOutHero.id }),
    }));
    const result = createDungeonCombatSceneView(state({
      actors: [knockedOutHero, enemy],
      activeStep: null,
      complete: true,
      result: "victory",
    }));
    const { rerender } = render(<DungeonCombatScene view={playing} />);

    expect(screen.getByLabelText(/Ariane, Guerrier, 0\/20 PV, KO/)).toHaveAttribute("data-active", "false");
    rerender(<DungeonCombatScene view={result} />);
    expect(screen.getByTestId("dungeon-combat-result")).toHaveTextContent("Victoire");
    expect(screen.getByTestId("dungeon-combat-scene")).toHaveAttribute("data-action-mode", "result");
  });

  it("disables only visual animation while preserving the combat projection", () => {
    render(<DungeonCombatScene
      view={createDungeonCombatSceneView(state(), [{ id: "rat-a", role: "Combattant" }])}
      animationsEnabled={false}
    />);

    const scene = screen.getByTestId("dungeon-combat-scene");
    expect(scene).toHaveAttribute("data-animations", "disabled");
    expect(within(scene).getAllByTestId("dungeon-combat-actor")).toHaveLength(2);
    expect(within(scene).getByTestId("dungeon-combat-effect")).toBeInTheDocument();
  });
});
