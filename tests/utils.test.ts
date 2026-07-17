import { describe, expect, it, vi } from "vitest";
import {
  calculateXpNeeded,
  calculateRates,
  getAvailableTier1Classes,
  addItemToStorage,
  removeItemFromStorage,
  getStoredItemStack,
  equipItem,
  unequipItem,
} from "../src/utils/gameCalculations";
import {
  getEncounterDetails,
  getEncounterStatPresentation,
  rollEncounterForgeMaterial,
  selectBestHeroForEncounter,
} from "../src/utils/dungeonHelpers";
import type { Hero } from "../src/types";
import { getBuildingMaxLevel } from "../src/data/buildings";
import { makeCitizens, makeHero, makeStoredItem } from "./fixtures/game";
import { createInitialGameState, splitGameState, validateGameState } from "../src/domain/gameState";
import { isCommandSuccess, validateCommandEnvelope, type CommandEnvelope } from "../src/domain/commands";
import { fixedClock, seededRng } from "../src/domain/random";
import { allocateCitizen, townRates, unlockDistrict, upgradeBuilding, type TownState } from "../src/domain/town";

const hero = (id: string, strength: number, agility: number): Hero => ({
  id,
  name: id,
  race: "Humain",
  isActive: true,
  baseStats: {
    str: strength,
    agi: agility,
    end: 1,
    int: 1,
    wiz: 1,
    dex: 1,
    luk: 1,
  },
  equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
  passiveSkills: [],
  activeSkills: [],
} as unknown as Hero);

describe("gameCalculations", () => {
  it("respecte les niveaux maximums des batiments", () => {
    expect(getBuildingMaxLevel("habitation")).toBe(10);
    expect(getBuildingMaxLevel("maison_chef")).toBe(5);
    expect(getBuildingMaxLevel("guilde")).toBe(5);
    expect(getBuildingMaxLevel("forge")).toBe(1);
    expect(getBuildingMaxLevel("inconnu")).toBe(10);
  });
  it("calcule l'XP de base et applique le multiplicateur de classe", () => {
    expect(calculateXpNeeded(1, "Novice")).toBe(100);
    expect(calculateXpNeeded(2, "Novice")).toBe(100);
    expect(calculateXpNeeded(2, "Guerrier")).toBe(125);
  });

  it("ne débloque aucune classe sans bâtiment requis", () => {
    expect(getAvailableTier1Classes({})).toEqual([]);
  });

  it("calcule les ressources des citoyens et les bonus de district", () => {
    const rates = calculateRates(
      makeCitizens({ woodcutters: 2, farmers: 1, miners: 1 }),
      { scierie: 3, ferme: 4, mine: 2, maison_chef: 1 },
      { quartier_bois: true },
      true,
    );
    expect(rates.wood).toBeCloseTo(7.416, 6);
    expect(rates.food).toBeCloseTo(4.12, 6);
    expect(rates.ore).toBeCloseTo(2.06, 6);
    expect(rates.stone).toBe(0);
  });

  it("empile et retire les objets par id, rareté et modificateurs", () => {
    const storage = [makeStoredItem({ count: 2 })];
    addItemToStorage(storage, "wooden_sword", "common", 3);
    expect(getStoredItemStack(storage, "wooden_sword", "common")?.count).toBe(5);
    removeItemFromStorage(storage, "wooden_sword", "common", 5);
    expect(storage).toHaveLength(0);
  });

  it("équipe puis déséquipe un objet en conservant le stockage", () => {
    const storage = [makeStoredItem({ itemId: "starter_sword" })];
    const hero = makeHero();
    const equipped = equipItem(hero, storage, "starter_sword", "common");
    expect(equipped.equipment?.mainHand?.itemId).toBe("starter_sword");
    expect(storage).toHaveLength(0);
    const unequipped = unequipItem(equipped, storage, "mainHand");
    expect(unequipped.equipment?.mainHand).toBeNull();
    expect(storage).toHaveLength(1);
  });
});

describe("GameStateV1", () => {
  it("creates a valid isolated initial state", () => {
    const state = createInitialGameState();
    expect(validateGameState(state)).toEqual([]);
    expect(state.totalCitizensCount).toBe(3);
    expect(state.activeDungeonRoom).toBe(1);
    state.resources.gold = 0;
    expect(createInitialGameState().resources.gold).toBe(75);
  });

  it("separates persistent data from runtime-only combat data", () => {
    const state = createInitialGameState();
    const split = splitGameState(state);
    expect(split.persistent).not.toHaveProperty("battleLogs");
    expect(split.persistent).not.toHaveProperty("currentMonster");
    expect(split.transient).toMatchObject({ combatTimer: 2, autoExplore: true });
  });

  it("reports broken invariants with actionable paths", () => {
    const state = createInitialGameState();
    state.activeDungeonRoom = 51;
    state.citizens.unassigned = 0;
    expect(validateGameState(state)).toEqual(expect.arrayContaining([
      "activeDungeonRoom must be an integer between 1 and 50",
      "citizen allocations must equal totalCitizensCount"
    ]));
  });
});

