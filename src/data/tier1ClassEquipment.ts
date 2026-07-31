import type { ClassType, ItemInfo } from "../types.ts";
import type { Rng } from "../domain/random.ts";
import { getItemById } from "./items.ts";
import { WEAPON_INFO_LIST } from "./weapons.ts";

export type Tier1ClassType = Exclude<ClassType, "Novice">;

export type Tier1ClassEquipmentPool = {
  weaponIds: readonly string[];
  accessoryIds: readonly string[];
};

export const TIER1_CLASS_EQUIPMENT_POOLS = {
  Guerrier: {
    weaponIds: ["basic_sword", "basic_axe", "basic_mace", "basic_spear"],
    accessoryIds: ["sturdy_travel_belt", "patched_field_belt", "knotted_leather_bracelet"],
  },
  Voleur: {
    weaponIds: ["basic_dagger", "basic_saber"],
    accessoryIds: ["dusty_travel_cloak", "ashwood_bracelet", "cracked_coin_charm"],
  },
  Archer: {
    weaponIds: ["basic_shortbow", "basic_longbow", "basic_crossbow"],
    accessoryIds: ["knotted_leather_bracelet", "ashwood_bracelet", "windworn_cloak"],
  },
  Mage: {
    weaponIds: ["basic_wand", "basic_staff", "basic_spellbook"],
    accessoryIds: ["silver_ring", "copper_focus_ring", "warm_ember_amulet"],
  },
  Acolyte: {
    weaponIds: ["basic_mace", "basic_staff", "basic_spellbook"],
    accessoryIds: ["silver_ring", "warm_ember_amulet", "riverstone_amulet"],
  },
  "Aède": {
    weaponIds: ["basic_lute"],
    accessoryIds: ["silver_ring", "lucky_charm", "windworn_cloak"],
  },
  Druide: {
    weaponIds: ["basic_staff"],
    accessoryIds: ["riverstone_amulet", "ashwood_bracelet", "windworn_cloak"],
  },
  Artificier: {
    weaponIds: ["basic_gear_cannon", "basic_rifle", "basic_crossbow"],
    accessoryIds: ["copper_focus_ring", "warm_ember_amulet", "cracked_coin_charm"],
  },
  Pugiliste: {
    weaponIds: ["basic_knuckles", "basic_gauntlets", "basic_bo"],
    accessoryIds: ["ashwood_bracelet", "knotted_leather_bracelet", "sturdy_travel_belt"],
  },
} as const satisfies Record<Tier1ClassType, Tier1ClassEquipmentPool>;

const TIER1_CLASS_TYPES = Object.keys(TIER1_CLASS_EQUIPMENT_POOLS) as Tier1ClassType[];

const ALLOWED_CLASSES_BY_ITEM = TIER1_CLASS_TYPES.reduce((result, classType) => {
  const pool = TIER1_CLASS_EQUIPMENT_POOLS[classType];
  for (const itemId of [...pool.weaponIds, ...pool.accessoryIds]) {
    const allowed = result.get(itemId) ?? [];
    if (!allowed.includes(classType)) allowed.push(classType);
    result.set(itemId, allowed);
  }
  return result;
}, new Map<string, Tier1ClassType[]>());

export function isTier1ClassType(classType: ClassType | string): classType is Tier1ClassType {
  return Object.prototype.hasOwnProperty.call(TIER1_CLASS_EQUIPMENT_POOLS, classType);
}

export function getTier1ClassEquipmentPool(classType: ClassType | string): Tier1ClassEquipmentPool {
  if (!isTier1ClassType(classType)) throw new Error(`INVALID_TIER1_CLASS:${classType}`);
  return TIER1_CLASS_EQUIPMENT_POOLS[classType];
}

export function getTier1ItemAllowedClasses(itemId: string): readonly Tier1ClassType[] {
  return ALLOWED_CLASSES_BY_ITEM.get(itemId) ?? [];
}

export function canClassEquipTier1Item(classType: ClassType | string, itemId: string): boolean {
  const allowedClasses = getTier1ItemAllowedClasses(itemId);
  return allowedClasses.length === 0 || allowedClasses.includes(classType as Tier1ClassType);
}

export function getTier1ClassItemDefinition(itemId: string): {
  item: ItemInfo;
  slot: "mainHand" | "accessory";
  requiredLevel: number;
  twoHanded: boolean;
  allowedClasses: readonly Tier1ClassType[];
} | null {
  const allowedClasses = getTier1ItemAllowedClasses(itemId);
  if (allowedClasses.length === 0) return null;
  const item = getItemById(itemId);
  if (!item || (item.itemType !== "weapon" && item.itemType !== "accessory")) {
    throw new Error(`INVALID_TIER1_CLASS_ITEM:${itemId}`);
  }
  const weaponInfo = item.itemType === "weapon"
    ? WEAPON_INFO_LIST.find((entry) => entry.id === item.weaponTypeId)
    : undefined;
  if (item.itemType === "weapon" && !weaponInfo) {
    throw new Error(`INVALID_TIER1_WEAPON_TYPE:${itemId}`);
  }
  return {
    item,
    slot: item.itemType === "weapon" ? "mainHand" : "accessory",
    requiredLevel: item.requiredLevel,
    twoHanded: weaponInfo?.handedness === "two_handed" || weaponInfo?.handedness === "dual_wield",
    allowedClasses,
  };
}

export function rollTier1ClassEquipment(
  classType: ClassType | string,
  rng: Pick<Rng, "nextInt">,
): { weaponId: string; accessoryId: string } {
  const pool = getTier1ClassEquipmentPool(classType);
  const weaponId = pool.weaponIds[rng.nextInt(pool.weaponIds.length)];
  const accessoryId = pool.accessoryIds[rng.nextInt(pool.accessoryIds.length)];
  return { weaponId, accessoryId };
}

export function validateTier1ClassEquipmentPools(): string[] {
  const errors: string[] = [];
  for (const classType of TIER1_CLASS_TYPES) {
    const pool = TIER1_CLASS_EQUIPMENT_POOLS[classType];
    const weaponIds: readonly string[] = pool.weaponIds;
    const accessoryIds: readonly string[] = pool.accessoryIds;
    if (weaponIds.length === 0) errors.push(`${classType}:EMPTY_WEAPON_POOL`);
    if (accessoryIds.length === 0) errors.push(`${classType}:EMPTY_ACCESSORY_POOL`);
    if (classType !== "Aède" && classType !== "Druide" && weaponIds.length < 2) {
      errors.push(`${classType}:INSUFFICIENT_WEAPON_CHOICES`);
    }
    for (const itemId of weaponIds) {
      const definition = getTier1ClassItemDefinition(itemId);
      if (!definition || definition.slot !== "mainHand") errors.push(`${classType}:INVALID_WEAPON:${itemId}`);
      else if (definition.requiredLevel > 10) errors.push(`${classType}:WEAPON_LEVEL:${itemId}`);
      else if (definition.item.rarity !== "common") errors.push(`${classType}:WEAPON_RARITY:${itemId}`);
    }
    for (const itemId of accessoryIds) {
      const definition = getTier1ClassItemDefinition(itemId);
      if (!definition || definition.slot !== "accessory") errors.push(`${classType}:INVALID_ACCESSORY:${itemId}`);
      else if (definition.requiredLevel > 10) errors.push(`${classType}:ACCESSORY_LEVEL:${itemId}`);
      else if (definition.item.rarity !== "common") errors.push(`${classType}:ACCESSORY_RARITY:${itemId}`);
    }
  }
  return errors;
}
