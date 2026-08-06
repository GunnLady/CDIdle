import type { ClassType, ItemInfo } from "../contracts/game.ts";
import type { Rng } from "../domain/random.ts";
import { getItemById } from "../domain/items/items.ts";
import { WEAPON_INFO_LIST } from "../domain/items/weapons.ts";
import {
  TIER1_VOCATION_REWARD_POOLS,
  isVocationRewardItem,
} from "../domain/items/vocation-rewards.ts";

export type Tier1ClassType = Exclude<ClassType, "Novice">;

export type Tier1ClassEquipmentPool = {
  weaponIds: readonly string[];
  accessoryIds: readonly string[];
};

export const TIER1_CLASS_EQUIPMENT_POOLS = TIER1_VOCATION_REWARD_POOLS as
  Record<Tier1ClassType, Tier1ClassEquipmentPool>;

const TIER1_CLASS_TYPES = Object.keys(TIER1_CLASS_EQUIPMENT_POOLS) as Tier1ClassType[];

export function isTier1ClassType(classType: ClassType | string): classType is Tier1ClassType {
  return Object.prototype.hasOwnProperty.call(TIER1_CLASS_EQUIPMENT_POOLS, classType);
}

export function getTier1ClassEquipmentPool(classType: ClassType | string): Tier1ClassEquipmentPool {
  if (!isTier1ClassType(classType)) throw new Error(`INVALID_TIER1_CLASS:${classType}`);
  return TIER1_CLASS_EQUIPMENT_POOLS[classType];
}

export function getTier1ClassItemDefinition(itemId: string): {
  item: ItemInfo;
  slot: "mainHand" | "accessory";
  requiredLevel: number;
  twoHanded: boolean;
} | null {
  if (!isVocationRewardItem(itemId)) return null;
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

