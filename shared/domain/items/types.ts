export type CanonicalRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type CanonicalModifierType = "flat" | "percent";
export type CanonicalItemType = "weapon" | "offhand" | "armor" | "accessory";
export type CanonicalEquipmentSlot = "mainHand" | "offHand" | "armor" | "accessory";
export type CanonicalWeaponHandedness = "one_handed" | "two_handed" | "dual_wield";
export type CanonicalWeaponAttackProfile = {
  baseStrikes: 1 | 2;
  powerPerStrike: number;
  maxStrikes: 3;
};
export type CanonicalItemProvenance = "vocation" | "chest" | "boss" | "forge";
export type CanonicalWeaponScalingCategory = "power" | "finesse" | "ranged" | "magic";
export type CanonicalWeaponScalingStat = "str" | "agi" | "dex" | "int" | "wiz";

export type CanonicalWeaponScaling = {
  category: CanonicalWeaponScalingCategory;
  stat: CanonicalWeaponScalingStat;
};

export type CanonicalDamageType =
  | "physical" | "arcane" | "fire" | "ice" | "water" | "earth"
  | "wind" | "lightning" | "holy" | "dark" | "nature" | "sound"
  | "poison" | "blood" | "radiant";

export type CanonicalItemModifier = {
  stat: string;
  type: CanonicalModifierType;
  value: number;
};

export type CanonicalWeaponInfo = {
  id: string;
  name: string;
  handedness: CanonicalWeaponHandedness;
  description: string;
  damageRange?: { min: number; max: number };
  attackSpeed?: number;
  damageTypes?: CanonicalDamageType[];
  modifiers?: CanonicalItemModifier[];
};

export type CanonicalOffHandInfo = {
  id: string;
  name: string;
  category: "shield" | "magic_focus" | "holy_focus" | "nature_focus";
  description: string;
  modifiers?: CanonicalItemModifier[];
};

export type CanonicalArmorInfo = {
  id: string;
  name: string;
  category: "cloth_armor" | "light_armor" | "medium_armor" | "heavy_armor" | "magic_armor";
  description: string;
  modifiers: CanonicalItemModifier[];
};

export type CanonicalAccessoryInfo = {
  id: string;
  name: string;
  category: "ring" | "amulet" | "bracelet" | "belt" | "cloak" | "charm";
  description: string;
  modifiers?: CanonicalItemModifier[];
};

export type CanonicalBaseItem = {
  id: string;
  name: string;
  itemType: CanonicalItemType;
  /** Compatibility alias. New authorities must use minimumRarity. */
  rarity: CanonicalRarity;
  minimumRarity: CanonicalRarity;
  requiredLevel: number;
  description: string;
  modifiers?: CanonicalItemModifier[];
  provenances: CanonicalItemProvenance[];
  blueprintAvailable: boolean;
};

export type CanonicalWeaponItem = CanonicalBaseItem & {
  itemType: "weapon";
  weaponTypeId: string;
  scaling: CanonicalWeaponScaling;
  attackProfile: CanonicalWeaponAttackProfile;
  damageRange?: { min: number; max: number };
  attackSpeed?: number;
  damageTypes?: CanonicalDamageType[];
};

export type CanonicalOffHandItem = CanonicalBaseItem & { itemType: "offhand"; offHandTypeId: string };
export type CanonicalArmorItem = CanonicalBaseItem & { itemType: "armor"; armorTypeId: string };
export type CanonicalAccessoryItem = CanonicalBaseItem & { itemType: "accessory"; accessoryTypeId: string };
export type CanonicalItem = CanonicalWeaponItem | CanonicalOffHandItem | CanonicalArmorItem | CanonicalAccessoryItem;

export type CanonicalStoredItemInstance = {
  instanceId: string;
  itemId: string;
  rarity: CanonicalRarity;
  modifiers?: CanonicalItemModifier[];
};
