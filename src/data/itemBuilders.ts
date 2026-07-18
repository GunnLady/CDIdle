import {
  WeaponItemInfo,
  OffHandItemInfo,
  ArmorItemInfo,
  AccessoryItemInfo,
  Rarity,
  DamageType
} from "../types";
import { createModifiers } from "./modifierBuilder";

export { createModifiers };

// Template Factory for weapons
export function createWeapon(
  id: string,
  name: string,
  weaponTypeId: string,
  rarity: Rarity,
  requiredLevel: number,
  description: string,
  min: number,
  max: number,
  attackSpeed: number,
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[],
  damageTypes: DamageType[] = ["physical"]
): WeaponItemInfo {
  return {
    id,
    name,
    itemType: "weapon",
    weaponTypeId,
    rarity,
    requiredLevel,
    description,
    damageRange: { min, max },
    attackSpeed,
    damageTypes,
    modifiers: createModifiers(modifiers)
  };
}

// Template Factory for offhand items
export function createOffhand(
  id: string,
  name: string,
  offHandTypeId: string,
  rarity: Rarity,
  requiredLevel: number,
  description: string,
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[]
): OffHandItemInfo {
  return {
    id,
    name,
    itemType: "offhand",
    offHandTypeId,
    rarity,
    requiredLevel,
    description,
    modifiers: createModifiers(modifiers)
  };
}

// Template Factory for armor pieces
export function createArmor(
  id: string,
  name: string,
  armorTypeId: string,
  rarity: Rarity,
  requiredLevel: number,
  description: string,
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[]
): ArmorItemInfo {
  return {
    id,
    name,
    itemType: "armor",
    armorTypeId,
    rarity,
    requiredLevel,
    description,
    modifiers: createModifiers(modifiers)
  };
}

// Template Factory for accessory pieces
export function createAccessory(
  id: string,
  name: string,
  accessoryTypeId: string,
  rarity: Rarity,
  requiredLevel: number,
  description: string,
  modifiers: { stat: string; type?: "flat" | "percent"; value: number }[]
): AccessoryItemInfo {
  return {
    id,
    name,
    itemType: "accessory",
    accessoryTypeId,
    rarity,
    requiredLevel,
    description,
    modifiers: createModifiers(modifiers)
  };
}
