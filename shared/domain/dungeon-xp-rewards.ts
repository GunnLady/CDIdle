import type { Hero } from "../contracts/game.ts";
import { getPartyXpShare } from "./dungeon-progression.ts";

type XpRecipient = Pick<Hero, "race">;

function humanXpMultiplier(hero: XpRecipient): number {
  return hero.race === "Humain" ? 1.15 : 1;
}

export function calculateSharedCombatXp(
  xpPool: number,
  eligibleCount: number,
  hero: XpRecipient,
): number {
  const share = xpPool * getPartyXpShare(eligibleCount);
  return Math.round(share * humanXpMultiplier(hero));
}

export function calculateEvenPartyXp(
  xpPool: number,
  eligibleCount: number,
  hero: XpRecipient,
): number {
  return Math.max(1, Math.round((xpPool / Math.max(1, eligibleCount)) * humanXpMultiplier(hero)));
}

export function getTreasureXpPool(floor: number): number {
  return Math.round(15 * (1 + (floor - 1) * 0.15));
}

export function getRestXpPool(floor: number): number {
  return Math.round(10 * (1 + (floor - 1) * 0.15));
}

export function getSuccessfulChallengeXp(floor: number): number {
  return Math.round(20 * (1 + (floor - 1) * 0.15));
}
