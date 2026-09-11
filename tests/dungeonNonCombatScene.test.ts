import { describe, expect, it } from "vitest";
import type {
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonInitialActors,
} from "../shared/contracts/authoritative";
import { createDungeonNonCombatSceneView } from "../src/domain/dungeonNonCombatScene";
import {
  createEncounterSceneTimeline,
  projectEncounterScene,
} from "../src/domain/encounterSceneProjection";

const initialHeroes = {
  v: 1 as const,
  h: [
    ["wounded", "Guerrier_Female_1", 40, 100, 5, 20, 0],
    ["knocked-out", "Mage_Male_1", 0, 80, 0, 20, 1],
    ["capped", "Archer_Female_1", 95, 100, 19, 20, 0],
    ["knocked-out-2", "Acolyte_Male_1", 0, 90, 2, 18, 1],
  ],
  e: [],
} satisfies CanonicalDungeonInitialActors;

function project(record: CanonicalDungeonEncounterRecord, visibleCount?: number) {
  const names = new Map([
    ["wounded", "Ariane"],
    ["knocked-out", "Abel"],
    ["capped", "Céleste"],
    ["knocked-out-2", "Borin"],
  ]);
  const timeline = createEncounterSceneTimeline(record, names);
  const scene = projectEncounterScene(timeline, visibleCount === undefined
    ? undefined
    : { visibleCount, complete: false });
  return createDungeonNonCombatSceneView(record, timeline, scene);
}

