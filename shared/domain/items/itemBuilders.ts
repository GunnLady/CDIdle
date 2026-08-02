import type {
  CanonicalWeaponItem as WeaponItemInfo,
  CanonicalOffHandItem as OffHandItemInfo,
  CanonicalArmorItem as ArmorItemInfo,
  CanonicalAccessoryItem as AccessoryItemInfo,
  CanonicalRarity as Rarity,
  CanonicalDamageType as DamageType,
} from "./types.ts";
import { createModifiers } from "./modifierBuilder.ts";

export { createModifiers };

const DEFAULT_PROVENANCES = ["chest", "boss", "forge"] as const;

function catalogMetadata(rarity: Rarity) {
  return {
    minimumRarity: rarity,
    provenances: [...DEFAULT_PROVENANCES],
    blueprintAvailable: true,
  };
}

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
    ...catalogMetadata(rarity),
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
    ...catalogMetadata(rarity),
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
    ...catalogMetadata(rarity),
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
    ...catalogMetadata(rarity),
    requiredLevel,
    description,
    modifiers: createModifiers(modifiers)
  };
}
