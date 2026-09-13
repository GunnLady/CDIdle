import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonInitialActors,
} from "../shared/contracts/authoritative";
import type { DungeonChallengeKind } from "../shared/domain/dungeon-challenges";
import DungeonCombatScene from "../src/components/dungeon/DungeonCombatScene";
import {
  DUNGEON_CHALLENGE_KINDS,
  createDungeonChallengeSceneView,
} from "../src/domain/dungeonChallengeScene";
import {
  createEncounterSceneTimeline,
  projectEncounterScene,
} from "../src/domain/encounterSceneProjection";

const initialActors = {
  v: 1 as const,
  h: [
    ["hero-a", "Guerrier_Female_1", 40, 40, 20, 20, 0],
    ["hero-b", "Mage_Male_2", 36, 40, 18, 20, 0],
    ["hero-c", "Archer_Female_7", 32, 40, 16, 20, 0],
    ["hero-d", "Acolyte_Male_1", 28, 40, 14, 20, 0],
  ],
  e: [],
} satisfies CanonicalDungeonInitialActors;

const names = new Map([
  ["hero-a", "Ariane"],
  ["hero-b", "Milo"],
  ["hero-c", "Céleste"],
  ["hero-d", "Abel"],
]);

const expectedMotion = {
  trap: "ranged",
  enigma: "cast",
  ambush: "ranged",
  ritual: "cast",
  obstacle: "melee",
  negotiation: "focus",
} as const satisfies Record<DungeonChallengeKind, string>;

const nonFightSceneKinds = [
  ...DUNGEON_CHALLENGE_KINDS,
  "treasure",
  "rest",
] as const satisfies readonly Exclude<CanonicalDungeonEncounterRecord["kind"], "fight">[];
const nonFightSceneKindsAreExhaustive: Exclude<
  CanonicalDungeonEncounterRecord["kind"],
  "fight" | typeof nonFightSceneKinds[number]
> extends never ? true : never = true;

function challengeRecord(
  kind: DungeonChallengeKind,
  outcome: "victory" | "defeat",
): CanonicalDungeonEncounterRecord {
  const success = outcome === "victory";
  const consequence = success
    ? {
        sequence: 4,
        type: `challenge.${kind}.resolved`,
        heroId: "hero-c",
        heroName: "Céleste",
        heroChanges: kind === "enigma" || kind === "ritual"
          ? [{ heroId: "hero-c", manaBefore: 16, manaAfter: 20 }]
          : [],
        message: "L'épreuve est résolue.",
      }
    : {
        sequence: 4,
        type: `challenge.${kind}.consequence`,
        goldLost: kind === "negotiation" ? 7 : 0,
        heroChanges: kind === "trap" || kind === "ambush" || kind === "obstacle"
          ? initialActors.h.map(([heroId, , currentHp, maximumHp, currentMana]) => ({
              heroId,
              hpBefore: currentHp,
              hpAfter: currentHp - 2,
              heroMaxHp: maximumHp,
              manaBefore: currentMana,
              manaAfter: currentMana,
            }))
          : kind === "enigma" || kind === "ritual"
            ? [{ heroId: "hero-c", manaBefore: 16, manaAfter: 14 }]
            : [],
        message: "L'épreuve impose sa conséquence.",
      };
  const gold = success && (kind === "enigma" || kind === "ambush" || kind === "negotiation") ? 12 : 0;
  return {
    encounterId: `${kind}-${outcome}`,
    dungeonId: "undercity",
    kind,
    floor: 8,
    room: 4,
    outcome,
    roundCount: 0,
    enemy: null,
    initialActors,
    transcript: [
      { sequence: 0, type: "encounter.started", message: "Une épreuve se révèle." },
      {
        sequence: 1,
        type: "challenge.hero_selected",
        heroId: "hero-c",
        heroName: "Céleste",
        probabilityPercent: 72,
        message: "Céleste est choisie.",
      },
      {
        sequence: 2,
        type: "challenge.attempted",
        heroId: "hero-c",
        heroName: "Céleste",
        luckRoll: 4,
        score: 18,
        difficulty: 20,
        message: "Céleste tente l'épreuve.",
      },
      {
        sequence: 3,
        type: success ? "challenge.succeeded" : "challenge.failed",
        heroId: "hero-c",
        heroName: "Céleste",
        message: success ? "L'épreuve réussit." : "L'épreuve échoue.",
      },
      consequence,
      ...(gold > 0 ? [{ sequence: 5, type: "reward.gold", gold, message: `+${gold} or.` }] : []),
    ],
    rewards: { gold, loot: [] },
  };
}

