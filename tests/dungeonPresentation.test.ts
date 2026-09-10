import { describe, expect, it } from "vitest";
import {
  createCurrentEncounterView,
  createDungeonHistoryView,
  createDungeonPartyView,
  createDungeonProgressBannerView,
  createDungeonProgressView,
  createUndercityJourneyView,
} from "../src/domain/dungeonPresentation";
import { createHeroRosterView } from "../src/domain/heroPresentation";
import { createUndercityProgress } from "../shared/domain/undercity-progression";
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

  it("bounds progression by the least advanced active hero and exposes the farm choice", () => {
    const heroes = [
      makeHero({ id: "veteran", name: "Veteran", isActive: true }),
      makeHero({ id: "novice", name: "Novice", isActive: true }),
    ];
    const progress = createUndercityProgress(["veteran", "novice"]);
    progress.heroes.veteran.completedFloor = 50;
    progress.heroes.veteran.fixedVictoryIds.push("undercity:boss:50");
    progress.heroes.novice.completedFloor = 10;

    expect(createUndercityJourneyView(progress, heroes)).toMatchObject({
      commonCheckpoint: 10,
      maxSelectableFloor: 11,
      awaitingFarmSelection: false,
      farmZones: [],
    });

    progress.heroes.novice.completedFloor = 50;
    progress.heroes.novice.fixedVictoryIds.push("undercity:boss:50");
    expect(createUndercityJourneyView(progress, heroes)).toMatchObject({
      maxSelectableFloor: 50,
      awaitingFarmSelection: true,
    });
    expect(createUndercityJourneyView(progress, heroes).farmZones).toHaveLength(5);
  });

  it("projects maximum-level heroes with a full XP bar", () => {
    const hero = makeHero({ id: "max-level", level: 99, xp: 0, isActive: true });
    const view = createDungeonPartyView([hero], createHeroRosterView([hero]));
    expect(view.party[0]).toMatchObject({ isMaxLevel: true, xpPercent: 100 });
  });

  it("shares room progression and prepares expedition banner slots outside React", () => {
    const hero = makeHero({
      id: "banner-hero",
      level: 1,
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
    expect(view?.scene).toMatchObject({
      encounterId: "challenge",
      visibleCount: 1,
      complete: false,
      activeStep: { sequence: 0, summary: "Calcul canonique exact." },
      limitations: ["initial-actors-unavailable"],
    });
  });

  it("hides redundant enemy intents while keeping the resolved enemy action", () => {
    const record = {
      encounterId: "enemy-action",
      kind: "fight" as const,
      floor: 1,
      room: 1,
      outcome: "victory" as const,
      roundCount: 1,
      enemy: { id: "rat", name: "Rat", hp: 0, maxHp: 10 },
      transcript: [
        { sequence: 0, type: "enemy.intent", message: "Rat : attaque." },
        { sequence: 1, type: "enemy.hit", message: "Rat attaque Ariane et inflige 3 dégâts." },
      ],
      rewards: { gold: 1, loot: [] },
    };

    const view = createCurrentEncounterView(null, [record], null, []);

    expect(view?.transcript.map((event) => event.message)).toEqual(["Rat attaque Ariane et inflige 3 dégâts."]);
  });

  it("translates every canonical enemy role for presentation", () => {
    const roles = ["ordinary", "protector", "ranged", "support", "guard", "king"] as const;
    const record = {
      encounterId: "translated-roles",
      kind: "fight" as const,
      floor: 1,
      room: 1,
      outcome: "victory" as const,
      roundCount: 1,
      enemy: { id: "ordinary", name: "Ennemi", hp: 0, maxHp: 1 },
      enemies: roles.map((role) => ({ id: role, name: role, hp: 0, maxHp: 1, role })),
      transcript: [],
      rewards: { gold: 0, loot: [] },
    };

    const view = createCurrentEncounterView(null, [record], null, []);

    expect(view?.enemies.map((enemy) => enemy.role)).toEqual([
      "Combattant",
      "Protecteur",
      "Tireur",
      "Soutien",
      "Garde",
      "Souverain",
    ]);
  });

  it("reconstructs each enemy health from the visible playback events", () => {
    const record = {
      encounterId: "group-playback",
      kind: "fight" as const,
      floor: 10,
      room: 5,
      outcome: "victory" as const,
      roundCount: 2,
      enemy: { id: "guard", name: "Garde", hp: 0, maxHp: 10 },
      enemies: [
        { id: "guard", name: "Garde", hp: 0, maxHp: 10 },
        { id: "support", name: "Soigneur", hp: 0, maxHp: 8 },
      ],
      transcript: [
        { sequence: 0, type: "hero.hit", monsterId: "guard", enemyHp: 4 },
        { sequence: 1, type: "enemy.support", monsterId: "support", targetMonsterId: "guard", enemyHp: 7 },
        { sequence: 2, type: "hero.hit", monsterId: "guard", enemyHp: 0 },
        { sequence: 3, type: "hero.hit", monsterId: "support", enemyHp: 0 },
      ],
      rewards: { gold: 4, loot: [] },
    };

    const damaged = createCurrentEncounterView(null, [record], { encounterId: record.encounterId, visibleCount: 1, complete: false }, []);
    expect(damaged?.enemies).toEqual([
      expect.objectContaining({ id: "guard", hp: 4 }),
      expect.objectContaining({ id: "support", hp: null }),
    ]);
    expect(damaged?.scene?.actors.find((actor) => actor.sourceId === "support")?.currentHp).toBeNull();

    const healed = createCurrentEncounterView(null, [record], { encounterId: record.encounterId, visibleCount: 2, complete: false }, []);
    expect(healed?.enemies[0]).toMatchObject({ id: "guard", hp: 7 });

    const completed = createCurrentEncounterView(null, [record], { encounterId: record.encounterId, visibleCount: 4, complete: true }, []);
    expect(completed?.enemies.map((enemy) => enemy.hp)).toEqual([0, 0]);
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
