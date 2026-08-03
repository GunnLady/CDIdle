export type ProgressionAnchor = {
  floor: number;
  regularAttack: number;
  regularXp: number;
  regularGold: number;
};

export const DUNGEON_PROGRESSION_ANCHORS: readonly ProgressionAnchor[] = [
  { floor: 1, regularAttack: 4, regularXp: 14, regularGold: 4 },
  { floor: 3, regularAttack: 6, regularXp: 18, regularGold: 4 },
  { floor: 5, regularAttack: 8, regularXp: 24, regularGold: 5 },
  { floor: 10, regularAttack: 10, regularXp: 42, regularGold: 6 },
  { floor: 20, regularAttack: 24, regularXp: 126, regularGold: 18 },
  { floor: 30, regularAttack: 45, regularXp: 350, regularGold: 45 },
  { floor: 40, regularAttack: 75, regularXp: 770, regularGold: 105 },
  { floor: 50, regularAttack: 120, regularXp: 1_400, regularGold: 200 },
];

export const MAJOR_BOSS_FLOORS = [10, 20, 30, 40, 50] as const;

export const MAX_DUNGEON_ROOMS = 50;

export function getDungeonRoomCount(floor: number): number {
  const safeFloor = Math.max(1, Math.floor(Number.isFinite(floor) ? floor : 1));
  return Math.min(MAX_DUNGEON_ROOMS, safeFloor * 5);
}

export function isDungeonFinalRoom(floor: number, room: number): boolean {
  return Number.isFinite(room) && Math.floor(room) >= getDungeonRoomCount(floor);
}

const FIRST_CLEAR_GOLD = [50, 70, 100, 130, 180, 200, 220, 240, 270, 320] as const;
const FIRST_CLEAR_XP_POOL = [140, 210, 315, 455, 630, 840, 1_120, 1_400, 1_750, 2_100] as const;

function interpolateValue(
  floor: number,
  field: Exclude<keyof ProgressionAnchor, "floor">,
): number {
  const safeFloor = Math.max(1, Math.floor(floor));
  const upperIndex = DUNGEON_PROGRESSION_ANCHORS.findIndex((anchor) => safeFloor <= anchor.floor);
  if (upperIndex <= 0) return DUNGEON_PROGRESSION_ANCHORS[0][field];
  if (upperIndex < 0) {
    const last = DUNGEON_PROGRESSION_ANCHORS.at(-1)!;
    return last[field] * (1 + (safeFloor - last.floor) * 0.03);
  }
  const lower = DUNGEON_PROGRESSION_ANCHORS[upperIndex - 1];
  const upper = DUNGEON_PROGRESSION_ANCHORS[upperIndex];
  const ratio = (safeFloor - lower.floor) / (upper.floor - lower.floor);
  return lower[field] + (upper[field] - lower[field]) * ratio;
}

export function getRegularEnemyBudget(floor: number) {
  return {
    attack: interpolateValue(floor, "regularAttack"),
    xp: interpolateValue(floor, "regularXp"),
    gold: interpolateValue(floor, "regularGold"),
  };
}

export type DungeonGoldRewardSource = "treasure" | "enigma" | "ambush" | "negotiation";

const DUNGEON_GOLD_REWARD_MULTIPLIERS: Readonly<Record<DungeonGoldRewardSource, number>> = {
  treasure: 2,
  enigma: 2,
  ambush: 1,
  negotiation: 3,
};

export function getDungeonGoldReward(floor: number, source: DungeonGoldRewardSource): number {
  return Math.max(1, Math.round(getRegularEnemyBudget(floor).gold * DUNGEON_GOLD_REWARD_MULTIPLIERS[source]));
}

export function isMajorBossFloor(floor: number): boolean {
  return MAJOR_BOSS_FLOORS.includes(floor as (typeof MAJOR_BOSS_FLOORS)[number])
    || (floor > 50 && floor % 10 === 0);
}

export function getMajorBossIndex(floor: number): number | null {
  const index = MAJOR_BOSS_FLOORS.indexOf(floor as (typeof MAJOR_BOSS_FLOORS)[number]);
  if (index >= 0) return index;
  if (floor > 50 && floor % 10 === 0) return MAJOR_BOSS_FLOORS.length - 1;
  return null;
}

export function getPartyXpShare(activeCount: number): number {
  if (activeCount <= 1) return 1;
  if (activeCount === 2) return 0.5;
  if (activeCount === 3) return 0.4;
  return 0.35;
}

export function getFirstClearRewards(floor: number): { gold: number; xpPool: number } {
  const index = Math.max(0, Math.min(FIRST_CLEAR_GOLD.length - 1, Math.floor(floor) - 1));
  if (floor <= 10) return { gold: FIRST_CLEAR_GOLD[index], xpPool: FIRST_CLEAR_XP_POOL[index] };
  const growth = 1 + (floor - 10) * 0.075;
  return {
    gold: Math.round(FIRST_CLEAR_GOLD.at(-1)! * growth),
    xpPool: Math.round(FIRST_CLEAR_XP_POOL.at(-1)! * growth),
  };
}
