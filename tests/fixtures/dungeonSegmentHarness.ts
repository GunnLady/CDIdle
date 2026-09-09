import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  CanonicalGameState,
  CanonicalStateTransition,
} from "../../shared/contracts/authoritative";
import { getDungeonRoomCount } from "../../shared/domain/dungeon-progression";
import { createUndercityProgress } from "../../shared/domain/undercity-progression";
import {
  applyDungeonCommand,
  type DungeonRng,
} from "../../supabase/functions/game-api/dungeon-authority";
import { applyIdleAuthority } from "../../supabase/functions/game-api/idle-authority";
import {
  applyTownCommand,
  initialTownState,
} from "../../supabase/functions/game-api/town-authority";
import { makeHero } from "./game";

export const DUNGEON_SEGMENT_HARNESS_SOURCE =
  "docs/development/dungeon-segment-ko-milestone-plan.md";

const contract = readFileSync(
  resolve(process.cwd(), DUNGEON_SEGMENT_HARNESS_SOURCE),
  "utf8",
);

export const DUNGEON_SEGMENT_SCENARIOS = [...contract.matchAll(
  /^#### (H\d{2}) — (.+)$/gm,
)].map((match) => [match[1], match[2]] as const);

export type DungeonSegmentRng = DungeonRng & {
  draws(): number;
};

export function createDungeonSegmentRng(
  prefix: readonly number[] = [0.1, 0, 0.25],
  fallback = 0.99,
): DungeonSegmentRng {
  let drawCount = 0;
  const next = () => {
    const value = prefix[drawCount] ?? fallback;
    drawCount += 1;
    return value;
  };
  return {
    next,
    nextInt(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error("INVALID_HARNESS_RNG_BOUND");
      }
      return Math.min(maxExclusive - 1, Math.floor(next() * maxExclusive));
    },
    draws: () => drawCount,
  };
}

function durableHero(id: string, name: string) {
  const base = makeHero();
  return makeHero({
    id,
    name,
    currentHp: 1_000,
    currentMana: 0,
    calculatedStats: {
      ...base.calculatedStats,
      maxHp: 1_000,
      hp: 1_000,
      maxMana: 0,
      mana: 0,
      physicalDamage: 1,
      magicDamage: 0,
      physicalDefense: 100,
      magicDefense: 100,
      criticalChance: 0,
      dodgeChance: 0,
    },
  });
}

function fragileHero(id: string, name: string) {
  const base = makeHero();
  return makeHero({
    id,
    name,
    currentHp: 1,
    currentMana: 0,
    calculatedStats: {
      ...base.calculatedStats,
      maxHp: 20,
      hp: 20,
      maxMana: 0,
      mana: 0,
      physicalDamage: 1,
      magicDamage: 0,
      physicalDefense: 0,
      magicDefense: 0,
      criticalChance: 0,
      dodgeChance: 0,
    },
  });
}

export function createDungeonSegmentHarnessState(): CanonicalGameState {
  const heroes = [
    durableHero("segment-hero-1", "Aldric"),
    durableHero("segment-hero-2", "Borin"),
    durableHero("segment-hero-3", "Célia"),
    fragileHero("segment-hero-ko", "Diane"),
  ];
  const heroIds = heroes.map((hero) => hero.id);
  return {
    ...initialTownState(0x5e6d3e17),
    heroes,
    activeDungeonFloor: 1,
    activeDungeonRoom: 1,
    highestFloorReached: 1,
    currentEncounter: null,
    encounterHistory: [],
    autoExplore: false,
    dungeonProgress: createUndercityProgress(heroIds),
  };
}

export class DungeonSegmentHarness {
  state: CanonicalGameState;
  capturedSegmentHeroIds: string[] = [];

  constructor(state = createDungeonSegmentHarnessState()) {
    this.state = structuredClone(state);
  }

  hero(heroId: string) {
    const hero = this.state.heroes.find((entry) => entry.id === heroId);
    if (!hero) throw new Error(`HARNESS_HERO_NOT_FOUND:${heroId}`);
    return hero;
  }

  startRoom(commandId = "segment-harness-room"): CanonicalStateTransition {
    this.capturedSegmentHeroIds = this.state.heroes
      .filter((hero) => hero.isActive && hero.currentHp > 0)
      .map((hero) => hero.id);
    const transition = applyDungeonCommand(this.state, {
      type: "dungeon.explore",
      floor: this.state.dungeonProgress.expedition.floor,
      commandId,
    });
    this.state = transition.state;
    return transition;
  }

  resolveRoom(rng = createDungeonSegmentRng()): CanonicalStateTransition {
    const transition = applyDungeonCommand(
      this.state,
      { type: "dungeon.resolve", commandId: "segment-harness-resolve" },
      rng,
    );
    this.state = transition.state;
    return transition;
  }

  recoverFor(seconds: number) {
    const start = new Date("2026-09-09T00:00:00.000Z");
    const result = applyIdleAuthority(
      this.state,
      start.toISOString(),
      new Date(start.getTime() + seconds * 1_000),
    );
    this.state = result.state;
    return result;
  }

  command(command: Record<string, unknown>): CanonicalStateTransition {
    const transition = applyTownCommand(this.state, command);
    this.state = transition.state;
    return transition;
  }

  positionAtFinalRoom(floor: number, autoExplore = false) {
    const heroIds = this.state.heroes.map((hero) => hero.id);
    const dungeonProgress = createUndercityProgress(heroIds, floor - 1);
    dungeonProgress.expedition = {
      ...dungeonProgress.expedition,
      floor,
      room: getDungeonRoomCount(floor),
    };
    this.state = {
      ...this.state,
      heroes: this.state.heroes.map((hero) => ({
        ...hero,
        isActive: true,
        status: "idle",
        currentHp: 10_000,
        calculatedStats: {
          ...hero.calculatedStats,
          maxHp: 10_000,
          hp: 10_000,
          physicalDamage: 1_000_000,
          estimatedDps: 1_000_000,
        },
      })),
      activeDungeonFloor: floor,
      activeDungeonRoom: getDungeonRoomCount(floor),
      highestFloorReached: floor,
      currentEncounter: null,
      autoExplore,
      dungeonProgress,
    };
    return this;
  }

  reachCheckpoint(floor: number, autoExplore = false) {
    this.positionAtFinalRoom(floor, autoExplore);
    this.startRoom(`checkpoint-${floor}`);
    return this.resolveRoom(createDungeonSegmentRng());
  }
}
