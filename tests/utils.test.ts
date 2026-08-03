import { describe, expect, it, vi } from "vitest";
import {
  calculateXpNeeded,
  calculateRates,
  getAvailableTier1Classes,
  addItemToStorage,
  removeItemFromStorage,
  getStoredItemInstance,
  equipItem,
  unequipItem,
  generateNoviceStats,
  generateSingleNoviceHero,
  refreshHeroDerivedStats,
} from "../src/utils/gameCalculations";
import {
  getEncounterDetails,
  getEncounterStatPresentation,
  getRandomDungeonEncounterType,
  rollEncounterForgeMaterial,
  selectBestHeroForEncounter,
} from "../src/utils/dungeonHelpers";
import type { Hero } from "../src/types";
import { getBuildingMaxLevel } from "../src/data/buildings";
import { CLASS_INFO_LIST } from "../src/data/heroes";
import { makeCitizens, makeHero, makeStoredItem } from "./fixtures/game";
import { isCommandSuccess, validateCommandEnvelope, type CommandEnvelope } from "../src/domain/commands";
import { fixedClock, seededRng } from "../src/domain/random";
import { addHeroExperience, canActivateHero, dismissHero, growHeroStats, recruitHero, recruitmentCost, recruitmentEligibility, setHeroActivity } from "../src/domain/hero";
import { assignTier1Skills } from "../src/domain/tier1ClassTransition";
import { applyHeroProgression } from "../src/domain/heroProgression";
import { applyClassTransition, resolveClassTransition } from "../src/domain/classTransition";

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
    expect(calculateXpNeeded(10, "Novice")).toBe(2563);
    expect(calculateXpNeeded(10, "Guerrier")).toBe(3204);
  });

  it("ne débloque aucune classe sans bâtiment requis", () => {
    expect(getAvailableTier1Classes({})).toEqual([]);
  });

  it("calcule les ressources des citoyens et les bonus de district", () => {
    const rates = calculateRates(
      makeCitizens({ woodcutters: 2, farmers: 1, miners: 1 }),
      { scierie: 3, ferme: 4, mine: 2, maison_chef: 1 },
      true,
    );
    expect(rates.wood).toBeCloseTo(6.18, 6);
    expect(rates.food).toBeCloseTo(4.12, 6);
    expect(rates.ore).toBeCloseTo(2.06, 6);
    expect(rates.stone).toBe(0);
  });

  it("ajoute et retire les objets par identité d'instance", () => {
    const storage = [makeStoredItem({ instanceId: "item-a" })];
    addItemToStorage(storage, makeStoredItem({ instanceId: "item-b" }));
    expect(getStoredItemInstance(storage, "item-b")?.itemId).toBe("wooden_sword");
    removeItemFromStorage(storage, "item-a");
    expect(storage.map((item) => item.instanceId)).toEqual(["item-b"]);
  });

  it("équipe puis déséquipe un objet en conservant le stockage", () => {
    const storage = [makeStoredItem({ itemId: "starter_sword" })];
    const hero = makeHero();
    const equipped = equipItem(hero, storage, "item-fixture");
    expect(equipped.equipment?.mainHand?.itemId).toBe("starter_sword");
    expect(equipped.calculatedStats).not.toEqual(hero.calculatedStats);
    expect(storage).toHaveLength(0);
    const unequipped = unequipItem(equipped, storage, "mainHand");
    expect(unequipped.equipment?.mainHand).toBeNull();
    expect(unequipped.calculatedStats).toEqual(refreshHeroDerivedStats(hero).calculatedStats);
    expect(storage).toHaveLength(1);
  });
});

