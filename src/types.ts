/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Resources {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  ore: number;
}

export interface ResourceRates {
  food: number;
  wood: number;
  stone: number;
  ore: number;
}

export interface Building {
  id: string;
  name: string;
  description: string;
  level: number;
  category: "production" | "housing" | "military" | "social";
  icon: string;
  bonusPerLevel?: number;
}

export interface CitizenAllocation {
  woodcutters: number;
  farmers: number;
  miners: number;
  quarrymen: number;
  unassigned: number;
}

export type RaceType =
 | "Humain" | "Elfe" | "Nain" | "Orc" | "Gobelin" | "Homme-Lézard" | "Tieffelin" | "Homme-Bête";

export interface RaceInfo {
  id: string;
  name: RaceType;
  description: string;
}

export type ClassTier = 0 | 1 | 2; // Tier 0 — Novice, Tier 1 — Base Class, Tier 2 — Specialized Class

export type ClassType =
  | "Novice"
  | "Guerrier"
  | "Voleur"
  | "Archer"
  | "Mage"
  | "Acolyte"
  | "Aède"
  | "Druide"
  | "Artificier"
  | "Pugiliste";

export interface EvolutionRequirements {
  minLevelToEvolve: number;
  requiredGoldToEvolve?: number;
  requiredItems?: { itemId: string; count: number }[];
  previousClassId?: ClassType;
}

export interface ClassSkill {
  name: string;
  description: string;
  levelUnlocked: number;
  specialSkillDesc?: string;
  cooldownTurns?: number;
}

export interface HeroStats {
  str: number;
  agi: number;
  end: number;
  int: number;
  wiz: number;
  dex: number;
  luk: number;
}

export type ElementalDamageType = Exclude<DamageType, "physical">;
export type DamageResistances = Record<ElementalDamageType, number>;

export interface CalculatedStats {
  maxHp: number;
  criticalChance: number;
  dodgeChance: number;
  hp: number;
  maxMana: number;
  mana: number;
  physicalDamage: number;
  magicDamage: number;
  speed: number;
  physicalDefense: number;
  magicDefense: number;
  resistances: DamageResistances;
}

export interface ClassInfo {
  type: ClassType;
  name: string;
  description: string;
  tier: ClassTier;
  color: string;
  mainStats: ("str" | "agi" | "end" | "int" | "wiz" | "dex" | "luk")[];
  activeSkills: string[];
  passiveSkills: string[];
  jobChangeBuildingId?: string;
  mainDerivedStats?: (keyof CalculatedStats)[];
}

export interface Hero {
  id: string;
  name: string;
  race: RaceType;
  classType: ClassType;
  level: number;
  xp: number;
  xpNeeded: number;
  currentHp: number;
  currentMana: number;
  baseStats: HeroStats;
  gender?: "Male" | "Female";
  isElite?: boolean;
  isActive: boolean; // in raid party
  status: "idle" | "exploring" | "resting";
  activeSkills: string[];
  passiveSkills: string[];
  calculatedStats: CalculatedStats;
  equipment?: HeroEquipment;
  cooldowns?: Record<string, number>;
}

export type MonsterSkillEffect =
  | {
      kind: "damage";
      damageType: DamageType;
      power: number;
      hitCount?: number;
    }
  | {
      kind: "debuff";
      modifiers: Modifier[];
      durationRounds: number;
    }
  | {
      kind: "heal";
      power: number;
    };

export interface MonsterSkill {
  id: string;
  name: string;
  description: string;
  target: SkillTarget;
  manaCost?: number;
  cooldownRounds?: number;
  effect: MonsterSkillEffect;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  damageType: DamageType;
  def: number;
  magicDef: number;
  resistances?: Partial<Record<ElementalDamageType, number>>;
  skills?: MonsterSkill[];
  xpYield: number;
  goldYield: number;
  image: string;
  isBoss: boolean;
}

export type DungeonEncounterType =
  | "fight"
  | "trap"
  | "enigma"
  | "ambush"
  | "ritual"
  | "obstacle"
  | "negotiation"
  | "treasure"
  | "rest";

export interface BattleLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "combat-hero" | "combat-enemy" | "loot" | "victory" | "defeat";
  category?: "dungeon" | "colony";
}

export interface District {
  id: string;
  name: string;
  description: string;
  cost: Resources;
  isUnlocked: boolean;
  boostType: keyof Resources | "xp" | "combat";
  boostValue: number; // e.g. 0.15 = +15%
}

export interface StoredItemStack {
  itemId: ItemInfo["id"];
  rarity: Rarity;
  count: number;
  modifiers?: Modifier[];
}

export interface EquippedItemRef {
  itemId: ItemInfo["id"];
  rarity: Rarity;
  modifiers?: Modifier[];
}

export interface GameState {
  resources: Resources;
  buildings: { [key: string]: number }; // level map
  citizens: CitizenAllocation;
  totalCitizensCount: number;
  districts: { [key: string]: boolean }; // districtId: unlocked
  heroes: Hero[];
  activeDungeonFloor: number;
  activeDungeonRoom: number; // 1 to 50
  combatTimer: number; // remaining ticks for combat log
  battleLogs: BattleLogEntry[];
  currentMonster: Monster | null;
  autoExplore: boolean;
  highestFloorReached: number;
  soundEnabled: boolean;
  storedItems: StoredItemStack[];
  forgeMaterials: StoredForgeMaterialStack[];
  itemBlueprints: ItemBlueprint[];
}

