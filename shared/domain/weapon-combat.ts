import type {
  CanonicalWeaponAttackProfile,
  CanonicalWeaponScaling,
} from "./items/types.ts";

export type WeaponScalingStats = {
  str: number;
  agi: number;
  dex: number;
  int: number;
  wiz: number;
};

export type WeaponOffensiveContext = {
  scaling: CanonicalWeaponScaling;
  attackProfile: CanonicalWeaponAttackProfile;
  damageRange?: { min: number; max: number };
  attackSpeed?: number;
};

export const UNARMED_WEAPON_CONTEXT: WeaponOffensiveContext = {
  scaling: { category: "power", stat: "str" },
  attackProfile: { baseStrikes: 1, powerPerStrike: 1, maxStrikes: 3 },
  damageRange: { min: 1, max: 1 },
  attackSpeed: 1,
};

export function calculateWeaponBasePower(
  stats: WeaponScalingStats,
  scaling: CanonicalWeaponScaling,
): number {
  return Math.max(1, Math.floor(2 + stats[scaling.stat] * 1.3));
}

export function selectWeaponAttackPower(
  stats: { physicalDamage: number; magicDamage: number },
  scaling: CanonicalWeaponScaling,
): number {
  return scaling.category === "magic" ? stats.magicDamage : stats.physicalDamage;
}

export function calculateWeaponStrikePower(
  attackPower: number,
  profile: CanonicalWeaponAttackProfile,
): number {
  return Math.max(1, Math.floor(attackPower * profile.powerPerStrike));
}

export function calculateGuaranteedWeaponPower(
  attackPower: number,
  profile: CanonicalWeaponAttackProfile,
): number {
  return calculateWeaponStrikePower(attackPower, profile) * profile.baseStrikes;
}

export function calculateBonusStrikeChance(
  attackSpeed: number,
  heroSpeed: number,
  profile: CanonicalWeaponAttackProfile,
): number {
  if (profile.baseStrikes >= profile.maxStrikes) return 0;
  return Math.max(0, Math.min(1, (
    (attackSpeed - profile.baseStrikes) * 100 + heroSpeed
  ) / 100));
}

export function calculateExpectedStrikeCount(
  attackSpeed: number,
  heroSpeed: number,
  profile: CanonicalWeaponAttackProfile,
): number {
  return profile.baseStrikes + calculateBonusStrikeChance(attackSpeed, heroSpeed, profile);
}

export function rollWeaponStrikeCount(
  attackSpeed: number,
  heroSpeed: number,
  profile: CanonicalWeaponAttackProfile,
  nextRandom: () => number,
): number {
  const bonusChance = calculateBonusStrikeChance(attackSpeed, heroSpeed, profile);
  if (bonusChance <= 0) return profile.baseStrikes;
  if (bonusChance >= 1) return Math.min(profile.maxStrikes, profile.baseStrikes + 1);
  return nextRandom() < bonusChance
    ? Math.min(profile.maxStrikes, profile.baseStrikes + 1)
    : profile.baseStrikes;
}

export function calculateEstimatedDps(input: {
  attackPower: number;
  attackProfile: CanonicalWeaponAttackProfile;
  damageRange?: { min: number; max: number };
  attackSpeed?: number;
  heroSpeed: number;
  criticalChance: number;
}): number {
  const range = input.damageRange ?? { min: 0, max: 0 };
  const min = Math.ceil(Math.min(range.min, range.max));
  const max = Math.floor(Math.max(range.min, range.max));
  const criticalProbability = Math.max(0, Math.min(100, input.criticalChance)) / 100;
  let expectedDamagePerStrike = 0;
  const outcomeCount = Math.max(1, max - min + 1);
  for (let weaponDamage = min; weaponDamage <= max; weaponDamage += 1) {
    const normalDamage = Math.max(
      1,
      calculateWeaponStrikePower(input.attackPower, input.attackProfile) + weaponDamage,
    );
    const criticalDamage = Math.floor(normalDamage * 1.5);
    expectedDamagePerStrike += (
      normalDamage * (1 - criticalProbability)
      + criticalDamage * criticalProbability
    ) / outcomeCount;
  }
  const expectedStrikes = calculateExpectedStrikeCount(
    input.attackSpeed ?? UNARMED_WEAPON_CONTEXT.attackSpeed!,
    input.heroSpeed,
    input.attackProfile,
  );
  return Number((expectedDamagePerStrike * expectedStrikes).toFixed(2));
}
