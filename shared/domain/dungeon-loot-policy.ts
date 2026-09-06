import type { Hero } from "../contracts/game.ts";
import { seededRng, type Rng } from "./random.ts";

export type DungeonItemRewardSource = "ordinary-fight" | "final-fight" | "treasure";

const MIN_HERO_LEVEL = 1;
const MAX_HERO_LEVEL = 40;
const LEVELS_PER_BAND = 5;
const MIN_REGULAR_FIGHT_ITEM_CHANCE = 0.05;
const ITEM_CHANCE_PER_BAND = 0.01;

export function getPartyLootBand(heroes: readonly Pick<Hero, "level">[]): number {
  if (heroes.length === 0) throw new Error("EMPTY_LOOT_PARTY");
  const minimumLevel = Math.min(...heroes.map((hero) => hero.level));
  const boundedLevel = Math.max(MIN_HERO_LEVEL, Math.min(MAX_HERO_LEVEL, minimumLevel));
  return Math.floor((boundedLevel - 1) / LEVELS_PER_BAND) + 1;
}

export function getRegularFightItemChance(heroes: readonly Pick<Hero, "level">[]): number {
  const percent = MIN_REGULAR_FIGHT_ITEM_CHANCE * 100
    + ITEM_CHANCE_PER_BAND * 100 * (getPartyLootBand(heroes) - 1);
  return percent / 100;
}

export function createDungeonItemRewardRng(entropy: number, floor: number, room: number): Rng {
  if (!Number.isFinite(entropy) || entropy < 0 || entropy >= 1) throw new Error("INVALID_LOOT_ENTROPY");
  if (!Number.isInteger(floor) || floor < 1 || !Number.isInteger(room) || room < 1) {
    throw new Error("INVALID_DUNGEON_POSITION");
  }
  const entropyBits = Math.floor(entropy * 0x1_0000_0000) >>> 0;
  const seed = (entropyBits ^ Math.imul(floor, 0x9e3779b1) ^ Math.imul(room, 0x85ebca6b) ^ 0x4c4f4f54) >>> 0;
  return seededRng(seed);
}

export function shouldAwardDungeonItem(input: {
  source: DungeonItemRewardSource;
  existingItemCount: number;
  heroes: readonly Pick<Hero, "level">[];
  roll?: number;
}): boolean {
  if (!Number.isInteger(input.existingItemCount) || input.existingItemCount < 0) {
    throw new Error("INVALID_EXISTING_ITEM_COUNT");
  }
  if (input.existingItemCount > 0) return false;
  if (input.source === "final-fight" || input.source === "treasure") return true;
  if (input.roll === undefined || !Number.isFinite(input.roll) || input.roll < 0 || input.roll >= 1) {
    throw new Error("INVALID_LOOT_ROLL");
  }
  return input.roll < getRegularFightItemChance(input.heroes);
}
