import { describe, expect, it } from "vitest";
import {
  resolveAuthoritativeDungeonEncounter,
  type AuthoritativeDungeonState,
} from "../src/domain/authoritativeDungeon";
import type { Rng } from "../src/domain/random";
import { seededRng } from "../src/domain/random";
import { applyHeroExperienceLevels } from "../src/domain/hero";
import { makeHero, makeResources } from "./fixtures/game";
import { generateAuthoritativeNovice } from "../supabase/functions/game-api/novice-authority";

function tapeRng(values: number[]) {
  let index = 0;
  const consume = () => {
    if (index >= values.length) throw new Error(`RNG_TAPE_EXHAUSTED:${index}`);
    const value = values[index++];
    if (value < 0 || value >= 1) throw new Error(`RNG_TAPE_INVALID:${value}`);
    return value;
  };
  const rng: Rng = {
    next: consume,
    nextInt: (maxExclusive) => Math.floor(consume() * maxExclusive),
  };
  return { rng, draws: () => index };
}

function state(overrides: Partial<AuthoritativeDungeonState> = {}): AuthoritativeDungeonState {
  return {
    activeDungeonFloor: 1,
    activeDungeonRoom: 1,
    highestFloorReached: 1,
    resources: { ...makeResources({ gold: 0 }) },
    buildings: { maison_chef: 0 },
    heroes: [makeHero({
      name: "Ariane",
      baseStats: { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 },
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 200,
        hp: 200,
        physicalDamage: 100,
        physicalDefense: 100,
      },
      currentHp: 200,
    })],
    storedItems: [],
    forgeMaterials: [],
    autoExplore: true,
    ...overrides,
  };
}

