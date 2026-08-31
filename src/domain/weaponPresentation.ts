import type {
  CanonicalWeaponAttackProfile,
  CanonicalWeaponScaling,
} from "../../shared/domain/items/types.ts";

const STAT_LABELS = {
  str: "Force",
  agi: "Agilité",
  dex: "Dextérité",
  int: "Intelligence",
  wiz: "Sagesse",
} as const;

export function getWeaponScalingLabel(weapon: { scaling: CanonicalWeaponScaling }): string {
  return STAT_LABELS[weapon.scaling.stat];
}

export function formatWeaponAttackSpeed(attackSpeed: number): string {
  return String(attackSpeed).replace(".", ",");
}

export function getWeaponAttackProfileLabel(
  weapon: { attackProfile: CanonicalWeaponAttackProfile },
): string {
  const power = String(weapon.attackProfile.powerPerStrike * 100).replace(".", ",");
  return `${weapon.attackProfile.baseStrikes} × ${power} %`;
}
