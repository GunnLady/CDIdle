import { describe, expect, it } from "vitest";
import {
  calculateExpectedMonsterStrikeCount,
  resolveMonsterAttackProfile,
  resolveMonsterCombatRank,
  rollMonsterStrikeCount,
} from "../shared/domain/monster-combat";
import { resolveAuthoritativeDungeonEncounter } from "../src/domain/authoritativeDungeon";
import { expectedEnemyStrikeCount, type HeroActionContext } from "../src/domain/combatTactics";
import type { Rng } from "../src/domain/random";
import type { DungeonEncounterType } from "../src/types";
import {
  DUNGEON_ENCOUNTER_WEIGHTS,
  getRandomDungeonEncounterType,
} from "../src/utils/dungeonHelpers";
import { makeHero, makeResources } from "./fixtures/game";

const nonFightTypes = Object.keys(DUNGEON_ENCOUNTER_WEIGHTS)
  .filter((kind): kind is Exclude<DungeonEncounterType, "fight"> => kind !== "fight");

function fixedRng(value: number): Rng {
  return {
    next: () => value,
    nextInt: (maxExclusive) => Math.min(maxExclusive - 1, Math.floor(value * maxExclusive)),
  };
}

function tapeRng(values: number[]): Rng {
  let index = 0;
  const consume = () => {
    if (index >= values.length) throw new Error(`RNG_TAPE_EXHAUSTED:${index}`);
    return values[index++];
  };
  return {
    next: consume,
    nextInt: (maxExclusive) => Math.floor(consume() * maxExclusive),
  };
}

function simulateEnemyStrikeCount(
  floor: number,
  profileRoll: number,
): number {
  const finalRoom = floor * 5;
  const majorBoss = floor === 10;
  const rng = tapeRng([
    ...(!majorBoss ? [0] : []), // elite archetype selection
    0.25, // visual monster id
    0.99, // hero critical check
    profileRoll,
    0, // target selection
    0.99, // dodge check
  ]);
  const fixture = makeHero({
    currentHp: 1,
    calculatedStats: {
      ...makeHero().calculatedStats,
      physicalDamage: 1,
      physicalDefense: 0,
      speed: 0,
      criticalChance: 0,
      dodgeChance: 0,
    },
  });
  const result = resolveAuthoritativeDungeonEncounter({
    activeDungeonFloor: floor,
    activeDungeonRoom: finalRoom,
    highestFloorReached: floor,
    heroes: [fixture],
    resources: makeResources(),
    storedItems: [],
    forgeMaterials: [],
    autoExplore: false,
  }, `enemy-profile-${floor}-${profileRoll}`, rng);
  const enemyHit = result.encounter.transcript.find((event) => event.type === "hero.defeated");
  if (!enemyHit) throw new Error("EXPECTED_ENEMY_HIT");
  return Number(enemyHit.strikeCount);
}