describe("dungeon non-combat scene", () => {
  it("presents exact treasure contents and preserves an explicit empty chest", () => {
    const treasure = {
      encounterId: "treasure-scene",
      dungeonId: "undercity",
      kind: "treasure",
      floor: 2,
      room: 3,
      outcome: "victory",
      roundCount: 0,
      enemy: null,
      initialActors: initialHeroes,
      transcript: [
        { sequence: 0, type: "encounter.started" },
        { sequence: 1, type: "treasure.opened", treasureOutcome: "item" },
        { sequence: 2, type: "reward.item", itemId: "basic_staff", itemName: "Bâton usé", rarity: "common", count: 1 },
        { sequence: 3, type: "reward.material", materialId: "metal_scrap", name: "Débris métalliques", rarity: "common", count: 2 },
        { sequence: 4, type: "reward.blueprint", itemId: "runic_mace", itemName: "Masse runique" },
      ],
      rewards: {
        gold: 0,
        loot: [
          { type: "item", instanceId: "treasure-item", itemId: "basic_staff", itemLevel: 1, powerModelId: "legacy-fixed-v1", rarity: "common", count: 1 },
          { type: "material", materialId: "metal_scrap", name: "Débris métalliques", rarity: "common", count: 2 },
          { type: "blueprint", itemId: "runic_mace", count: 1 },
        ],
      },
    } satisfies CanonicalDungeonEncounterRecord;

    expect(project(treasure)).toMatchObject({
      environment: "treasure-vault",
      nonCombat: "treasure",
      actionSummary: "Bâton usé ×1 • Débris métalliques ×2 • Plan · Masse runique",
      nonCombatDetails: ["Bâton usé ×1", "Débris métalliques ×2", "Plan · Masse runique"],
    });
    expect(project(treasure)?.actors.map(({ standard }) => standard)).toEqual([
      { xPercent: 39, yPercent: 84, layer: 5, scale: 1.04 },
      { xPercent: 28, yPercent: 73, layer: 2, scale: 1.031 },
      { xPercent: 72, yPercent: 73, layer: 1, scale: 1.031 },
      { xPercent: 61, yPercent: 84, layer: 4, scale: 1.04 },
    ]);

    const emptyTreasure = {
      ...treasure,
      encounterId: "empty-treasure-scene",
      transcript: [
        { sequence: 0, type: "encounter.started" },
        { sequence: 1, type: "treasure.opened", treasureOutcome: "empty" },
      ],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    expect(project(emptyTreasure)).toMatchObject({
      actionSummary: "Coffre vide",
      nonCombatDetails: ["Coffre vide"],
    });
  });

  it("shows exact capped recovery and every revived segment hero", () => {
    const rest = {
      encounterId: "rest-scene",
      dungeonId: "undercity",
      kind: "rest",
      floor: 4,
      room: 5,
      outcome: "victory",
      roundCount: 0,
      enemy: null,
      initialActors: initialHeroes,
      transcript: [
        { sequence: 0, type: "rest.started" },
        {
          sequence: 1,
          type: "party.restored",
          heroes: [
            { heroId: "wounded", hpBefore: 40, hpAfter: 60, manaBefore: 5, manaAfter: 9, revived: false },
            { heroId: "knocked-out", hpBefore: 0, hpAfter: 16, manaBefore: 0, manaAfter: 4, revived: true },
            { heroId: "capped", hpBefore: 95, hpAfter: 100, manaBefore: 19, manaAfter: 20, revived: false },
            { heroId: "knocked-out-2", hpBefore: 0, hpAfter: 18, manaBefore: 2, manaAfter: 6, revived: true },
          ],
        },
      ],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;

    const beforeRecovery = project(rest, 1);
    expect(beforeRecovery).toMatchObject({ actionSummary: "Repos", nonCombat: "rest" });

    const view = project(rest);
    expect(view?.environment).toBe("rest-chamber");
    expect(view?.nonCombat).toBe("rest");
    expect(view?.actionSummary).toBe(
      "Repos terminé. Ariane : PV +20 · 60/100, PM +4 · 9/20 ; "
      + "Abel : Réanimé, PV +16 · 16/80, PM +4 · 4/20 ; "
      + "Céleste : PV +5 · 100/100, PM +1 · 20/20 ; "
      + "Borin : Réanimé, PV +18 · 18/90, PM +4 · 6/18.",
    );
    expect(view?.nonCombatDetails).toEqual(["Repos terminé"]);
    expect(view?.effects.map(({ label }) => label)).toEqual([
      "PV +20 · 60/100",
      "PM +4 · 9/20",
      "Réanimé",
      "PV +16 · 16/80",
      "PM +4 · 4/20",
      "PV +5 · 100/100",
      "PM +1 · 20/20",
      "Réanimé",
      "PV +18 · 18/90",
      "PM +4 · 6/18",
    ]);
    expect(view?.effects.map(({ kind }) => kind)).toEqual([
      "recovery-health",
      "recovery-mana",
      "revival",
      "recovery-health",
      "recovery-mana",
      "recovery-health",
      "recovery-mana",
      "revival",
      "recovery-health",
      "recovery-mana",
    ]);
    expect(view?.effects.filter(({ kind }) => kind === "revival")).toHaveLength(2);
  });

  it("keeps mana-only recovery blue and omits unavailable historical maxima", () => {
    const manaOnly = {
      encounterId: "rest-mana-only",
      dungeonId: "undercity",
      kind: "rest",
      floor: 1,
      room: 2,
      outcome: "victory",
      roundCount: 0,
      enemy: null,
      initialActors: {
        v: 1,
        h: [["wounded", "Guerrier_Female_1", 100, 100, 5, 20, 0]],
        e: [],
      },
      transcript: [{
        sequence: 0,
        type: "party.restored",
        heroes: [{ heroId: "wounded", hpBefore: 100, hpAfter: 100, manaBefore: 5, manaAfter: 9, revived: false }],
      }],
      rewards: { gold: 0, loot: [] },
    } satisfies CanonicalDungeonEncounterRecord;
    expect(project(manaOnly)?.effects).toMatchObject([
      { kind: "recovery-mana", label: "PM +4 · 9/20" },
    ]);

    const legacy = {
      ...manaOnly,
      encounterId: "rest-legacy-maxima",
      initialActors: undefined,
      transcript: [{
        sequence: 0,
        type: "party.restored",
        heroes: [{ heroId: "wounded", hpBefore: 10, hpAfter: 14, manaBefore: 5, manaAfter: 9, revived: false }],
      }],
    } satisfies CanonicalDungeonEncounterRecord;
    expect(project(legacy)?.effects).toMatchObject([
      { kind: "recovery-health", label: "PV +4 · 14" },
      { kind: "recovery-mana", label: "PM +4 · 9" },
    ]);
  });
});
