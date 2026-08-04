import type {
  CanonicalWeaponAttackProfile,
  CanonicalWeaponScaling,
} from "../../shared/domain/items/types.ts";

const CATEGORY_LABELS = {
  power: "Puissance",
  finesse: "Finesse",
  ranged: "Distance",
  magic: "Magique",
} as const;

const STAT_LABELS = {
  str: "FOR",
  agi: "AGI",
  dex: "DEX",
  int: "INT",
  wiz: "SAG",
} as const;

export function getWeaponScalingLabel(weapon: { scaling: CanonicalWeaponScaling }): string {
  return `${CATEGORY_LABELS[weapon.scaling.category]} (${STAT_LABELS[weapon.scaling.stat]})`;
}

export function formatWeaponAttackSpeed(attackSpeed: number): string {
  return String(attackSpeed).replace(".", ",");
}

export function getWeaponAttackProfileLabel(
  weapon: { attackProfile: CanonicalWeaponAttackProfile },
): string {
  const strikes = weapon.attackProfile.baseStrikes === 1 ? "1 coup" : "2 coups";
  const power = String(weapon.attackProfile.powerPerStrike * 100).replace(".", ",");
  return `${strikes} × ${power} % de puissance`;
}
