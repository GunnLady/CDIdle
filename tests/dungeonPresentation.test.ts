import { describe, expect, it } from "vitest";
import {
  createCurrentEncounterView,
  createDungeonHistoryView,
  createDungeonPartyView,
  createDungeonProgressBannerView,
  createDungeonProgressView,
} from "../src/domain/dungeonPresentation";
import { createHeroRosterView } from "../src/domain/heroPresentation";
import { makeHero } from "./fixtures/game";

describe("dungeon presentation projections", () => {
  it("projects canonical room progression without mutating it", () => {
    const view = createDungeonProgressView(2, 8, 3);
    expect(view).toMatchObject({ floor: 2, room: 8, roomCount: 10, canGoPrevious: true, canGoNext: true });
    expect(view.rooms.filter((room) => room.state === "completed")).toHaveLength(7);
    expect(view.rooms.at(-1)).toMatchObject({ number: 10, isBoss: true, state: "upcoming" });
  });

  it("projects active slots, reserves and combat indicators outside React", () => {
    const active = makeHero({ id: "active", isActive: true, currentMana: 3 });
    const reserve = makeHero({ id: "reserve", isActive: false });
    const heroes = [active, reserve];
    const view = createDungeonPartyView(heroes, createHeroRosterView(heroes));
    expect(view.party[0]).toMatchObject({ id: "active", currentMana: 3 });
    expect(view.party).toHaveLength(4);
    expect(view.reserves.map((hero) => hero.id)).toEqual(["reserve"]);
    expect(Number(view.party[0]?.estimatedDps)).toBeGreaterThan(0);
  });

  it("shares room progression and prepares expedition banner slots outside React", () => {
    const hero = makeHero({
      id: "banner-hero",
      name: "Ariane",
      isActive: true,
      currentHp: 10,
      currentMana: 5,
      calculatedStats: { ...makeHero().calculatedStats, maxHp: 20, maxMana: 10 },
    });
    const banner = createDungeonProgressBannerView({
      heroes: [hero],
      floor: 4,
      room: 99,
      autoExplore: true,
      encounter: null,
      isExploring: false,
      canMutate: true,
    });
    const dungeon = createDungeonProgressView(4, 99, 4);

    expect(banner.progress).toEqual({ floor: dungeon.floor, room: dungeon.room, roomCount: dungeon.roomCount });
    expect(banner).toMatchObject({ status: "Prêt", autoExplore: true, canToggleAutoExplore: true });
    expect(banner.party).toHaveLength(4);
    expect(banner.party[0]).toMatchObject({
      id: "banner-hero",
      currentHp: 10,
      maxHp: 20,
      currentMana: 5,
      maxMana: 10,
      healthPercent: 50,
      manaPercent: 50,
    });
  });

  it("keeps canonical encounter messages and playback limits unchanged", () => {
    const record = {
      encounterId: "challenge",
      kind: "trap" as const,
      floor: 3,
      room: 2,
      outcome: "victory" as const,
      roundCount: 0,
      enemy: null,
      transcript: [
        { sequence: 0, type: "challenge", message: "Calcul canonique exact." },
        { sequence: 1, type: "result", message: "Résultat canonique exact." },
      ],
      rewards: { gold: 4, loot: [] },
    };
    const view = createCurrentEncounterView(null, [record], { encounterId: "challenge", visibleCount: 1, complete: false }, []);
    expect(view?.transcript.map((event) => event.message)).toEqual(["Calcul canonique exact."]);
    expect(view).toMatchObject({ state: "playing", statusLabel: "Rencontre en cours" });
  });

  it("keeps only dungeon notes beside canonical history", () => {
    const notes = [
      { id: "dungeon", timestamp: "10:00", message: "Texte libre sans numéro de salle", type: "info" as const, category: "dungeon" as const },
      { id: "colony", timestamp: "10:01", message: "Colonie", type: "info" as const, category: "colony" as const },
      { id: "system", timestamp: "10:02", message: "Synchronisation", type: "info" as const },
    ];
    const dungeon = createDungeonHistoryView([], notes, [], null);
    expect(dungeon.notes.map((note) => note.id)).toEqual(["dungeon"]);
  });
});
