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
import { addHeroExperience, canActivateHero, dismissHero, recruitmentCost, recruitmentEligibility } from "../src/domain/hero";
import { addStack, removeStack, type InventoryState } from "../src/domain/inventory";
import { applyUpgradeCost, recycleItem, startBasicCraft } from "../src/domain/forge";
import { advanceRoom, changeFloor, validateDungeonProgress, type DungeonProgressState } from "../src/domain/dungeonProgression";
import { advanceCombatModifiers, calculateMultiStrikeChance, decrementCooldowns, interruptCombat, replayCombatRound, resolveBasicAttack, resolveCombatRound, resolveMultiStrikeCount, resolveSkill, retreatCombat, type CombatState } from "../src/domain/combat";
import { applyIdle, MAX_IDLE_SECONDS, type IdleState } from "../src/domain/idle";

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

const idleState = (overrides: Partial<IdleState> = {}): IdleState => ({
  resources: { gold: 0, food: 0, wood: 0, stone: 0, ore: 0 },
  buildings: { habitation: 1, ferme: 1 },
  citizens: { farmers: 1, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 0 },
  totalCitizensCount: 1,
  districts: {},
  heroes: [],
  citizenGrowthProgress: 0,
  lastProcessedAt: 1000,
  ...overrides,
});

describe("gameCalculations", () => {
  it("applique la production idle, l'immigration et le plafond de 24 heures", () => {
    const result = applyIdle(idleState({ resources: { gold: 0, food: 100, wood: 0, stone: 0, ore: 0 } }), 1020);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.appliedSeconds).toBe(20);
    expect(result.report.citizensAdded).toBe(1);
    expect(result.state.totalCitizensCount).toBe(2);
    expect(result.state.resources.food).toBe(100);
  });

  it("plafonne le temps, recupere les heros et reste idempotent", () => {
    const resting = makeHero({ status: "resting", currentHp: 1, currentMana: 0 });
    const state = idleState({ heroes: [resting], lastProcessedAt: 0 });
    const result = applyIdle(state, MAX_IDLE_SECONDS + 3600);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.discardedSeconds).toBe(3600);
    expect(result.state.heroes[0].currentHp).toBe(20);
    expect(result.state.heroes[0].currentMana).toBe(10);
    expect(applyIdle(result.state, result.state.lastProcessedAt)).toMatchObject({ ok: true, report: { appliedSeconds: 0, discardedSeconds: 0 } });
    expect(state.heroes[0].currentHp).toBe(1);
  });

  it("refuse une horloge qui recule", () => {
    expect(applyIdle(idleState(), 999)).toEqual({ ok: false, error: "CLOCK_ROLLBACK" });
  });

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

  it("recovers part of the hero health after a level-up", () => {
    const hero = makeHero({ id: "hero-hp", currentHp: 1 });
    const leveled = addHeroExperience(hero, hero.xpNeeded, seededRng(7));
    expect(leveled.currentHp).toBeGreaterThan(hero.currentHp);
    expect(leveled.currentHp).toBeLessThanOrEqual(leveled.calculatedStats.maxHp);
  });

  it("does not evolve a Novice without an eligible profession building", () => {
    const hero = makeHero({ id: "hero-novice", level: 9, xp: 0, xpNeeded: 100 });
    const leveled = addHeroExperience(hero, 100, seededRng(7), {});
    expect(leveled.level).toBe(10);
    expect(leveled.classType).toBe("Novice");
  });

  it("enforces recruitment and active-party invariants", () => {
    expect(recruitmentEligibility(0, 99, 1)).toMatchObject({ ok: false, error: "INSUFFICIENT_GOLD" });
    expect(recruitmentEligibility(0, 100, 0)).toMatchObject({ ok: false, error: "GUILD_REQUIRED" });
    expect(recruitmentEligibility(3, 1000, 1)).toMatchObject({ ok: false, error: "CAPACITY_REACHED" });
    expect(canActivateHero(makeHero({ currentHp: 0 }), 0)).toBe(false);
    expect(canActivateHero(makeHero({ currentHp: 10 }), 4)).toBe(false);
    expect(dismissHero([makeHero({ id: "a" }), makeHero({ id: "b" })], "a")).toHaveLength(1);
  });
});

describe("inventory domain", () => {
  const state: InventoryState = { heroes: [], storedItems: [] };
  it("adds and removes stacks atomically", () => {
    const added = addStack(state, "wooden_sword", "common", 2);
    expect(added.ok).toBe(true);
    expect(state.storedItems).toEqual([]);
    if (!added.ok) return;
    expect(removeStack(added.state, "wooden_sword", "common", 3)).toEqual({ ok: false, error: "ITEM_NOT_FOUND" });
    const removed = removeStack(added.state, "wooden_sword", "common", 1);
    expect(removed.ok && removed.state.storedItems[0].count).toBe(1);
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
    const items = [{ itemId: "wooden_sword", rarity: "common" as const, count: 1 }];
    expect(recycleItem(items, [], false, "wooden_sword", "common")).toEqual({ ok: false, error: "FORGE_LOCKED" });
    const result = recycleItem(items, [], true, "wooden_sword", "common");
    expect(result.ok).toBe(true);
    expect(items[0].count).toBe(1);
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
