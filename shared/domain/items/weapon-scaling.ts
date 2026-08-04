import type {
  CanonicalWeaponScaling,
  CanonicalWeaponScalingCategory,
} from "./types.ts";

const DEFAULT_SCALING_BY_WEAPON_TYPE: Record<string, CanonicalWeaponScaling> = {
  sword: { category: "power", stat: "str" },
  greatsword: { category: "power", stat: "str" },
  axe: { category: "power", stat: "str" },
  greataxe: { category: "power", stat: "str" },
  mace: { category: "power", stat: "str" },
  greatmace: { category: "power", stat: "str" },
  spear: { category: "power", stat: "str" },
  bo: { category: "power", stat: "str" },
  gauntlets: { category: "power", stat: "str" },
  knuckles: { category: "power", stat: "str" },
  dual_axes: { category: "power", stat: "str" },
  saber: { category: "finesse", stat: "agi" },
  dagger: { category: "finesse", stat: "agi" },
  dual_swords: { category: "finesse", stat: "agi" },
  dual_sabers: { category: "finesse", stat: "agi" },
  dual_daggers: { category: "finesse", stat: "agi" },
  shortbow: { category: "ranged", stat: "dex" },
  longbow: { category: "ranged", stat: "dex" },
  crossbow: { category: "ranged", stat: "dex" },
  basic_rifle: { category: "ranged", stat: "dex" },
  gear_cannon: { category: "ranged", stat: "dex" },
  staff: { category: "magic", stat: "int" },
  wand: { category: "magic", stat: "int" },
  spellbook: { category: "magic", stat: "int" },
  instrument: { category: "magic", stat: "wiz" },
};

/** Authoring default only. Runtime combat always reads the scaling copied onto the item. */
export function getDefaultWeaponScaling(weaponTypeId: string): CanonicalWeaponScaling {
  const scaling = DEFAULT_SCALING_BY_WEAPON_TYPE[weaponTypeId];
  if (!scaling) throw new Error(`UNKNOWN_WEAPON_SCALING:${weaponTypeId}`);
  return { ...scaling };
}

export function isValidWeaponScaling(scaling: unknown): scaling is CanonicalWeaponScaling {
  if (!scaling || typeof scaling !== "object") return false;
  const value = scaling as Partial<CanonicalWeaponScaling>;
  const allowed: Record<CanonicalWeaponScalingCategory, readonly string[]> = {
    power: ["str"],
    finesse: ["agi"],
    ranged: ["dex"],
    magic: ["int", "wiz"],
  };
  return typeof value.category === "string"
    && value.category in allowed
    && typeof value.stat === "string"
    && allowed[value.category as CanonicalWeaponScalingCategory].includes(value.stat);
}
