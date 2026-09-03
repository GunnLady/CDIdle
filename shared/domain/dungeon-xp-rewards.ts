import type { Hero } from "../contracts/game.ts";
import { getPartyXpShare, getRegularEnemyBudget } from "./dungeon-progression.ts";

type XpRecipient = Pick<Hero, "race">;

export type DungeonXpRewardSource =
  | "regular_combat"
  | "elite"
  | "major_boss"
  | "floor_first_clear"
  | "treasure"
  | "rest"
  | "challenge";

export type DungeonXpRewardPolicy = {
  id: string;
  getFloorXpBudget: (floor: number) => number;
  multipliers: Readonly<Record<DungeonXpRewardSource, number>>;
};

export const DUNGEON_XP_REWARD_MODEL_ID = "level-aligned-v2" as const;

const DUNGEON_XP_REWARD_MULTIPLIERS: DungeonXpRewardPolicy["multipliers"] = {
  regular_combat: 1,
  rest: 0.5,
  treasure: 0.75,
  challenge: 1.25,
  elite: 2.5,
  major_boss: 4,
  floor_first_clear: 4,
};

export function getCanonicalDungeonXpBudget(floor: number): number {
  const safeFloor = Math.max(1, Math.floor(Number.isFinite(floor) ? floor : 1));
  if (safeFloor <= 50) return getRegularEnemyBudget(safeFloor).xp;
  return getRegularEnemyBudget(50).xp * Math.pow(1.045, safeFloor - 50);
}

export const CANONICAL_DUNGEON_XP_REWARD_POLICY: DungeonXpRewardPolicy = {
  id: DUNGEON_XP_REWARD_MODEL_ID,
  getFloorXpBudget: getCanonicalDungeonXpBudget,
  multipliers: DUNGEON_XP_REWARD_MULTIPLIERS,
};

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

export function getPolicyXpPool(
  policy: DungeonXpRewardPolicy,
  source: DungeonXpRewardSource,
  floor: number,
  archetypeFactor = 1,
): number {
  return Math.max(
    1,
    Math.round(policy.getFloorXpBudget(floor) * policy.multipliers[source] * archetypeFactor),
  );
}