function project(record: CanonicalDungeonEncounterRecord, visibleCount?: number) {
  const timeline = createEncounterSceneTimeline(record, names);
  const scene = projectEncounterScene(timeline, visibleCount === undefined
    ? undefined
    : { visibleCount, complete: false });
  return createDungeonChallengeSceneView(record, timeline, scene);
}

describe("dungeon challenge scene", () => {
  it("keeps the non-fight scene matrix exhaustive against the canonical union", () => {
    expect(nonFightSceneKindsAreExhaustive).toBe(true);
    expect(new Set(nonFightSceneKinds).size).toBe(8);
  });

  it.each(DUNGEON_CHALLENGE_KINDS)("stages the %s challenge with its own motion and selected hero", (kind) => {
    const view = project(challengeRecord(kind, "victory"));

    expect(view).toMatchObject({
      environment: "challenge-chamber",
      nonCombat: kind,
      nonCombatOutcome: "victory",
      result: null,
    });
    expect(view?.actors[0]).toMatchObject({ name: "Céleste", active: true, motion: expectedMotion[kind] });
    expect(view?.nonCombatDetails?.[0]).toBe("Épreuve réussie");
  });

  it("does not reveal the selected hero before the structured selection event", () => {
    const view = project(challengeRecord("enigma", "victory"), 1);

    expect(view?.actors.every((actor) => actor.active === false)).toBe(true);
    expect(view?.nonCombatDetails).toEqual(["Une épreuve se révèle."]);
  });

  it("keeps party damage, selected mana loss and negotiation gold loss exact", () => {
    const trap = project(challengeRecord("trap", "defeat"));
    const enigma = project(challengeRecord("enigma", "defeat"));
    const negotiation = project(challengeRecord("negotiation", "defeat"));

    expect(trap?.effects).toHaveLength(4);
    expect(trap?.effects.map((effect) => effect.label)).toEqual(["−2", "−2", "−2", "−2"]);
    expect(trap?.actors.every((actor) => actor.state !== "ko")).toBe(true);
    expect(enigma?.effects).toMatchObject([
      { targetActorId: expect.stringContaining("hero-c"), kind: "mana-spent", label: "PM −2 · 14/20" },
    ]);
    expect(negotiation?.nonCombatDetails).toEqual([
      "Épreuve échouée · progression maintenue",
      "Or −7",
    ]);
  });

  it.each(DUNGEON_CHALLENGE_KINDS)("keeps a failed %s challenge distinct from a wipe", (kind) => {
    const view = project(challengeRecord(kind, "defeat"));
    expect(view).toMatchObject({
      nonCombat: kind,
      nonCombatOutcome: "defeat",
      result: null,
    });
    expect(view?.nonCombatDetails?.[0]).toBe("Épreuve échouée · progression maintenue");
  });

  it("keeps an incomplete historical challenge useful without inventing an actor or value", () => {
    const legacy = {
      encounterId: "legacy-trap",
      dungeonId: "undercity",
      kind: "trap",
      floor: 2,
      room: 3,
      outcome: "defeat",
      roundCount: 0,
      enemy: null,
      transcript: [{ sequence: 4, type: "future.challenge", message: "Ancienne épreuve conservée." }],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;

    expect(project(legacy)).toMatchObject({
      actors: [],
      effects: [],
      nonCombatDetails: ["Épreuve échouée · progression maintenue"],
      actionSummary: "Ancienne épreuve conservée.",
    });
  });

  it("renders a failed challenge without a combat defeat overlay", () => {
    const view = project(challengeRecord("ambush", "defeat"));
    if (!view) throw new Error("challenge view missing");
    render(<DungeonCombatScene view={view} animationsEnabled={false} />);

    expect(screen.queryByTestId("dungeon-combat-result")).not.toBeInTheDocument();
    expect(screen.getByText("Épreuve échouée · progression maintenue")).toBeVisible();
    expect(screen.getByTestId("dungeon-non-combat-accessory")).toHaveAttribute(
      "data-visual-key",
      "encounter:challenge:ambush",
    );
    expect(screen.getByRole("list", { name: "Embuscade" })).toBeVisible();
  });
});
