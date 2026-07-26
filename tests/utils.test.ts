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
  getNoviceClassDecisionPolicy,
  evaluateAutomaticClassChange,
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
import { createInitialGameState, splitGameState, validateGameState } from "../src/domain/gameState";
import { isCommandSuccess, validateCommandEnvelope, type CommandEnvelope } from "../src/domain/commands";
import { fixedClock, seededRng } from "../src/domain/random";
import { addHeroExperience, assignTier1Skills, canActivateHero, dismissHero, growHeroStats, recruitHero, recruitmentCost, recruitmentEligibility, setHeroActivity } from "../src/domain/hero";
import { addItemInstance, removeItemInstance, type InventoryState } from "../src/domain/inventory";
import { applyUpgradeCost, recycleItem, startBasicCraft } from "../src/domain/forge";
import { advanceRoom, changeFloor, validateDungeonProgress, type DungeonProgressState } from "../src/domain/dungeonProgression";
import { advanceCombatModifiers, calculateMultiStrikeChance, decrementCooldowns, interruptCombat, replayCombatRound, resolveBasicAttack, resolveCombatRound, resolveMultiStrikeCount, resolveSkill, retreatCombat, type CombatState } from "../src/domain/combat";

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
  it("applies the novice convergence policy", () => {
    expect(getNoviceClassDecisionPolicy(10)).toEqual({ minScore: 55, gapThreshold: 6 });
    expect(getNoviceClassDecisionPolicy(11)).toEqual({ minScore: 45, gapThreshold: 4 });
    expect(getNoviceClassDecisionPolicy(12)).toEqual({ minScore: 30, gapThreshold: 2 });
    expect(getNoviceClassDecisionPolicy(13)).toEqual({ minScore: 0, gapThreshold: 0 });
  });

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
    const leveled = addHeroExperience(hero, xpNeeded, seededRng(7), {});
    expect(leveled.level).toBe(10);
    expect(leveled.classType).toBe("Novice");
  });

  it("applies the documented Novice convergence through the real evaluator", () => {
    const profile = (level: number, score: number) => makeHero({
      level,
      baseStats: { str: score, agi: 1, end: score, int: 1, wiz: 1, dex: 1, luk: 1 },
    });
    const candidates = Array.from({ length: 40 }, (_, index) => index + 1);
    const decision = (level: number, score: number) =>
      evaluateAutomaticClassChange(profile(level, score), { caserne: 1 }).newClass;

    expect(candidates.some((score) => decision(10, score) === null && decision(11, score) !== null)).toBe(true);
    expect(candidates.some((score) => decision(11, score) === null && decision(12, score) !== null)).toBe(true);
    expect(decision(13, 1)).not.toBeNull();
    expect(evaluateAutomaticClassChange(profile(13, 40), {}).newClass).toBeNull();
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

describe("inventory domain", () => {
  const state: InventoryState = { heroes: [], storedItems: [] };
  it("adds and removes item instances atomically", () => {
    const instance = makeStoredItem({ instanceId: "item-domain" });
    const added = addItemInstance(state, instance);
    expect(added.ok).toBe(true);
    expect(state.storedItems).toEqual([]);
    if (!added.ok) return;
    expect(addItemInstance(added.state, instance)).toEqual({ ok: false, error: "INVALID_ITEM" });
    const removed = removeItemInstance(added.state, "item-domain");
    expect(removed.ok && removed.state.storedItems).toEqual([]);
  });
});

describe("forge domain", () => {
  it("rejects locked or underfunded craft without mutating materials", () => {
    const materials = [{ materialId: "metal_scrap", rarity: "common" as const, count: 6 }];
    expect(startBasicCraft(materials, false, true)).toEqual({ ok: false, error: "FORGE_LOCKED" });
    expect(startBasicCraft(materials, true, true)).toEqual({ ok: false, error: "INSUFFICIENT_MATERIALS" });
    expect(materials[0].count).toBe(6);
  });

  it("consumes only the selected upgrade cost", () => {
    const materials = [
      { materialId: "refined_metal", rarity: "uncommon" as const, count: 3 },
      { materialId: "enchanted_fragment", rarity: "rare" as const, count: 1 }
    ];
    const result = applyUpgradeCost(materials, "uncommon");
    expect(result.ok && result.materials[0].count).toBe(1);
    expect(materials[0].count).toBe(3);
  });

  it("recycles an item only when the forge is unlocked", () => {
    const items = [{ instanceId: "item-recycle", itemId: "wooden_sword", rarity: "common" as const }];
    expect(recycleItem(items, [], false, "item-recycle")).toEqual({ ok: false, error: "FORGE_LOCKED" });
    const result = recycleItem(items, [], true, "item-recycle");
    expect(result.ok).toBe(true);
    expect(items).toHaveLength(1);
  });
});

describe("dungeon progression domain", () => {
  const state: DungeonProgressState = { activeFloor: 2, activeRoom: 49, highestFloorReached: 2 };
  it("advances rooms and unlocks the next floor at room 50", () => {
    const room50 = advanceRoom(state);
    expect(room50.ok && room50.state).toMatchObject({ activeFloor: 2, activeRoom: 50, highestFloorReached: 2 });
    if (!room50.ok) return;
    expect(advanceRoom(room50.state)).toEqual({ ok: true, state: { activeFloor: 3, activeRoom: 1, highestFloorReached: 3 } });
  });

  it("keeps floor navigation bounded and validates state", () => {
    expect(changeFloor({ activeFloor: 1, activeRoom: 1, highestFloorReached: 1 }, "prev")).toEqual({ ok: false, error: "ALREADY_AT_LOWEST_FLOOR" });
    expect(changeFloor(state, "next")).toEqual({ ok: false, error: "FLOOR_NOT_REACHED" });
    expect(validateDungeonProgress({ activeFloor: 0, activeRoom: 51, highestFloorReached: 0 })).toHaveLength(2);
  });
});

describe("combat domain", () => {
  const target = { id: "monster", hp: 20, maxHp: 20, physicalDefense: 1, resistances: { fire: 50 } };
  const profile = {
    id: "hero",
    attackSpeed: 3,
    speed: 0,
    attack: 3,
    damageMin: 2,
    damageMax: 2,
    criticalChance: 0,
    damageTypes: ["physical" as const],
  };

  it("preserves the cumulative multi-strike rule and caps at three hits", () => {
    expect(calculateMultiStrikeChance(1.2, 10)).toBeCloseTo(30);
    expect(resolveMultiStrikeCount(3, 0, seededRng(1))).toBe(3);
    const result = resolveBasicAttack(profile, target, seededRng(1));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.hits).toHaveLength(3);
    expect(result.result.target.hp).toBe(8);
    expect(result.result.hits.map((hit) => hit.sequence)).toEqual([1, 2, 3]);
  });

  it("records deterministic multi-type damage without mutating the target", () => {
    const result = resolveBasicAttack({ ...profile, attackSpeed: 1, damageTypes: ["physical", "fire"] }, { ...target }, seededRng(2));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.hits[0]).toMatchObject({ damage: 3, targetHpAfter: 17 });
    expect(target.hp).toBe(20);
  });

  const combatant = (id: string, hp: number, attack: number) => ({
    id, hp, maxHp: hp, attackSpeed: 1, speed: 0, attack, damageMin: 0, damageMax: 0,
    criticalChance: 0, damageTypes: ["physical" as const], physicalDefense: 0, resistances: {},
  });

  it("resolves a round, records both sides and ends on victory", () => {
    const state: CombatState = { round: 0, heroes: [combatant("hero", 10, 5)], enemy: combatant("enemy", 4, 1), outcome: "active", transcript: [] };
    const result = resolveCombatRound(state, seededRng(3));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.outcome).toBe("victory");
    expect(result.state.transcript).toHaveLength(1);
    expect(state.enemy.hp).toBe(4);
  });

  it("supports defeat and idempotent retreat outcomes", () => {
    const state: CombatState = { round: 0, heroes: [combatant("hero", 2, 1)], enemy: combatant("enemy", 10, 5), outcome: "active", transcript: [] };
    const defeat = resolveCombatRound(state, seededRng(4));
    expect(defeat.ok && defeat.state.outcome).toBe("defeat");
    const retreat = retreatCombat(state);
    expect(retreat.ok).toBe(true);
    if (retreat.ok) expect(retreat.state.outcome).toBe("retreated");
    if (!defeat.ok) return;
    expect(resolveCombatRound(defeat.state, seededRng(4))).toEqual({ ok: false, error: "ALREADY_FINISHED" });
  });

  it("resolves skill damage, hit count, mana and cooldown atomically", () => {
    const skill = { id: "double-flame", name: "Double flame", description: "", type: "active" as const, target: "single_enemy" as const, manaCost: 4, cooldownRounds: 2, effect: { type: "damage" as const, damageType: "fire" as const, scalingStat: "magicDamage", power: 1, hitCount: 2 } };
    const actor = { id: "hero", mana: 10, maxMana: 10, stats: { magicDamage: 5 }, cooldowns: {} };
    const result = resolveSkill(skill, actor, [{ ...target, hp: 20 }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolution.actor).toMatchObject({ mana: 6, cooldowns: { "double-flame": 2 } });
    expect(result.resolution.events).toHaveLength(2);
    expect(result.resolution.events.map((event) => event.sequence)).toEqual([1, 2]);
    expect(result.resolution.targets[0].hp).toBe(16);
    expect(resolveSkill(skill, result.resolution.actor, result.resolution.targets)).toEqual({ ok: false, error: "ON_COOLDOWN" });
  });

  it("rejects skills before mutating mana when unavailable", () => {
    const skill = { id: "heal", name: "Heal", description: "", type: "active" as const, target: "single_ally" as const, manaCost: 5, effect: { type: "heal" as const, scalingStat: "magicDamage", power: 2 } };
    const actor = { id: "hero", mana: 2, maxMana: 10, stats: { magicDamage: 5 }, cooldowns: {} };
    expect(resolveSkill(skill, actor, [{ ...target, hp: 10 }])).toEqual({ ok: false, error: "INSUFFICIENT_MANA" });
    expect(actor.mana).toBe(2);
  });

  it("applies temporary buffs and expires them after their declared rounds", () => {
    const skill = {
      id: "battle-cry", name: "Battle cry", description: "", type: "active" as const,
      target: "single_ally" as const, manaCost: 0,
      effect: { type: "buff" as const, durationRounds: 2, modifiers: [{ stat: "attack", type: "flat" as const, value: 3 }] },
    };
    const original = { ...target, hp: 20 };
    const applied = resolveSkill(skill, { id: "hero", mana: 4, maxMana: 4, stats: {}, cooldowns: {} }, [original]);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.resolution.targets[0].modifiers).toEqual([
      { stat: "attack", type: "flat", value: 3, sourceSkillId: "battle-cry", remainingRounds: 2, effectType: "buff" },
    ]);
    expect("modifiers" in original).toBe(false);
    const afterOne = advanceCombatModifiers(applied.resolution.targets[0]);
    expect(afterOne.modifiers?.[0].remainingRounds).toBe(1);
    const afterTwo = advanceCombatModifiers(afterOne);
    expect(afterTwo.modifiers).toEqual([]);
  });

  it("uses active combat modifiers when resolving a round", () => {
    const state: CombatState = {
      round: 0,
      heroes: [{ ...combatant("hero", 10, 1), modifiers: [{ stat: "attack", type: "flat", value: 3, sourceSkillId: "battle-cry", remainingRounds: 1, effectType: "buff" }] }],
      enemy: combatant("enemy", 100, 1),
      outcome: "active",
      transcript: [],
    };
    const result = resolveCombatRound(state, seededRng(21));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.outcome).toBe("active");
    expect(result.state.heroes[0].modifiers).toEqual([]);
  });

  it("ticks cooldowns without mutating the source and supports interruption", () => {
    const cooldowns = { slash: 2, guard: 1 };
    expect(decrementCooldowns(cooldowns)).toEqual({ slash: 1 });
    expect(cooldowns).toEqual({ slash: 2, guard: 1 });
    const state: CombatState = { round: 0, heroes: [combatant("hero", 10, 1)], enemy: combatant("enemy", 10, 1), outcome: "active", transcript: [] };
    const interrupted = interruptCombat(state, "connection-lost");
    expect(interrupted.ok).toBe(true);
    if (interrupted.ok) expect(interrupted.state).toMatchObject({ outcome: "interrupted", interruptionReason: "connection-lost" });
  });

  it("stops an endless combat at the round limit", () => {
    const state: CombatState = { round: 100, heroes: [combatant("hero", 10, 1)], enemy: combatant("enemy", 10, 1), outcome: "active", transcript: [] };
    expect(resolveCombatRound(state, seededRng(9))).toEqual({ ok: false, error: "ROUND_LIMIT_REACHED" });
  });

  it("replays a round only when its transcript matches", () => {
    const state: CombatState = { round: 0, heroes: [combatant("hero", 10, 1)], enemy: combatant("enemy", 4, 5), outcome: "active", transcript: [] };
    const first = resolveCombatRound(state, seededRng(11));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const events = first.state.transcript;
    expect(replayCombatRound(state, seededRng(11), events).ok).toBe(true);
    expect(replayCombatRound(state, seededRng(11), events.slice(1))).toEqual({ ok: false, error: "TRANSCRIPT_MISMATCH" });
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