export type WeaponHandedness =
  | "one_handed"
  | "two_handed"
  | "dual_wield";

export interface WeaponInfo {
  id: string;
  name: string;
  handedness: WeaponHandedness;
  description: string;
  damageRange?: {
    min: number;
    max: number;
  };
  attackSpeed?: number;
  damageTypes?: DamageType[];
  modifiers?: Modifier[];
}

export interface WeaponData {
  weaponTypes: WeaponInfo[];
}

export type OffHandCategory =
  "shield" | "magic_focus" | "holy_focus" | "nature_focus";

export interface OffHandInfo {
  id: string;
  name: string;
  category: OffHandCategory;
  description: string;
  modifiers?: Modifier[];
}

export interface OffHandData {
  offHandTypes: OffHandInfo[];
}

export type ArmorCategory =
  | "cloth_armor"
  | "light_armor"
  | "medium_armor"
  | "heavy_armor"
  | "magic_armor";

export interface ArmorInfo {
  id: string;
  name: string;
  category: ArmorCategory;
  description: string;
  modifiers: Modifier[];
}

export interface ArmorData {
  armorTypes: ArmorInfo[];
}

export type AccessoryCategory =
  | "ring"
  | "amulet"
  | "bracelet"
  | "belt"
  | "cloak"
  | "charm";

export interface AccessoryInfo {
  id: string;
  name: string;
  category: AccessoryCategory;
  description: string;
  modifiers?: Modifier[];
}

export interface AccessoryData {
  accessoryTypes: AccessoryInfo[];
}

export type ItemType =
  | "weapon"
  | "offhand"
  | "armor"
  | "accessory";

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export interface ForgeMaterial {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
}

export interface StoredForgeMaterialStack {
  materialId: ForgeMaterial["id"];
  rarity: Rarity;
  count: number;
}

export interface ForgeState {
  unlocked: boolean;
}

export interface ItemBlueprint {
  itemId: string;
  unlocked: boolean;
}

export interface DamageRange {
  min: number;
  max: number;
}

export interface BaseItemInfo {
  id: string;
  name: string;
  itemType: ItemType;
  rarity: Rarity;
  requiredLevel: number;
  description: string;
  modifiers?: Modifier[];
}

export interface WeaponItemInfo extends BaseItemInfo {
  itemType: "weapon";
  weaponTypeId: WeaponInfo["id"];
  damageRange?: DamageRange;
  attackSpeed?: number;
  damageTypes?: DamageType[];
}

export interface OffHandItemInfo extends BaseItemInfo {
  itemType: "offhand";
  offHandTypeId: OffHandInfo["id"];
}

export interface ArmorItemInfo extends BaseItemInfo {
  itemType: "armor";
  armorTypeId: ArmorInfo["id"];
}

export interface AccessoryItemInfo extends BaseItemInfo {
  itemType: "accessory";
  accessoryTypeId: AccessoryInfo["id"];
}

export type ItemInfo =
  | WeaponItemInfo
  | OffHandItemInfo
  | ArmorItemInfo
  | AccessoryItemInfo;

export interface ItemData {
  items: ItemInfo[];
}

export interface HeroEquipment {
  mainHand?: EquippedItemRef | null;
  offHand?: EquippedItemRef | null;
  armor?: EquippedItemRef | null;
  accessory?: EquippedItemRef | null;
}

export type SkillTarget =
  | "self"
  | "single_enemy"
  | "all_enemies"
  | "single_ally"
  | "all_allies";

export type DamageType =
  | "physical"
  | "arcane"
  | "fire"
  | "ice"
  | "water"
  | "earth"
  | "wind"
  | "lightning"
  | "holy"
  | "dark"
  | "nature"
  | "sound"
  | "poison"
  | "blood"
  | "radiant";

export type ModifierType = "flat" | "percent";

export interface Modifier {
  stat: string;
  type: ModifierType;
  value: number;
}

export type SkillEffect =
  | {
      type: "damage";
      damageType: DamageType;
      scalingStat: string;
      power: number;
      hitCount: number;
    }
  | {
      type: "buff";
      durationRounds: number;
      modifiers: Modifier[];
    }
  | {
      type: "debuff";
      durationRounds: number;
      modifiers: Modifier[];
    }
  | {
      type: "heal";
      scalingStat: string;
      power: number;
    }
  | {
      type: "stat_modifier";
      modifiers: Modifier[];
    }
  | {
      type: "loot_modifier";
      modifiers: Modifier[];
    };

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  type: "active" | "passive";
  effect: SkillEffect;

  // Only used by active skills
  target?: SkillTarget;
  manaCost?: number;
  cooldownRounds?: number;
}

export interface ClassSkillInfo {
  activeSkills: SkillInfo[];
  passiveSkills: SkillInfo[];
}
