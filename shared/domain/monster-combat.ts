export type MonsterCombatRank = "normal" | "elite" | "boss";

export type MonsterAttackProfile = Readonly<{
  baseStrikes: 1;
  bonusStrikeChance: number;
  maxStrikes: 2;
}>;

export function resolveMonsterCombatRank(
  isBoss: boolean,
  isMajorBoss: boolean,
): MonsterCombatRank {
  if (isMajorBoss) return "boss";
  return isBoss ? "elite" : "normal";
}

export function resolveMonsterAttackProfile(
  rank: MonsterCombatRank,
  floor: number,
): MonsterAttackProfile {
  const bonusStrikeChance = rank === "boss"
    ? 0.5
    : rank === "elite"
      ? 0.35
      : Math.min(0.5, Math.max(0, (floor - 1) * 0.015));

  return { baseStrikes: 1, bonusStrikeChance, maxStrikes: 2 };
}

export function rollMonsterStrikeCount(
  profile: MonsterAttackProfile,
  random: () => number,
): number {
  const bonusStrike = random() < profile.bonusStrikeChance ? 1 : 0;
  return Math.min(profile.maxStrikes, profile.baseStrikes + bonusStrike);
}


export function calculateExpectedMonsterStrikeCount(
  profile: MonsterAttackProfile,
): number {
  return Math.min(profile.maxStrikes, profile.baseStrikes + profile.bonusStrikeChance);
}
