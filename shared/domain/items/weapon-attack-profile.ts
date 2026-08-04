import { WEAPON_INFO_LIST } from "./weapons.ts";
import type {
  CanonicalWeaponAttackProfile,
  CanonicalWeaponHandedness,
} from "./types.ts";

const PROFILES_BY_HANDEDNESS: Record<CanonicalWeaponHandedness, CanonicalWeaponAttackProfile> = {
  one_handed: { baseStrikes: 1, powerPerStrike: 1, maxStrikes: 3 },
  two_handed: { baseStrikes: 1, powerPerStrike: 1.25, maxStrikes: 3 },
  dual_wield: { baseStrikes: 2, powerPerStrike: 0.65, maxStrikes: 3 },
};

export function getDefaultWeaponAttackProfile(weaponTypeId: string): CanonicalWeaponAttackProfile {
  const handedness = WEAPON_INFO_LIST.find((weapon) => weapon.id === weaponTypeId)?.handedness;
  if (!handedness) throw new Error(`UNKNOWN_WEAPON_TYPE:${weaponTypeId}`);
  return { ...PROFILES_BY_HANDEDNESS[handedness] };
}

export function isValidWeaponAttackProfile(input: unknown): input is CanonicalWeaponAttackProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const profile = input as Record<string, unknown>;
  return (profile.baseStrikes === 1 || profile.baseStrikes === 2)
    && typeof profile.powerPerStrike === "number"
    && Number.isFinite(profile.powerPerStrike)
    && profile.powerPerStrike > 0
    && profile.maxStrikes === 3
    && profile.baseStrikes <= profile.maxStrikes;
}