describe("authoritative dungeon golden behavior characterized from 640f89f", () => {
  it("preserves encounter, monster and combat RNG order for an ordinary fight", () => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // first monster in the floor pool
      0.25, // legacy visual monster id roll retained for deterministic parity
      0.99, // residual multi-strike check
      0.99, // critical check
      0.99, // material drop check -> none
    ]);

    const result = resolveAuthoritativeDungeonEncounter(state(), "golden-fight", tape.rng);

    expect(tape.draws()).toBe(6);
    expect(result.encounter).toMatchObject({
      encounterId: "golden-fight",
      kind: "fight",
      floor: 1,
      room: 1,
      outcome: "victory",
      roundCount: 1,
      enemy: {
        id: "0.25",
        name: "Rat Énorme des Égouts",
        hp: 0,
        maxHp: 48,
        isBoss: false,
      },
      rewards: { gold: 3, loot: [] },
    });
    expect(result.encounter.transcript.map((event) => event.type)).toEqual([
      "encounter.started",
      "hero.hit",
      "encounter.victory",
      "reward.gold",
      "reward.material.none",
      "reward.xp",
    ]);
    expect(result.state).toMatchObject({
      activeDungeonFloor: 1,
      activeDungeonRoom: 2,
      highestFloorReached: 1,
      autoExplore: true,
      resources: { gold: 3 },
    });
  });

  it("forces a major boss at floor 10 without encounter or monster selection rolls", () => {
    const tape = tapeRng([
      0.50, // legacy visual monster id roll retained for deterministic parity
      0.99, // residual multi-strike
      0.99, // critical
      0.00, // boss gold range
      0.00, 0.00, // guaranteed common material and count
      0.00, 0.00, // guaranteed uncommon material and count
      0.99, // rare material skipped
      0.99, 0.99, 0.99, // item lines skipped
      0.99, // blueprint skipped
    ]);
    const result = resolveAuthoritativeDungeonEncounter(state({
      activeDungeonFloor: 10,
      activeDungeonRoom: 50,
      highestFloorReached: 11,
      heroes: [makeHero({
        name: "Ariane",
        baseStats: { str: 500, agi: 1, end: 500, int: 1, wiz: 1, dex: 1, luk: 1 },
        calculatedStats: {
          ...makeHero().calculatedStats,
          maxHp: 2_000,
          hp: 2_000,
          physicalDamage: 2_000,
          speed: 5,
          criticalChance: 0,
        },
        currentHp: 2_000,
      })],
    }), "golden-boss", tape.rng);

    expect(tape.draws()).toBe(13);
    expect(result.encounter).toMatchObject({
      kind: "fight",
      room: 50,
      outcome: "victory",
      enemy: {
        id: "0.5",
        name: "Giga Gobelin 'Roi des Déchets'",
        maxHp: 288,
        isBoss: true,
      },
    });
    expect(result.state).toMatchObject({
      activeDungeonFloor: 11,
      activeDungeonRoom: 1,
      highestFloorReached: 11,
    });
  });

  it("awards the floor-clear bonus only on the first completion", () => {
    const hero = makeHero({
      name: "Ariane",
      currentHp: 100_000,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100_000,
        hp: 100_000,
        physicalDamage: 1_000_000,
        speed: 5,
        criticalChance: 0,
      },
    });
    const first = resolveAuthoritativeDungeonEncounter(state({
      activeDungeonRoom: 5,
      heroes: [hero],
    }), "first-floor-clear", seededRng(42));
    const replay = resolveAuthoritativeDungeonEncounter({
      ...first.state,
      activeDungeonFloor: 1,
      activeDungeonRoom: 5,
      heroes: first.state.heroes?.map((entry) => ({
        ...entry,
        currentHp: entry.calculatedStats.maxHp,
        isActive: true,
        status: "idle",
      })),
    }, "replayed-floor-clear", seededRng(43));

    expect(first.encounter.transcript.some((event) => event.type === "reward.floor_first_clear")).toBe(true);
    expect(first.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "reward.floor_first_clear_xp",
      source: "floor_first_clear",
      floor: 1,
      message: expect.stringContaining("Prime de première sécurisation"),
    }));
    expect(replay.encounter.transcript.some((event) => event.type === "reward.floor_first_clear")).toBe(false);
    expect(replay.encounter.transcript.some((event) => event.type === "reward.floor_first_clear_xp")).toBe(false);
    expect(replay.encounter.transcript.some((event) => event.type === "dungeon.floor_completed")).toBe(false);
  });

  it("preserves the treasure branch and its independent reward rolls", () => {
    const tape = tapeRng([
      0.94, // encounter -> treasure
      0.10, // treasure -> gold
      0.10, // material rarity
      0.00, // material count
    ]);
    const result = resolveAuthoritativeDungeonEncounter(state(), "golden-treasure", tape.rng);

    expect(tape.draws()).toBe(4);
    expect(result.encounter).toMatchObject({
      kind: "treasure",
      outcome: "victory",
      roundCount: 0,
      enemy: null,
      rewards: {
        gold: 8,
        loot: [{
          type: "material",
          materialId: "refined_metal",
          rarity: "uncommon",
          count: 1,
        }],
      },
    });
    expect(result.encounter.transcript.map((event) => event.type)).toEqual([
      "encounter.started",
      "treasure.inspected",
      "treasure.opened",
      "reward.gold",
      "reward.material",
      "reward.xp",
    ]);
  });

  it("preserves the treasure item branch and material rolls", () => {
    const tape = tapeRng([
      0.94, // encounter -> treasure
      0.90, // treasure -> item
      0.00, // common rarity
      0.00, // first eligible item
      0.10, // material rarity
      0.00, // material count
    ]);
    const result = resolveAuthoritativeDungeonEncounter(state(), "golden-treasure-item", tape.rng);

    expect(tape.draws()).toBe(6);
    expect(result.encounter.rewards.loot).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "item", instanceId: "item:dungeon:golden-treasure-item:loot:0", rarity: "common", count: 1 }),
      expect.objectContaining({ type: "material", count: 1 }),
    ]));
    expect(result.state.storedItems).toHaveLength(1);
    expect(result.state.storedItems?.[0].instanceId).toBe("item:dungeon:golden-treasure-item:loot:0");
    expect(result.encounter.transcript.find((event) => event.type === "reward.item")?.message)
      .not.toContain("item:dungeon:golden-treasure-item:loot:0");
  });

  it("applies encounter gold passives to treasure rewards", () => {
    const tape = tapeRng([
      0.94, // encounter -> treasure
      0.10, // treasure -> gold
      0.10, // material rarity
      0.00, // material count
    ]);
    const result = resolveAuthoritativeDungeonEncounter(state({
      heroes: [makeHero({ passiveSkills: ["small_profit"] })],
    }), "golden-treasure-small-profit", tape.rng);

    expect(tape.draws()).toBe(4);
    expect(result.encounter.rewards.gold).toBe(9);
    expect(result.state.resources?.gold).toBe(9);
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "reward.gold",
      gold: 9,
    }));
  });

  it("restores the active party during a rest encounter", () => {
    const hero = makeHero({ currentHp: 1, currentMana: 0 });
    const tape = tapeRng([0.99]); // encounter -> rest
    const result = resolveAuthoritativeDungeonEncounter(state({ heroes: [hero] }), "golden-rest", tape.rng);

    expect(tape.draws()).toBe(1);
    expect(result.encounter.kind).toBe("rest");
    expect(result.encounter.transcript.map((event) => event.type)).toEqual([
      "encounter.started",
      "rest.started",
      "party.restored",
      "reward.xp",
    ]);
    expect(result.state.heroes?.[0].currentHp).toBeGreaterThan(1);
    expect(result.state.heroes?.[0].currentMana).toBeGreaterThan(0);
  });

  it.each([
    ["trap", 0.60, 0, 0],
    ["enigma", 0.67, 8, 15],
    ["ambush", 0.73, 4, 0],
    ["ritual", 0.79, 0, 20],
    ["obstacle", 0.85, 0, 0],
    ["negotiation", 0.90, 12, 0],
  ] as const)("preserves the successful %s challenge branch", (
    kind,
    encounterRoll,
    expectedGold,
    expectedMana,
  ) => {
    const capable = makeHero({
      baseStats: { str: 50, agi: 50, end: 50, int: 50, wiz: 50, dex: 50, luk: 50 },
      currentMana: 0,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxMana: 100,
        mana: 100,
      },
    });
    const tape = tapeRng([
      encounterRoll,
      0.00, // luck roll
      0.99, // no material
    ]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [capable] }),
      `golden-${kind}-success`,
      tape.rng,
    );

    expect(tape.draws()).toBe(3);
    expect(result.encounter).toMatchObject({ kind, outcome: "victory" });
    expect(result.encounter.transcript.map((event) => event.type)).toEqual(expect.arrayContaining([
      "challenge.hero_selected",
      "challenge.attempted",
      "challenge.succeeded",
      `challenge.${kind}.resolved`,
      "reward.material.none",
      "reward.xp",
    ]));
    expect(result.state.resources?.gold).toBe(expectedGold);
    expect(result.state.heroes?.[0].currentMana).toBe(expectedMana);
    expect(result.state.activeDungeonRoom).toBe(2);
  });

  it("applies encounter gold passives to successful non-combat challenges", () => {
    const capable = makeHero({
      passiveSkills: ["small_profit"],
      baseStats: { str: 50, agi: 50, end: 50, int: 50, wiz: 50, dex: 50, luk: 50 },
    });
    const tape = tapeRng([
      0.67, // encounter -> enigma
      0.00, // luck roll
      0.99, // no material
    ]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [capable] }),
      "golden-enigma-small-profit",
      tape.rng,
    );

    expect(tape.draws()).toBe(3);
    expect(result.encounter).toMatchObject({ kind: "enigma", outcome: "victory" });
    expect(result.encounter.rewards.gold).toBe(9);
    expect(result.state.resources?.gold).toBe(9);
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "reward.gold",
      gold: 9,
    }));
  });

  it.each([
    ["trap", 0.60, 11, 20, 50],
    ["enigma", 0.67, 20, 10, 50],
    ["ambush", 0.73, 16, 20, 50],
    ["ritual", 0.79, 18, 5, 50],
    ["obstacle", 0.85, 16, 20, 50],
    ["negotiation", 0.90, 20, 20, 30],
  ] as const)("preserves the failed %s challenge consequence", (
    kind,
    encounterRoll,
    expectedHp,
    expectedMana,
    expectedGold,
  ) => {
    const weak = makeHero({
      baseStats: { str: 1, agi: 1, end: 1, int: 1, wiz: 1, dex: 1, luk: 1 },
      currentHp: 20,
      currentMana: 20,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxMana: 20,
        mana: 20,
      },
    });
    const tape = tapeRng([encounterRoll, 0.00]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [weak], resources: makeResources({ gold: 50 }) }),
      `golden-${kind}-failure`,
      tape.rng,
    );

    expect(tape.draws()).toBe(2);
    expect(result.encounter).toMatchObject({ kind, outcome: "defeat" });
    expect(result.encounter.transcript.map((event) => event.type)).toContain(
      `challenge.${kind}.consequence`,
    );
    expect(result.state.heroes?.[0]).toMatchObject({
      currentHp: expectedHp,
      currentMana: expectedMana,
    });
    expect(result.state.resources?.gold).toBe(expectedGold);
    expect(result.state.activeDungeonRoom).toBe(2);
  });

  it("rejects an incomplete canonical hero instead of inventing combat stats", () => {
    const invalidHero = {
      ...makeHero(),
      calculatedStats: undefined,
    } as unknown as ReturnType<typeof makeHero>;

    expect(() => resolveAuthoritativeDungeonEncounter(
      state({ heroes: [invalidHero] }),
      "invalid-hero",
      tapeRng([0.10]).rng,
    )).toThrow("INVALID_GAME_STATE");
  });

  it("rejects an unknown active skill before consuming RNG or mutating state", () => {
    const source = state({
      heroes: [makeHero({ activeSkills: ["missing_active"] })],
    });
    const before = structuredClone(source);
    const tape = tapeRng([]);

    expect(() => resolveAuthoritativeDungeonEncounter(
      source,
      "invalid-skill",
      tape.rng,
    )).toThrow("INVALID_GAME_STATE");
    expect(tape.draws()).toBe(0);
    expect(source).toEqual(before);
  });

  it("rejects the combat limit atomically without mutating the source state", () => {
    const durableHero = makeHero({
      currentHp: 1_000_000,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 1_000_000,
        hp: 1_000_000,
        physicalDamage: 0,
        physicalDefense: 1_000_000,
        magicDefense: 1_000_000,
      },
    });
    const source = state({
      activeDungeonRoom: 5,
      heroes: [durableHero],
    });
    const before = structuredClone(source);
    const rng: Rng = {
      next: () => 0.99,
      nextInt: (maxExclusive) => Math.max(0, maxExclusive - 1),
    };

    expect(() => resolveAuthoritativeDungeonEncounter(
      source,
      "combat-limit",
      rng,
    )).toThrow("COMBAT_LIMIT_REACHED");
    expect(source).toEqual(before);
  });

  it("propagates RNG failures instead of silently replacing the encounter with a fight", () => {
    const failure = new Error("RNG_EXHAUSTED");
    const rng: Rng = {
      next: () => {
        throw failure;
      },
      nextInt: () => {
        throw failure;
      },
    };

    expect(() => resolveAuthoritativeDungeonEncounter(state(), "rng-failure", rng)).toThrow(failure);
  });

  it("uses a useful offensive skill with an explicit critical roll", () => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // monster
      0.25, // visual id
      0.00, // skill critical
      0.99, // material drop -> none
    ]);
    const result = resolveAuthoritativeDungeonEncounter(state({
      heroes: [makeHero({
        name: "Ariane",
        activeSkills: ["heavy_blow"],
        currentMana: 100,
        baseStats: { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 },
        calculatedStats: {
          ...makeHero().calculatedStats,
          maxHp: 200,
          hp: 200,
          maxMana: 100,
          mana: 100,
          physicalDamage: 35,
          physicalDefense: 100,
          criticalChance: 50,
        },
        currentHp: 200,
      })],
    }), "golden-skill", tape.rng);

    expect(tape.draws()).toBe(5);
    expect(result.encounter.transcript.map((event) => event.type)).toEqual([
      "encounter.started",
      "hero.skill.damage",
      "encounter.victory",
      "reward.gold",
      "reward.material.none",
      "reward.xp",
    ]);
    expect(result.encounter.transcript[1]).toMatchObject({
      heroName: "Ariane",
      skillId: "heavy_blow",
      damageType: "physical",
      round: 1,
      criticalHitCount: 1,
      hitResults: [{ hit: 1, critical: true, damage: expect.any(Number) }],
    });
    expect(result.encounter.transcript[1].message).toMatch(/^\[Coup critique\]/);
  });

  it("coordinates a healer and a magical damage dealer in an ordinary room", () => {
    const healer = makeHero({
      id: "healer",
      name: "Healer",
      activeSkills: ["minor_heal"],
      passiveSkills: ["healing_grace"],
      currentMana: 100,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100,
        hp: 100,
        maxMana: 100,
        mana: 100,
        magicDamage: 20,
        physicalDamage: 1,
      },
      currentHp: 100,
    });
    const mage = makeHero({
      id: "mage",
      name: "Mage",
      activeSkills: ["fire_bolt"],
      currentMana: 100,
      currentHp: 10,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100,
        hp: 100,
        maxMana: 100,
        mana: 100,
        magicDamage: 50,
        physicalDamage: 1,
      },
    });
    const tape = tapeRng([0.10, 0.00, 0.25, 0.99, 0.99]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [healer, mage] }),
      "golden-healer-mage",
      tape.rng,
    );

    expect(tape.draws()).toBe(5);
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "hero.skill.heal",
      heroId: "healer",
      targetHeroId: "mage",
      healing: 34,
    }));
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "hero.skill.damage",
      heroId: "mage",
      skillId: "fire_bolt",
    }));
  });

  it("keeps the last strong attack in reserve near the boss", () => {
    const hero = makeHero({
      id: "reserved",
      activeSkills: ["heavy_blow"],
      currentMana: 14,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxMana: 100,
        mana: 100,
        physicalDamage: 100,
        physicalDefense: 100,
        speed: 0,
        criticalChance: 0,
      },
    });
    const tape = tapeRng([0.10, 0.00, 0.25, 0.99, 0.99]);
    const result = resolveAuthoritativeDungeonEncounter(state({
      activeDungeonRoom: 4,
      heroes: [hero],
    }), "golden-low-mana-near-boss", tape.rng);

    expect(result.state.heroes?.[0].currentMana).toBe(14);
    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "hero.hit",
      heroId: "reserved",
      decisionReason: expect.stringMatching(/normal_attack_lethal|mana_preserved/),
    }));
  });

  it("carries spent mana across consecutive rooms", () => {
    const hero = makeHero({
      id: "persistent-mana",
      activeSkills: ["heavy_blow"],
      currentMana: 100,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxMana: 100,
        mana: 100,
        physicalDamage: 35,
        physicalDefense: 100,
      },
    });
    const firstTape = tapeRng([0.10, 0.00, 0.25, 0.99, 0.99]);
    const first = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [hero] }),
      "golden-mana-room-1",
      firstTape.rng,
    );
    const secondTape = tapeRng([
      0.10, 0.00, 0.25,
      0.99, 0.99,
      0.99, 0.99, 0.99,
      0.99, 0.99,
      0.99,
    ]);
    const second = resolveAuthoritativeDungeonEncounter(
      first.state,
      "golden-mana-room-2",
      secondTape.rng,
    );

    expect(first.state.heroes?.[0].currentMana).toBe(86);
    expect(second.state.heroes?.[0].currentMana).toBe(86);
    expect(second.state.heroes?.[0].cooldowns).toEqual({ heavy_blow: 1 });
    expect(second.state.activeDungeonRoom).toBe(3);
  });

  it("replays the same tactical encounter identically", () => {
    const initial = state({
      heroes: [makeHero({
        activeSkills: ["heavy_blow"],
        currentMana: 100,
        calculatedStats: {
          ...makeHero().calculatedStats,
          maxMana: 100,
          mana: 100,
          physicalDamage: 35,
          physicalDefense: 100,
        },
      })],
    });
    const first = resolveAuthoritativeDungeonEncounter(
      initial,
      "golden-tactical-replay",
      seededRng(0x850090),
    );
    const replay = resolveAuthoritativeDungeonEncounter(
      initial,
      "golden-tactical-replay",
      seededRng(0x850090),
    );

    expect(replay).toEqual(first);
  });

  it("does not use a persisted estimatedDps value to resolve combat", () => {
    const initial = state();
    const hero = initial.heroes?.[0];
    if (!hero) throw new Error("TEST_HERO_REQUIRED");
    const tampered = state({
      heroes: [{
        ...hero,
        calculatedStats: { ...hero.calculatedStats, estimatedDps: 999_999 },
      }],
    });

    const reference = resolveAuthoritativeDungeonEncounter(
      initial,
      "golden-dps-reference",
      seededRng(0x850091),
    );
    const falsified = resolveAuthoritativeDungeonEncounter(
      tampered,
      "golden-dps-reference",
      seededRng(0x850091),
    );

    expect(falsified.encounter).toEqual(reference.encounter);
  });

  it("uses magic power instead of physical power for a magical weapon normal attack", () => {
    const magicalHero = makeHero({
      activeSkills: [],
      equipment: {
        mainHand: { instanceId: "magic-staff", itemId: "basic_staff", rarity: "common" },
      },
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 200,
        hp: 200,
        physicalDamage: 1,
        magicDamage: 100,
        physicalDefense: 100,
        criticalChance: 0,
      },
      currentHp: 200,
    });
    const physicalOnlyHero = {
      ...magicalHero,
      calculatedStats: {
        ...magicalHero.calculatedStats,
        physicalDamage: 100,
        magicDamage: 1,
      },
    };
    const magical = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [magicalHero] }),
      "golden-magic-weapon",
      tapeRng([0.10, 0.00, 0.25, ...Array(1_000).fill(0.99)]).rng,
    );
    const physicalOnly = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [physicalOnlyHero] }),
      "golden-magic-weapon",
      tapeRng([0.10, 0.00, 0.25, ...Array(1_000).fill(0.99)]).rng,
    );
    const magicalHit = magical.encounter.transcript.find((event) => event.type === "hero.hit");
    const physicalOnlyHit = physicalOnly.encounter.transcript.find((event) => event.type === "hero.hit");

    expect(Number(magicalHit?.damage)).toBeGreaterThan(Number(physicalOnlyHit?.damage));
  });

  it.each([
    ["double_cut", 2],
    ["rapid_combo", 5],
  ] as const)("details every impact of the %s multi-hit skill", (skillId, hitCount) => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // monster
      0.25, // visual id
      ...Array.from({ length: hitCount }, (_, index) => index === 0 ? 0.00 : 0.99),
      0.99, // material drop -> none
    ]);
    const result = resolveAuthoritativeDungeonEncounter(state({
      heroes: [makeHero({
        name: "Ariane",
        activeSkills: [skillId],
        currentMana: 100,
        calculatedStats: {
          ...makeHero().calculatedStats,
          maxHp: 200,
          hp: 200,
          maxMana: 100,
          mana: 100,
          physicalDamage: 30,
          physicalDefense: 100,
          criticalChance: 50,
        },
        currentHp: 200,
      })],
    }), `golden-${skillId}`, tape.rng);
    const event = result.encounter.transcript.find((entry) => entry.type === "hero.skill.damage");

    expect(event).toMatchObject({
      skillId,
      hitCount,
      criticalHitCount: 1,
      hitResults: expect.arrayContaining([
        expect.objectContaining({ hit: 1, critical: true }),
        expect.objectContaining({ hit: 2, critical: false }),
      ]),
    });
    const hitResults = event?.hitResults as Array<{ damage: number }>;
    expect(hitResults).toHaveLength(hitCount);
    expect(event?.damage).toBe(hitResults.reduce((sum, hit) => sum + hit.damage, 0));
    expect(event?.message).toContain(`${hitCount} fois`);
    expect(event?.message).toContain("[critique]");
    expect(event?.message).toContain(`(${event?.damage} au total)`);
  });

  it("applies and expires a defensive buff during a complete boss fight", () => {
    const defender = makeHero({
      id: "defender",
      name: "Defender",
      activeSkills: ["guard_stance"],
      currentMana: 100,
      currentHp: 100_000,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100_000,
        hp: 100_000,
        maxMana: 100,
        mana: 100,
        physicalDamage: 200,
        physicalDefense: 40,
        magicDefense: 100,
        speed: 0,
        criticalChance: 0,
        dodgeChance: 0,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(state({
      activeDungeonFloor: 50,
      activeDungeonRoom: 50,
      highestFloorReached: 51,
      heroes: [defender],
    }), "golden-temporary-buff", seededRng(0x850085));
    const enemyHits = result.encounter.transcript.filter((event) => event.type === "enemy.hit");

    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "hero.skill.buff",
      skillId: "guard_stance",
      decisionReason: "useful_combat_buff",
    }));
    expect(enemyHits.some((event) => event.defense === 50)).toBe(true);
    expect(enemyHits.some((event) => event.defense === 40)).toBe(true);
  });

  it("applies and expires an offensive debuff during a complete boss fight", () => {
    const support = makeHero({
      id: "support",
      name: "Support",
      activeSkills: ["weakening_shout"],
      currentMana: 100,
      currentHp: 100_000,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100_000,
        hp: 100_000,
        maxMana: 100,
        mana: 100,
        physicalDamage: 200,
        physicalDefense: 0,
        magicDefense: 0,
        speed: 0,
        criticalChance: 0,
        dodgeChance: 0,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(state({
      activeDungeonFloor: 50,
      activeDungeonRoom: 50,
      highestFloorReached: 51,
      heroes: [support],
    }), "golden-temporary-debuff", seededRng(0x850086));
    const enemyDamage = result.encounter.transcript
      .filter((event) => event.type === "enemy.hit")
      .map((event) => Number(event.damage));

    expect(result.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "hero.skill.debuff",
      skillId: "weakening_shout",
      decisionReason: "useful_combat_debuff",
    }));
    expect(Math.min(...enemyDamage)).toBeLessThan(Math.max(...enemyDamage));
  });

  it("forces enemy strikes onto a surviving provocateur", () => {
    const tank = makeHero({
      id: "tank",
      name: "Tank",
      activeSkills: ["provocation"],
      currentMana: 100,
      currentHp: 1_000,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 1_000,
        hp: 1_000,
        maxMana: 100,
        mana: 100,
        physicalDamage: 100,
        physicalDefense: 20,
        speed: 0,
        criticalChance: 0,
        dodgeChance: 0,
      },
    });
    const fragile = makeHero({
      id: "fragile",
      name: "Fragile",
      currentHp: 10,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100,
        hp: 100,
        physicalDamage: 100,
        physicalDefense: 0,
        speed: 0,
        criticalChance: 0,
        dodgeChance: 0,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(state({
      activeDungeonFloor: 10,
      activeDungeonRoom: 50,
      highestFloorReached: 11,
      heroes: [tank, fragile],
    }), "golden-provocation", seededRng(0x850091));
    const tauntIndex = result.encounter.transcript.findIndex((event) => (
      event.type === "hero.skill.buff" && event.skillId === "provocation"
    ));
    const firstEnemyHit = result.encounter.transcript.find((event, index) => (
      index > tauntIndex && event.type === "enemy.hit"
    ));

    expect(tauntIndex).toBeGreaterThanOrEqual(0);
    expect(result.encounter.transcript[tauntIndex]).toMatchObject({
      targetHeroIds: ["tank"],
      decisionReason: "taunt_protects_ally",
    });
    expect(firstEnemyHit).toMatchObject({ heroId: "tank" });
  });

  it("preserves a useful healing action before the next hero attacks", () => {
    const healer = makeHero({
      name: "Healer",
      activeSkills: ["minor_heal"],
      currentMana: 100,
      currentHp: 100,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 200,
        hp: 200,
        maxMana: 100,
        mana: 100,
        magicDamage: 100,
        physicalDamage: 1,
      },
    });
    const woundedFinisher = makeHero({
      id: "wounded-finisher",
      name: "Wounded",
      currentHp: 20,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100,
        hp: 100,
        physicalDamage: 100,
        speed: 0,
        criticalChance: 0,
      },
    });
    const tape = tapeRng([
      0.10, // encounter
      0.00, // monster
      0.25, // visual id
      0.99, // finisher critical
      0.99, // no material
    ]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [healer, woundedFinisher] }),
      "golden-heal",
      tape.rng,
    );

    expect(tape.draws()).toBe(5);
    expect(result.encounter.transcript.map((event) => event.type)).toContain("hero.skill.heal");
    expect(result.state.heroes?.find((hero) => hero.id === "wounded-finisher")?.currentHp)
      .toBeGreaterThan(20);
  });

  it("heals every living ally and persists the group-heal mana and cooldown", () => {
    const healer = makeHero({
      id: "healer",
      name: "Healer",
      activeSkills: ["soothing_song"],
      currentHp: 100,
      currentMana: 100,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 200,
        hp: 200,
        maxMana: 100,
        mana: 100,
        magicDamage: 100,
        physicalDamage: 1,
      },
    });
    const finisher = makeHero({
      id: "finisher",
      name: "Finisher",
      currentHp: 20,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100,
        hp: 100,
        physicalDamage: 100,
        speed: 0,
        criticalChance: 0,
      },
    });
    const wounded = makeHero({
      id: "wounded",
      name: "Wounded",
      currentHp: 20,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100,
        hp: 100,
        physicalDamage: 1,
      },
    });
    const tape = tapeRng([
      0.10, // encounter
      0.00, // monster
      0.25, // visual id
      0.99, // finisher critical
      0.99, // no material
    ]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [healer, finisher, wounded] }),
      "golden-group-heal",
      tape.rng,
    );

    expect(tape.draws()).toBe(5);
    expect(result.encounter.transcript.filter((event) => event.type === "hero.skill.heal"))
      .toHaveLength(3);
    expect(result.state.heroes?.find((hero) => hero.id === "healer")).toMatchObject({
      currentMana: 54,
      cooldowns: { soothing_song: 4 },
    });
    expect(result.state.heroes?.find((hero) => hero.id === "finisher")?.currentHp).toBe(100);
    expect(result.state.heroes?.find((hero) => hero.id === "wounded")?.currentHp).toBe(100);
  });

  it("uses persisted calculated stats and never recalculates them during combat", () => {
    const persistedPower = makeHero({
      baseStats: { str: 1, agi: 1, end: 1, int: 1, wiz: 1, dex: 1, luk: 1 },
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 100,
        speed: 0,
        criticalChance: 0,
      },
    });
    const tape = tapeRng([
      0.10, // encounter
      0.00, // monster
      0.25, // visual id
      0.99, // critical
      0.99, // no material
    ]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [persistedPower] }),
      "golden-persisted-stats",
      tape.rng,
    );

    expect(tape.draws()).toBe(5);
    expect(result.encounter).toMatchObject({ outcome: "victory", roundCount: 1 });
    expect(result.encounter.transcript.find((event) => event.type === "hero.hit")).toMatchObject({
      rawDamage: 101,
    });
  });

  it("limits speed to one bonus strike without extra speed rolls", () => {
    const fastHero = makeHero({
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 100,
        speed: 250,
        criticalChance: 0,
      },
    });
    const tape = tapeRng([
      0.10, // encounter
      0.00, // monster
      0.25, // visual id
      0.99, 0.99, // critical checks only
      0.99, // no material
    ]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [fastHero] }),
      "golden-multistrike",
      tape.rng,
    );

    expect(tape.draws()).toBe(6);
    const hits = result.encounter.transcript.filter((event) => event.type === "hero.hit");
    expect(hits).toHaveLength(2);
    expect(hits.map((event) => event.message)).toEqual([
      "Héros fixture inflige 100 dégâts à Rat Énorme des Égouts.",
      "[Frappe bonus] Héros fixture inflige 100 dégâts à Rat Énorme des Égouts.",
    ]);
  });

  it("guarantees two independently rolled strikes for a dual-wield weapon", () => {
    const dualWieldHero = makeHero({
      equipment: {
        mainHand: { instanceId: "dual-gauntlets", itemId: "basic_gauntlets", rarity: "common" },
      },
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 100,
        speed: 0,
        criticalChance: 50,
      },
    });
    const tape = tapeRng([
      0.10, // encounter
      0.00, // monster
      0.25, // visual id
      0.00, // first weapon damage -> minimum
      0.99, // first strike is normal
      0.00, // second weapon damage -> minimum
      0.00, // second strike is critical
      0.99, // no material
    ]);
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [dualWieldHero] }),
      "golden-dual-wield",
      tape.rng,
    );
    const hits = result.encounter.transcript.filter((event) => event.type.startsWith("hero.hit"));

    expect(tape.draws()).toBe(8);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ strike: 1, strikeCount: 2, critical: false, rawDamage: 72 });
    expect(hits[1]).toMatchObject({
      strike: 2,
      strikeCount: 2,
      critical: true,
      rawDamage: 72,
      message: expect.stringContaining("[Seconde arme] [Coup critique]"),
    });
    expect(Number(hits[0].damage)).toBeLessThan(72);
    expect(Number(hits[1].damage)).toBeLessThan(Math.floor(72 * 1.5));
  });

  it("records a critical hit at the characterized roll position", () => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // monster
      0.25, // visual id
      0.99, // residual multi-strike -> one strike
      0.00, // critical
      0.99, // material drop -> none
    ]);
    const criticalHero = makeHero({
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 100,
        criticalChance: 100,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [criticalHero] }),
      "golden-critical",
      tape.rng,
    );

    expect(tape.draws()).toBe(6);
    expect(result.encounter.transcript[1]).toMatchObject({
      type: "hero.hit.critical",
      message: "[Coup critique] Héros fixture inflige 150 dégâts à Rat Énorme des Égouts.",
      critical: true,
      strike: 1,
      strikeCount: 1,
      round: 1,
    });
  });

  it("announces a critical bonus strike without losing its structured markers", () => {
    const tape = tapeRng([
      0.10, // encounter
      0.00, // monster
      0.25, // visual id
      0.00, 0.00, // critical checks
      0.99, // no material
    ]);
    const fastCriticalHero = makeHero({
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 100,
        speed: 250,
        criticalChance: 100,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(
      state({ heroes: [fastCriticalHero] }),
      "golden-critical-multistrike",
      tape.rng,
    );
    const hits = result.encounter.transcript.filter((event) => event.type === "hero.hit.critical");

    expect(tape.draws()).toBe(6);
    expect(hits).toHaveLength(2);
    expect(hits[1]).toMatchObject({
      message: "[Frappe bonus] [Coup critique] Héros fixture inflige 150 dégâts à Rat Énorme des Égouts.",
      strike: 2,
      strikeCount: 2,
      critical: true,
    });
  });

  it("persists death, resting status and auto-explore shutdown", () => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // monster
      0.25, // visual id
      0.99, // residual multi-strike
      0.99, // critical
      0.99, // normal monster multi-attack roll
      0.00, // target
      0.99, // dodge -> missed
    ]);
    const weakHero = makeHero({
      name: "Ariane",
      baseStats: { str: 1, agi: 1, end: 1, int: 1, wiz: 1, dex: 1, luk: 1 },
      currentHp: 1,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 20,
        hp: 1,
        physicalDamage: 1,
        physicalDefense: 0,
        dodgeChance: 0,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(state({
      heroes: [weakHero],
    }), "golden-death", tape.rng);

    expect(tape.draws()).toBe(8);
    expect(result.encounter.outcome).toBe("defeat");
    expect(result.encounter.transcript.map((event) => event.type)).toEqual([
      "encounter.started",
      "hero.hit",
      "hero.defeated",
      "encounter.defeat",
    ]);
    expect(result.encounter.transcript[2]).toMatchObject({
      message: "Rat Énorme des Égouts inflige 3 dégâts à Ariane (1 → 0/20 PV). Ariane s'écroule et retourne aux dortoirs.",
      damage: 3,
      heroHpBefore: 1,
      heroHp: 0,
      heroMaxHp: 20,
    });
    expect(result.state.heroes?.[0]).toMatchObject({
      currentHp: 0,
      isActive: false,
      status: "resting",
    });
    expect(result.state.autoExplore).toBe(false);
  });

  it("preserves target then dodge roll ordering on enemy retaliation", () => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // monster
      0.25, // visual id
      0.99, // round 1 critical
      0.99, // round 1 enemy multi-attack
      0.00, // round 1 target
      0.00, // round 1 dodge
      0.99, // round 2 critical
      0.99, // material drop -> none
    ]);
    const persistedOnlyHero = makeHero({
      id: "hero-dodger",
      name: "Ariane",
      status: "exploring",
      currentHp: 100,
      currentMana: 0,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 100,
        hp: 100,
        maxMana: 0,
        mana: 0,
        physicalDamage: 30,
        magicDamage: 0,
        speed: 0,
        physicalDefense: 0,
        magicDefense: 0,
        criticalChance: 0,
        dodgeChance: 100,
        resistances: makeHero().calculatedStats.resistances,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(state({
      heroes: [persistedOnlyHero],
    }), "golden-dodge", tape.rng);

    expect(tape.draws()).toBe(9);
    expect(result.encounter.transcript.filter((event) => event.type === "enemy.dodged")).toHaveLength(1);
    expect(result.state.heroes?.[0].currentHp).toBe(100);
  });

  it("consumes growth rolls and applies an unambiguous vocation automatically", () => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // monster
      0.25, // visual id
      0.99, // residual multi-strike
      0.99, // critical
      0.99, // material drop -> none
      0.10, 0.10,
      0.10, 0.10,
      0.10, 0.10,
      ...Array.from({ length: 10 }, () => 0.10),
      0.10, 0.10,
      0.10, 0.10,
    ]);
    const levelingHero = makeHero({
      name: "Ariane",
      level: 9,
      xp: 2562,
      xpNeeded: 2563,
      baseStats: { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 },
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 200,
        hp: 200,
        physicalDamage: 100,
        physicalDefense: 100,
      },
      currentHp: 200,
    });
    const result = resolveAuthoritativeDungeonEncounter(state({
      heroes: [levelingHero],
      buildings: {
        maison_chef: 0,
        guilde: 1,
        caserne: 1,
        temple: 1,
        cercle: 1,
        academie: 1,
        poste_chasse: 1,
        lair: 1,
      },
    }), "golden-level", tape.rng);

    expect(tape.draws()).toBeGreaterThan(16);
    expect(result.state.heroes?.[0].level).toBe(10);
    expect(result.state.heroes?.[0].classType).toBe("Guerrier");
    expect(result.state.heroes?.[0]).toMatchObject({ isActive: true, status: "idle" });
    expect(result.state.heroes?.[0].activeSkills).not.toEqual(levelingHero.activeSkills);
    expect(result.state.heroes?.[0].passiveSkills).not.toEqual(levelingHero.passiveSkills);
    expect(result.encounter.transcript.map((event) => event.type)).toContain("hero.level_up");
    expect(result.encounter.transcript.map((event) => event.type)).not.toContain("hero.vocation_prayer");
    expect(result.encounter.transcript.map((event) => event.type)).toContain("hero.class_changed");
    expect(result.state.pendingClassTransitions ?? []).toHaveLength(0);
    expect(result.state.autoExplore).toBe(true);
    const evolved = result.state.heroes?.[0];
    const levelEvent = result.encounter.transcript.find((event) => event.type === "hero.level_up");
    expect(levelEvent).toMatchObject({
      level: 10,
      levels: [10],
      levelBefore: 9,
      levelAfter: 10,
      hpBefore: 200,
      hpAfter: evolved?.currentHp,
      manaBefore: 10,
      manaAfter: evolved?.currentMana,
      statGains: { str: 5 },
    });
    expect(levelEvent?.message).toBe(
      `Ariane passe niveau 10 ! PV 200/200 → ${evolved?.currentHp}/${evolved?.calculatedStats.maxHp} ; `
        + `Mana 10/10 → ${evolved?.currentMana}/${evolved?.calculatedStats.maxMana} ; `
        + "caractéristiques : FOR +5.",
    );
  });

  it("summarizes a multi-level reward in one authoritative transcript event", () => {
    const tape = tapeRng([
      0.10, // encounter -> fight
      0.00, // Minotaur at floor 30+
      0.25, // visual id
      0.99, // critical
      0.99, // material drop -> none
      ...Array.from({ length: 40 }, () => 0.10), // four Novice levels
    ]);
    const levelingHero = makeHero({
      name: "Ygritte",
      xp: 99,
      currentHp: 100,
      currentMana: 0,
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 200,
        hp: 200,
        maxMana: 100,
        mana: 100,
        physicalDamage: 1_000_000,
        speed: 0,
        criticalChance: 0,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter(state({
      activeDungeonFloor: 30,
      heroes: [levelingHero],
    }), "golden-multi-level", tape.rng);
    const levelEvents = result.encounter.transcript.filter((event) => event.type === "hero.level_up");

    expect(tape.draws()).toBe(25);
    expect(result.state.heroes?.[0].level).toBe(3);
    expect(levelEvents).toHaveLength(1);
    expect(levelEvents[0]).toMatchObject({
      levels: [2, 3],
      levelBefore: 1,
      levelAfter: 3,
      statGains: { str: 10 },
    });
    expect(levelEvents[0].message).toContain("Ygritte gagne 2 niveaux (1 → 3) !");
  });

  it.each([
    ["Guerrier", { caserne: 1 }, { str: 50, agi: 1, end: 50, int: 1, wiz: 1, dex: 1, luk: 1 }],
    ["Voleur", { lair: 1 }, { str: 1, agi: 50, end: 1, int: 1, wiz: 1, dex: 50, luk: 1 }],
    ["Archer", { poste_chasse: 1 }, { str: 1, agi: 50, end: 1, int: 1, wiz: 1, dex: 50, luk: 1 }],
    ["Mage", { academie: 1 }, { str: 1, agi: 1, end: 1, int: 50, wiz: 1, dex: 50, luk: 1 }],
    ["Acolyte", { temple: 1 }, { str: 1, agi: 1, end: 1, int: 1, wiz: 50, dex: 50, luk: 1 }],
    ["Aède", { academie: 1 }, { str: 1, agi: 1, end: 1, int: 50, wiz: 50, dex: 1, luk: 1 }],
    ["Druide", { cercle: 1 }, { str: 1, agi: 1, end: 1, int: 50, wiz: 50, dex: 1, luk: 1 }],
    ["Artificier", { forge: 1 }, { str: 1, agi: 1, end: 1, int: 50, wiz: 1, dex: 50, luk: 1 }],
    ["Pugiliste", { caserne: 1 }, { str: 50, agi: 50, end: 1, int: 1, wiz: 1, dex: 1, luk: 1 }],
  ] as const)("applies the expected unambiguous %s vocation automatically", (
    classType,
    buildings,
    baseStats,
  ) => {
    const tape = tapeRng([
      0.10, 0.00, 0.25, 0.99, 0.99, 0.99,
      ...Array.from({ length: 20 }, () => 0.10),
    ]);
    const levelingHero = makeHero({
      id: `hero-${classType}`,
      level: 9,
      xp: 2562,
      xpNeeded: 2563,
      baseStats,
      activeSkills: ["heavy_blow"],
      passiveSkills: ["survival_instinct"],
      calculatedStats: {
        ...makeHero().calculatedStats,
        maxHp: 200,
        hp: 200,
        maxMana: 100,
        mana: 100,
        physicalDamage: 100,
        physicalDefense: 100,
      },
      currentHp: 200,
      currentMana: 100,
    });

    const result = resolveAuthoritativeDungeonEncounter(state({
      heroes: [levelingHero],
      buildings,
    }), `golden-tier1-${classType}`, tape.rng);
    const evolved = result.state.heroes?.[0];
    expect(tape.draws()).toBeGreaterThan(14);
    expect(evolved?.classType).toBe(classType);
    expect(result.state.pendingClassTransitions ?? []).toHaveLength(0);
    expect(result.encounter.transcript.some((event) => event.type === "hero.class_changed")).toBe(true);
  });

  it("persists a prayer without stopping the hero or auto-exploration", () => {
    const buildings = {
      caserne: 1,
      lair: 1,
      poste_chasse: 1,
      academie: 1,
      temple: 1,
      cercle: 1,
      forge: 1,
    };
    let prayerResult: ReturnType<typeof resolveAuthoritativeDungeonEncounter> | null = null;

    for (let index = 0; index < 500 && !prayerResult; index += 1) {
      let hero = generateAuthoritativeNovice(`prayer-${index}`, `hero-prayer-${index}`) as unknown as ReturnType<typeof makeHero>;
      const levelRng = seededRng(0x72a11 + index * 7919);
      while (hero.level < 9) {
        hero = applyHeroExperienceLevels(hero, hero.xpNeeded, levelRng).hero;
      }
      hero = {
        ...hero,
        xp: hero.xpNeeded - 1,
        isActive: true,
        status: "idle",
        currentHp: 10_000,
        calculatedStats: {
          ...hero.calculatedStats,
          hp: 10_000,
          maxHp: 10_000,
          physicalDamage: 10_000,
          magicDamage: 10_000,
        },
      };
      const result = resolveAuthoritativeDungeonEncounter(
        state({ heroes: [hero], buildings }),
        `golden-prayer-${index}`,
        seededRng(0xc1d1072 + index),
      );
      if ((result.state.pendingClassTransitions?.[0]?.candidates.length ?? 0) > 1) {
        prayerResult = result;
      }
    }

    expect(prayerResult).not.toBeNull();
    expect(prayerResult?.state.autoExplore).toBe(true);
    expect(prayerResult?.state.heroes?.[0]).toMatchObject({
      level: 10,
      classType: "Novice",
      isActive: true,
      status: "idle",
    });
    expect(prayerResult?.state.pendingClassTransitions?.[0].candidates.length).toBeGreaterThan(1);
    expect(prayerResult?.encounter.transcript).toContainEqual(expect.objectContaining({
      type: "hero.vocation_prayer",
      candidates: prayerResult?.state.pendingClassTransitions?.[0].candidates,
    }));
    expect(prayerResult?.state.storedItems).toEqual([]);
  });

  it("preserves a failed stat-check mutation and consumes no reward rolls", () => {
    const tape = tapeRng([
      0.60, // encounter -> trap
      0.00, // luck roll
    ]);
    const source = state({
      heroes: [makeHero({
        name: "Ariane",
        baseStats: { str: 1, agi: 1, end: 1, int: 1, wiz: 1, dex: 1, luk: 1 },
        currentHp: 20,
      })],
    });
    const result = resolveAuthoritativeDungeonEncounter(source, "golden-trap", tape.rng);

    expect(tape.draws()).toBe(2);
    expect(result.encounter).toMatchObject({
      kind: "trap",
      outcome: "defeat",
      rewards: { gold: 0, loot: [] },
    });
    expect(result.encounter.transcript.map((event) => event.type)).toEqual([
      "encounter.started",
      "challenge.hero_selected",
      "challenge.attempted",
      "challenge.failed",
      "challenge.trap.consequence",
    ]);
    expect(result.state.heroes?.[0].currentHp).toBeLessThan(20);
    expect(result.state.activeDungeonRoom).toBe(2);
  });
});