describe("monster attack profiles", () => {
  it("preserves the regular floor chance and caps it at 50 percent", () => {
    const firstFloor = resolveMonsterAttackProfile("normal", 1);
    const deepFloor = resolveMonsterAttackProfile("normal", 100);

    expect(firstFloor.bonusStrikeChance).toBe(0);
    expect(deepFloor.bonusStrikeChance).toBe(0.5);
    expect(rollMonsterStrikeCount(firstFloor, () => 0)).toBe(1);
    expect(rollMonsterStrikeCount(deepFloor, () => 0.499)).toBe(2);
    expect(rollMonsterStrikeCount(deepFloor, () => 0.5)).toBe(1);
  });

  it("gives elites 35 percent and bosses 50 percent without exceeding two strikes", () => {
    const elite = resolveMonsterAttackProfile("elite", 50);
    const boss = resolveMonsterAttackProfile("boss", 50);

    expect(elite).toEqual({ baseStrikes: 1, bonusStrikeChance: 0.35, maxStrikes: 2 });
    expect(boss).toEqual({ baseStrikes: 1, bonusStrikeChance: 0.5, maxStrikes: 2 });
    expect(rollMonsterStrikeCount(elite, () => 0.349)).toBe(2);
    expect(rollMonsterStrikeCount(elite, () => 0.35)).toBe(1);
    expect(rollMonsterStrikeCount(boss, () => 0.499)).toBe(2);
    expect(rollMonsterStrikeCount(boss, () => 0.5)).toBe(1);
    expect(calculateExpectedMonsterStrikeCount(elite)).toBe(1.35);
    expect(calculateExpectedMonsterStrikeCount(boss)).toBe(1.5);
  });

  it("shares rank and expected strike resolution with tactical decisions", () => {
    const hero = makeHero();
    const monster = {
      id: "tactical-enemy",
      name: "Tactical enemy",
      hp: 100,
      maxHp: 100,
      atk: 10,
      damageType: "physical" as const,
      def: 0,
      magicDef: 0,
      xpYield: 0,
      goldYield: 0,
      image: "",
      isBoss: true,
    };
    const context = (floor: number, room: number, finalRoom: number): HeroActionContext => ({
      hero,
      heroes: [hero],
      monster,
      floor,
      room,
      finalRoom,
      round: 1,
    });

    expect(resolveMonsterCombatRank(false, false)).toBe("normal");
    expect(resolveMonsterCombatRank(true, false)).toBe("elite");
    expect(resolveMonsterCombatRank(true, true)).toBe("boss");
    expect(expectedEnemyStrikeCount(context(30, 149, 150))).toBe(1.35);
    expect(expectedEnemyStrikeCount(context(30, 150, 150))).toBe(1.5);
  });

  it("uses the resolved elite and boss profiles in authoritative combat", () => {
    expect(simulateEnemyStrikeCount(1, 0.349)).toBe(2);
    expect(simulateEnemyStrikeCount(1, 0.35)).toBe(1);
    expect(simulateEnemyStrikeCount(10, 0.499)).toBe(2);
    expect(simulateEnemyStrikeCount(10, 0.5)).toBe(1);
  });
});

describe("non-combat encounter repetition guard", () => {
  it.each(nonFightTypes)("excludes a previous %s encounter using one RNG draw", (excludedType) => {
    for (let index = 0; index < 1_000; index += 1) {
      let draws = 0;
      const rng: Rng = {
        next: () => {
          draws += 1;
          return index / 1_000;
        },
        nextInt: () => 0,
      };

      expect(getRandomDungeonEncounterType(rng, excludedType)).not.toBe(excludedType);
      expect(draws).toBe(1);
    }
  });

  it("keeps fights repeatable", () => {
    expect(getRandomDungeonEncounterType(fixedRng(0))).toBe("fight");
    expect(getRandomDungeonEncounterType(fixedRng(0.5))).toBe("fight");
  });

  it("allows a non-combat type again after a fight or a different encounter", () => {
    expect(getRandomDungeonEncounterType(fixedRng(0.6))).toBe("trap");
    expect(getRandomDungeonEncounterType(fixedRng(0.6), "treasure")).toBe("trap");
  });

  it("uses canonical encounter history in the authoritative resolver", () => {
    const hero = makeHero({
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 1_000,
        criticalChance: 0,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter({
      activeDungeonFloor: 1,
      activeDungeonRoom: 2,
      highestFloorReached: 1,
      heroes: [hero],
      resources: makeResources(),
      storedItems: [],
      forgeMaterials: [],
      autoExplore: false,
      encounterHistory: [{
        encounterId: "previous-trap",
        kind: "trap",
        floor: 1,
        room: 1,
        outcome: "victory",
        roundCount: 0,
        enemy: null,
        transcript: [],
        rewards: { gold: 0, loot: [] },
      }],
    }, "no-repeated-trap", fixedRng(0.6));

    expect(result.encounter.kind).toBe("fight");
  });

  it("keeps a final room forced to fight regardless of encounter history", () => {
    const hero = makeHero({
      calculatedStats: {
        ...makeHero().calculatedStats,
        physicalDamage: 1_000,
        criticalChance: 0,
      },
    });
    const result = resolveAuthoritativeDungeonEncounter({
      activeDungeonFloor: 1,
      activeDungeonRoom: 5,
      highestFloorReached: 1,
      heroes: [hero],
      resources: makeResources(),
      storedItems: [],
      forgeMaterials: [],
      autoExplore: false,
      encounterHistory: [{
        encounterId: "previous-rest",
        kind: "rest",
        floor: 1,
        room: 4,
        outcome: "victory",
        roundCount: 0,
        enemy: null,
        transcript: [],
        rewards: { gold: 0, loot: [] },
      }],
    }, "forced-final-fight", fixedRng(0.6));

    expect(result.encounter.kind).toBe("fight");
  });
});
