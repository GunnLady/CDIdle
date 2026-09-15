import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
      fallbackGlyph: key === "encounter:treasure" ? "◇" : key === "encounter:rest-camp" ? "✦" : "?",
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
  visualVariant: null,
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
  visualVariant: null,
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
    hit: null,
    hitCount: null,
    critical: null,
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
    skillId: null,
    damageType: null,
    targetActorIds: [enemy.id],
    impacts: [damageImpact()],
    visualVariantChanges: [],
    rewards: [],
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
    rewards: [],
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
    expect(within(scene).getByRole("progressbar", { name: "PM de Ariane : 5 sur 10" })).toHaveAttribute("data-resource", "mana");
    expect(within(scene).getByRole("progressbar", { name: "PV de Rat des canaux : 10 sur 16" })).toBeInTheDocument();
    expect(within(scene).queryByRole("progressbar", { name: /PM de Rat des canaux/ })).not.toBeInTheDocument();
    expect(within(scene).getAllByTestId("dungeon-combat-effect")).toHaveLength(DUNGEON_COMBAT_EFFECT_LIMIT);
    expect(within(scene).getAllByLabelText("−6, Rat des canaux")).toHaveLength(DUNGEON_COMBAT_EFFECT_LIMIT);
    expect(within(scene).getAllByTestId("dungeon-combat-effect")[0]).toHaveAttribute("data-target-actor-id", enemy.id);
  });

  it("shows mana below health for any actor that has a mana resource", () => {
    const magicalEnemy = { ...enemy, currentMana: 3, maximumMana: 8 } satisfies EncounterSceneActor;
    const noManaHero = { ...hero, currentMana: 0, maximumMana: 0 } satisfies EncounterSceneActor;
    render(<DungeonCombatScene view={createDungeonCombatSceneView(state({
      actors: [noManaHero, magicalEnemy],
    }))} />);

    const enemyActor = screen.getByTestId("dungeon-combat-scene")
      .querySelector<HTMLElement>("[data-team='enemies']");
    expect(enemyActor).not.toBeNull();
    const bars = within(enemyActor!).getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAccessibleName("PV de Rat des canaux : 10 sur 16");
    expect(bars[1]).toHaveAccessibleName("PM de Rat des canaux : 3 sur 8");
    expect(bars[1]).toHaveAttribute("data-resource", "mana");
    expect(screen.queryByRole("progressbar", { name: /PM de Ariane/ })).not.toBeInTheDocument();
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

  it("renders a structured projectile path from the exact source to the exact target", () => {
    const view = createDungeonCombatSceneView(state({
      activeStep: action({
        type: "hero.skill.damage",
        skillId: "precise_shot",
        damageType: "physical",
      }),
    }));
    render(<DungeonCombatScene view={view} animationsEnabled={false} />);

    const path = screen.getByTestId("dungeon-combat-action-effect");
    expect(path).toHaveAttribute("data-kind", "projectile");
    expect(path).toHaveAttribute("data-source-actor-id", hero.id);
    expect(path).toHaveAttribute("data-target-actor-id", enemy.id);
    expect(path).toHaveAttribute("data-visual-key", "effect:projectile");
    expect(screen.getByTestId("dungeon-combat-action-payload")).toBeInTheDocument();
    expect(screen.getByLabelText("\u22126, Rat des canaux")).toBeInTheDocument();
  });

  it("updates visible health text and actor state at projectile impact", () => {
    vi.useFakeTimers();
    try {
      const readyEnemy = { ...enemy, currentHp: 16 } satisfies EncounterSceneActor;
      const entry = createDungeonCombatSceneView(state({
        actors: [hero, readyEnemy],
        activeStep: action({
          id: "entry",
          type: "encounter.started",
          sourceActorId: null,
          targetActorIds: [],
          impacts: [],
        }),
      }));
      const projectile = createDungeonCombatSceneView(state({
        activeStep: action({
          id: "projectile",
          type: "hero.skill.damage",
          skillId: "precise_shot",
          damageType: "physical",
        }),
      }));
      const { rerender } = render(<DungeonCombatScene view={entry} />);

      rerender(<DungeonCombatScene view={projectile} />);
      expect(screen.getByLabelText(/Rat des canaux, Ennemi, 16\/16 PV, Prêt/)).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(429));
      expect(screen.getByLabelText(/Rat des canaux, Ennemi, 16\/16 PV, Prêt/)).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByLabelText(/Rat des canaux, Ennemi, 10\/16 PV, Prêt/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps overlapping number batches visible, bounded and cleaned after their visual lifetime", () => {
    vi.useFakeTimers();
    try {
      const first = createDungeonCombatSceneView(state({
        activeStep: action({ id: "step-one", impacts: [damageImpact(1)] }),
      }));
      const second = createDungeonCombatSceneView(state({
        activeStep: action({ id: "step-two", impacts: [damageImpact(2)] }),
      }));
      const { rerender } = render(<DungeonCombatScene view={first} />);
      expect(screen.getAllByTestId("dungeon-combat-effect")).toHaveLength(1);

      act(() => vi.advanceTimersByTime(500));
      rerender(<DungeonCombatScene view={second} />);
      expect(screen.getAllByTestId("dungeon-combat-effect")).toHaveLength(2);

      act(() => vi.advanceTimersByTime(661));
      expect(screen.getAllByTestId("dungeon-combat-effect")).toHaveLength(1);
      act(() => vi.advanceTimersByTime(500));
      expect(screen.queryByTestId("dungeon-combat-effect")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the reusable non-combat composition with exact accessible details", () => {
    const view = createDungeonCombatSceneView(state({ actors: [hero], activeStep: null }));
    view.actionMode = "neutral";
    view.actionSummary = "Récupération appliquée. Ariane : Réanimé, PV +4 · 20/20, PM +2 · 5/10.";
    view.effects = [];
    view.nonCombat = "rest";
    view.nonCombatDetails = ["Repos terminé"];
    view.effects = [
      { id: "revival", targetActorId: hero.id, kind: "revival", label: "Réanimé", offset: 0, delayMs: 0 },
      { id: "health", targetActorId: hero.id, kind: "recovery-health", label: "PV +4 · 20/20", offset: 1, delayMs: 0 },
      { id: "mana", targetActorId: hero.id, kind: "recovery-mana", label: "PM +2 · 5/10", offset: 2, delayMs: 0 },
    ];

    render(<DungeonCombatScene view={view} animationsEnabled={false} />);

    const scene = screen.getByTestId("dungeon-combat-scene");
    expect(scene).toHaveAccessibleName("Scène de rencontre");
    expect(scene).toHaveAttribute("tabindex", "0");
    expect(scene).toHaveAttribute("data-animations", "disabled");
    expect(within(scene).getByText(view.actionSummary)).toHaveClass("sr-only");
    expect(within(scene).getByLabelText("Acteurs présents")).toBeInTheDocument();
    expect(within(scene).getByLabelText("Repos")).toHaveTextContent("Repos terminé");
    expect(within(scene).getByLabelText("Réanimé, Ariane")).toHaveAttribute("data-kind", "revival");
    expect(within(scene).getByLabelText("PV +4 · 20/20, Ariane")).toHaveAttribute("data-kind", "recovery-health");
    expect(within(scene).getByLabelText("PM +2 · 5/10, Ariane")).toHaveAttribute("data-kind", "recovery-mana");
    expect(within(scene).getByLabelText("Réanimé, Ariane").style.getPropertyValue("--effect-delay")).toBe("0ms");
    expect(within(scene).getByLabelText("PV +4 · 20/20, Ariane").style.getPropertyValue("--effect-delay")).toBe("600ms");
    expect(within(scene).getByLabelText("PM +2 · 5/10, Ariane").style.getPropertyValue("--effect-delay")).toBe("1200ms");
    expect(scene.querySelector('img[src*="encounter%3Arest-camp"]')).not.toBeNull();
    expect(within(scene).queryByTestId("dungeon-combat-neutral-action")).not.toBeInTheDocument();
  });

  it("shows the catalog fallback when a non-combat asset cannot render", () => {
    const view = createDungeonCombatSceneView(state({ actors: [], activeStep: null }));
    view.actionSummary = "Coffre vide";
    view.nonCombat = "treasure";
    const { container } = render(<DungeonCombatScene view={view} />);
    const image = container.querySelector<HTMLImageElement>('img[src*="encounter%3Atreasure"]');
    expect(image).not.toBeNull();

    fireEvent.error(image!);

    expect(screen.getByText("◇")).toBeInTheDocument();
    expect(screen.getByText("◇").parentElement).toHaveAttribute("data-asset-status", "fallback");
  });
});