describe("API command contracts", () => {
  it("validates revision and idempotency metadata", () => {
    const envelope: CommandEnvelope = {
      commandId: "cmd-1", idempotencyKey: "idem-1", clientVersion: "test", expectedRevision: 4,
      command: { type: "building.upgrade", buildingId: "habitation" }
    };
    expect(validateCommandEnvelope(envelope)).toEqual([]);
    expect(isCommandSuccess({ ok: true, revision: 5, state: {}, commandId: "cmd-1", replayed: false })).toBe(true);
  });

  it("returns field-level errors for malformed envelopes", () => {
    const errors = validateCommandEnvelope({ commandId: "", idempotencyKey: "", clientVersion: "", expectedRevision: -1, command: {} as never });
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

  it("replays dungeon helper outcomes with an injected RNG", () => {
    expect(rollEncounterForgeMaterial(75, seededRng(42))).toEqual(rollEncounterForgeMaterial(75, seededRng(42)));
    expect(getRandomDungeonEncounterType(seededRng(42))).toBe(getRandomDungeonEncounterType(seededRng(42)));
  });

  it("replays helper gameplay generation with an injected RNG", () => {
    expect(generateNoviceStats(seededRng(9))).toEqual(generateNoviceStats(seededRng(9)));
    expect(generateSingleNoviceHero(["Humain"], seededRng(12))).toEqual(generateSingleNoviceHero(["Humain"], seededRng(12)));
  });
});

describe("hero domain", () => {
  it("calculates recruitment costs predictably", () => {
    expect(recruitmentCost(0)).toBe(100);
    expect(recruitmentCost(3)).toBe(550);
  });

  it("levels heroes with an injected deterministic RNG", () => {
    const hero = makeHero({ id: "hero-1" });
    const leveled = addHeroExperience(hero, hero.xpNeeded, seededRng(7));
    expect(leveled.level).toBe(hero.level + 1);
    expect(leveled.xp).toBe(0);
    expect(leveled.xpNeeded).toBeGreaterThan(0);
  });

  it("does not recalculate persisted hero stats when XP does not level up", () => {
    const hero = makeHero({
      xp: 0,
      xpNeeded: 100,
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 777,
      },
    });
    const progressed = addHeroExperience(hero, 10, seededRng(7));

    expect(progressed.xp).toBe(10);
    expect(progressed.calculatedStats).toEqual(hero.calculatedStats);
  });

  it("recovers part of the hero health after a level-up", () => {
    const hero = makeHero({ id: "hero-hp", currentHp: 1, currentMana: 0 });
    const leveled = addHeroExperience(hero, hero.xpNeeded, seededRng(7));
    expect(leveled.currentHp).toBe(Math.min(
      leveled.calculatedStats.maxHp,
      hero.currentHp + Math.floor(leveled.calculatedStats.maxHp * 0.2),
    ));
    expect(leveled.currentMana).toBe(Math.min(
      leveled.calculatedStats.maxMana,
      hero.currentMana + Math.floor(leveled.calculatedStats.maxMana * 0.3),
    ));
  });

  it("recovers health and mana only once after a multi-level reward", () => {
    const hero = makeHero({ id: "hero-multi", currentHp: 1, currentMana: 0 });
    const leveled = addHeroExperience(hero, 250, seededRng(7));
    expect(leveled.level).toBe(3);
    expect(leveled.xp).toBe(0);
    expect(leveled.currentHp).toBe(Math.min(
      leveled.calculatedStats.maxHp,
      hero.currentHp + Math.floor(leveled.calculatedStats.maxHp * 0.2),
    ));
    expect(leveled.currentMana).toBe(Math.min(
      leveled.calculatedStats.maxMana,
      hero.currentMana + Math.floor(leveled.calculatedStats.maxMana * 0.3),
    ));
  });

  it("consumes two RNG draws per growth point", () => {
    const counted = () => {
      let draws = 0;
      return {
        rng: {
          next: () => { draws += 1; return 0; },
          nextInt: () => { draws += 1; return 0; },
        },
        draws: () => draws,
      };
    };
    const noviceTape = counted();
    const novice = growHeroStats(
      { str: 9, agi: 8, end: 7, int: 6, wiz: 5, dex: 4, luk: 3 },
      "Novice",
      noviceTape.rng,
    );
    expect(noviceTape.draws()).toBe(10);
    expect(novice.str).toBe(14);

    const tier1Tape = counted();
    const warrior = growHeroStats(
      { str: 9, agi: 8, end: 7, int: 6, wiz: 5, dex: 4, luk: 3 },
      "Guerrier",
      tier1Tape.rng,
    );
    expect(tier1Tape.draws()).toBe(16);
    expect(warrior.str).toBe(17);
  });

  it("recomputes a Novice's top three base stats before each gained level", () => {
    const groupRolls = [0.99, 0.99, 0.99, 0.99, 0.99, 0, 0, 0, 0, 0];
    let groupIndex = 0;
    const hero = makeHero({
      baseStats: { str: 3, agi: 3, end: 3, int: 3, wiz: 3, dex: 3, luk: 3 },
      currentHp: 1,
      currentMana: 0,
    });
    const leveled = addHeroExperience(hero, 250, {
      next: () => groupRolls[groupIndex++],
      nextInt: () => 0,
    });

    expect(groupIndex).toBe(10);
    expect(leveled.baseStats).toMatchObject({ int: 13, str: 3, agi: 3, end: 3 });
  });

  it("rejects an empty Tier 1 growth catalog before consuming RNG", () => {
    const warrior = CLASS_INFO_LIST.find((entry) => entry.type === "Guerrier");
    expect(warrior).toBeDefined();
    if (!warrior) return;
    const original = warrior.mainStats;
    let draws = 0;
    try {
      warrior.mainStats = [];
      expect(() => growHeroStats(makeHero().baseStats, "Guerrier", {
        next: () => { draws += 1; return 0; },
        nextInt: () => { draws += 1; return 0; },
      })).toThrow("EMPTY_CLASS_MAIN_STATS:Guerrier");
      expect(draws).toBe(0);
    } finally {
      warrior.mainStats = original;
    }
  });

  it("does not evolve a Novice without an eligible profession building", () => {
    const xpNeeded = calculateXpNeeded(10, "Novice");
    const hero = makeHero({ id: "hero-novice", level: 9, xp: 0, xpNeeded });
    const progression = applyHeroProgression({
      hero,
      xpEarned: xpNeeded,
      rng: seededRng(7),
      buildings: {},
      storedItems: [],
    });
    expect(progression.hero.level).toBe(10);
    expect(progression.hero.classType).toBe("Novice");
    expect(progression.classStayed).toBeDefined();
  });

  it("keeps class transitions out of the experience-only layer", () => {
    const xpNeeded = calculateXpNeeded(10, "Novice");
    const hero = makeHero({
      level: 9,
      xp: 0,
      xpNeeded,
      baseStats: { str: 80, agi: 1, end: 80, int: 1, wiz: 1, dex: 1, luk: 1 },
    });
    const leveled = addHeroExperience(hero, xpNeeded, seededRng(7));
    expect(leveled).toMatchObject({ level: 10, classType: "Novice" });
  });

  it("applies an unambiguous vocation through the progression facade", () => {
    const hero = makeHero({
      id: "hero-delayed-transition",
      level: 10,
      xp: 0,
      xpNeeded: calculateXpNeeded(11, "Novice"),
      baseStats: { str: 80, agi: 1, end: 80, int: 1, wiz: 1, dex: 1, luk: 1 },
    });
    const progression = applyHeroProgression({
      hero,
      xpEarned: hero.xpNeeded,
      rng: seededRng(7),
      buildings: { caserne: 1 },
      storedItems: [],
    });

    expect(progression.hero).toMatchObject({ level: 11, classType: "Guerrier" });
    expect(progression.classChange).toMatchObject({
      fromClass: "Novice",
      toClass: "Guerrier",
      fromTier: 0,
      toTier: 1,
    });
    expect(progression.pendingTransition).toBeUndefined();
  });

  it("describes class transitions independently from their tier policy", () => {
    const hero = makeHero({
      level: 10,
      classType: "Novice",
      baseStats: { str: 80, agi: 1, end: 80, int: 1, wiz: 1, dex: 1, luk: 1 },
    });
    const resolution = resolveClassTransition(hero, { caserne: 1 });
    expect(resolution.transition).toMatchObject({
      fromClass: "Novice",
      toClass: "Guerrier",
      fromTier: 0,
      toTier: 1,
    });
    expect(resolution.pendingTransition).toBeUndefined();
    expect(() => applyClassTransition(hero, {
      fromClass: "Guerrier",
      toClass: "Guerrier",
      fromTier: 0,
      toTier: 1,
      reason: "invalid test",
    }, seededRng(1), [])).toThrow("INVALID_CLASS_TRANSITION");
  });

  it("assigns Tier 1 skills while preserving only the Novice passive", () => {
    const novice = makeHero({
      activeSkills: ["heavy_blow"],
      passiveSkills: ["survival_instinct"],
    });
    const skillTape = () => {
      let draws = 0;
      return {
        rng: {
          next: () => 0,
          nextInt: () => {
            draws += 1;
            return 0;
          },
        },
        draws: () => draws,
      };
    };

    const warriorTape = skillTape();
    const warrior = assignTier1Skills(novice, "Guerrier", warriorTape.rng);
    expect(warriorTape.draws()).toBe(2);
    expect(warrior.activeSkills).toEqual(["cleaving_strike"]);
    expect(warrior.activeSkills).not.toContain("heavy_blow");
    expect(warrior.passiveSkills).toEqual(["survival_instinct", "weapon_training"]);

    const acolyteTape = skillTape();
    const acolyte = assignTier1Skills(novice, "Acolyte", acolyteTape.rng);
    expect(acolyteTape.draws()).toBe(2);
    expect(acolyte.activeSkills).toEqual(["minor_heal", "holy_smite"]);
    expect(acolyte.passiveSkills).toEqual(["survival_instinct", "spiritual_resilience"]);

    const mageTape = skillTape();
    const mage = assignTier1Skills(novice, "Mage", mageTape.rng);
    expect(mageTape.draws()).toBe(3);
    expect(mage.activeSkills).toEqual(["fire_bolt", "ice_shard"]);
    expect(new Set(mage.activeSkills).size).toBe(2);
    expect(mage.passiveSkills).toEqual(["survival_instinct", "arcane_training"]);
  });

  it("enforces recruitment and active-party invariants", () => {
    expect(recruitmentEligibility(0, 99, 1)).toMatchObject({ ok: false, error: "INSUFFICIENT_GOLD" });
    expect(recruitmentEligibility(0, 100, 0)).toMatchObject({ ok: false, error: "GUILD_REQUIRED" });
    expect(recruitmentEligibility(3, 1000, 1)).toMatchObject({ ok: false, error: "CAPACITY_REACHED" });
    expect(canActivateHero(makeHero({ currentHp: 0 }), 0)).toBe(false);
    expect(canActivateHero(makeHero({ currentHp: 10 }), 4)).toBe(false);
    expect(dismissHero([makeHero({ id: "a" }), makeHero({ id: "b" })], "a")).toHaveLength(1);
  });

  it("recruits atomically with an injected hero factory", () => {
    const state = { heroes: [], resources: { gold: 500, food: 0, wood: 0, stone: 0, ore: 0 }, buildings: { guilde: 1 } };
    const hero = makeHero({ id: "recruited" });
    const result = recruitHero(state, () => hero);
    expect(result).toMatchObject({ ok: true, cost: 100, state: { resources: { gold: 400 }, heroes: [hero] } });
  });

  it("enforces active-party capacity and health", () => {
    const target = makeHero({ id: "activity", currentHp: 10, isActive: false });
    expect(setHeroActivity([target], "activity", true)).toMatchObject({ ok: true, heroes: [{ isActive: true }] });
    expect(setHeroActivity([{ ...target, currentHp: 0 }], "activity", true)).toEqual({ ok: false, error: "INVALID_HEALTH" });
    const full = [0, 1, 2, 3].map((index) => ({ ...target, id: `active-${index}`, isActive: true }));
    expect(setHeroActivity([...full, target], "activity", true)).toEqual({ ok: false, error: "ACTIVE_LIMIT" });
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