describe("API command contracts", () => {
  it("validates revision and idempotency metadata", () => {
    const envelope: CommandEnvelope = {
      commandId: "cmd-1", idempotencyKey: "idem-1", expectedRevision: 4,
      command: { type: "building.upgrade", buildingId: "habitation" }
    };
    expect(validateCommandEnvelope(envelope)).toEqual([]);
    expect(isCommandSuccess({ ok: true, revision: 5, state: {}, commandId: "cmd-1", replayed: false })).toBe(true);
  });

  it("returns field-level errors for malformed envelopes", () => {
    const errors = validateCommandEnvelope({ commandId: "", idempotencyKey: "", expectedRevision: -1, command: {} as never });
    expect(errors.map((error) => error.field)).toEqual(expect.arrayContaining(["commandId", "idempotencyKey", "expectedRevision", "command.type"]));
  });
});

describe("clock and RNG contracts", () => {
  it("allows deterministic time in tests", () => {
    expect(fixedClock(1_700_000_000_000).now()).toBe(1_700_000_000_000);
  });

  it("replays the same seeded random sequence", () => {
    const first = seededRng(42);
    const second = seededRng(42);
    expect([first.next(), first.nextInt(10), first.next()]).toEqual([second.next(), second.nextInt(10), second.next()]);
  });
});

describe("town domain", () => {
  const state = (): TownState => ({
    resources: { gold: 1000, food: 1000, wood: 1000, stone: 1000, ore: 1000 },
    buildings: { habitation: 1, ferme: 1, scierie: 0, carriere: 0, mine: 0, maison_chef: 0 },
    citizens: { farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 },
    totalCitizensCount: 3, districts: {}
  });

  it("enforces building prerequisites for citizen allocation", () => {
    expect(allocateCitizen(state(), "woodcutters", 1)).toEqual({ ok: false, error: "BUILDING_REQUIRED" });
    const result = allocateCitizen(state(), "farmers", 1);
    expect(result.ok && result.state.citizens).toMatchObject({ farmers: 1, unassigned: 2 });
  });

  it("applies resource costs atomically for building and district actions", () => {
    const upgraded = upgradeBuilding(state(), "ferme");
    expect(upgraded.ok).toBe(true);
    const unlocked = unlockDistrict(state(), "quartier_ferme");
    expect(unlocked.ok).toBe(true);
  });

  it("derives rates from the canonical town state", () => {
    const current = state();
    current.citizens.farmers = 2;
    current.citizens.unassigned = 1;
    expect(townRates(current).food).toBe(2);
  });
});

describe("API command contracts", () => {
  it("validates revision and idempotency metadata", () => {
    const envelope: CommandEnvelope = {
      commandId: "cmd-1", idempotencyKey: "idem-1", expectedRevision: 4,
      command: { type: "building.upgrade", buildingId: "habitation" }
    };
    expect(validateCommandEnvelope(envelope)).toEqual([]);
    expect(isCommandSuccess({ ok: true, revision: 5, state: {}, commandId: "cmd-1", replayed: false })).toBe(true);
  });

  it("returns field-level errors for malformed envelopes", () => {
    const errors = validateCommandEnvelope({ commandId: "", idempotencyKey: "", expectedRevision: -1, command: {} as never });
    expect(errors.map((error) => error.field)).toEqual(expect.arrayContaining(["commandId", "idempotencyKey", "expectedRevision", "command.type"]));
  });
});

describe("dungeonHelpers", () => {
  it("derive les six presentations UI depuis les couples canoniques", () => {
    const cases = [
      ["trap", "agi", "dex", "AGI", "DEX"],
      ["enigma", "int", "wiz", "INT", "SAG"],
      ["ambush", "agi", "luk", "AGI", "CHA"],
      ["ritual", "dex", "wiz", "DEX", "SAG"],
      ["obstacle", "str", "agi", "FOR", "AGI"],
      ["negotiation", "wiz", "luk", "SAG", "CHA"],
    ] as const;
    for (const [type, statA, statB, labelA, labelB] of cases) {
      expect(getEncounterStatPresentation(type)).toMatchObject({ statA, statB, labelA, labelB });
    }
  });
  it("retourne les statistiques attendues pour un piège", () => {
    expect(getEncounterDetails("trap")).toMatchObject({ statA: "agi", statB: "dex" });
  });

  it("sélectionne le héros au meilleur score", () => {
    const result = selectBestHeroForEncounter([hero("weak", 2, 2), hero("strong", 8, 7)], "str", "agi");
    expect(result?.bestHero.id).toBe("strong");
    expect(result?.bestScore).toBe(15);
  });

  it("reste déterministe avec un aléatoire contrôlé", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(rollEncounterForgeMaterial(1)).toMatchObject({ materialId: "refined_metal", rarity: "uncommon" });
    vi.restoreAllMocks();
  });
});
