import {
  CANONICAL_ITEM_MODIFIER_FIELDS,
  CANONICAL_RESISTANCE_FIELDS,
  type CanonicalHeroBaseStats,
  type CanonicalStatModifier,
} from "../domain/hero-stats.ts";
import {
  CANONICAL_HERO_CLASSES,
  CANONICAL_HERO_CLASS_TIERS,
  type CanonicalHeroClass,
} from "../domain/hero-classes.ts";

export { CANONICAL_HERO_CLASSES, CANONICAL_HERO_CLASS_TIERS };



export interface CanonicalDungeonTranscriptEvent {
  sequence: number;
  type: string;
  message?: string;
  category?: "info" | "victory" | "defeat" | "loot" | "combat-hero" | "combat-enemy";
  round?: number;
  heroId?: string;
  heroName?: string;
  monsterId?: string;
  monsterName?: string;
  damage?: number;
  healing?: number;
  enemyHp?: number;
  enemyMaxHp?: number;
  heroHp?: number;
  heroMaxHp?: number;
  [key: string]: unknown;
}

export interface CanonicalDungeonEnemyRecord {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  isBoss?: boolean;
  role?: "ordinary" | "protector" | "ranged" | "support" | "guard" | "king";
  intent?: string;
  effects?: string[];
}

export interface CanonicalDungeonEncounterRecord {
  encounterId: string;
  dungeonId?: string;
  kind: "fight" | "trap" | "enigma" | "ambush" | "ritual" | "obstacle" | "negotiation" | "treasure" | "rest";
  floor: number;
  room: number;
  outcome: "victory" | "defeat";
  roundCount: number;
  enemy: { id?: string; name?: string; hp: number; maxHp: number; isBoss?: boolean } | null;
  enemies?: CanonicalDungeonEnemyRecord[];
  transcript: CanonicalDungeonTranscriptEvent[];
  rewards: { gold: number; loot: CanonicalDungeonLoot[] };
}

export type CanonicalRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export const CANONICAL_ITEM_POWER_MODEL_IDS = ['legacy-fixed-v1', 'level-bands-v1'] as const;
export type CanonicalItemPowerModelId = typeof CANONICAL_ITEM_POWER_MODEL_IDS[number];
export type CanonicalDungeonLoot =
  | { type: 'item'; instanceId: string; itemId: string; itemLevel: number; powerModelId: CanonicalItemPowerModelId; rarity: CanonicalRarity; count: number; modifiers?: CanonicalStatModifier[]; sourceDungeonId?: string; sourceZoneId?: string }
  | { type: "material"; materialId: string; rarity: CanonicalRarity; count: number; name: string }
  | { type: "blueprint"; itemId: string; count: number };
export type CanonicalHeroRace =
  | "Humain" | "Elfe" | "Nain" | "Orc" | "Gobelin" | "Homme-Lézard" | "Tieffelin" | "Homme-Bête";
export type CanonicalHeroStatus = "idle" | "exploring" | "resting";
export const CANONICAL_HERO_PROGRESSION_MODEL_IDS = [
  "legacy-global-v1",
  "harmonized-t0-t1-v1",
  "harmonized-level-bands-v2",
] as const;
export type CanonicalHeroProgressionModelId = typeof CANONICAL_HERO_PROGRESSION_MODEL_IDS[number];

export interface CanonicalResources {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  ore: number;
}

export interface CanonicalCitizenAllocation {
  farmers: number;
  woodcutters: number;
  quarrymen: number;
  miners: number;
  unassigned: number;
}

export interface CanonicalStoredItemInstance {
  instanceId: string;
  itemId: string;
  itemLevel: number;
  powerModelId: CanonicalItemPowerModelId;
  rarity: CanonicalRarity;
  modifiers?: CanonicalStatModifier[];
  sourceDungeonId?: string;
  sourceZoneId?: string;
}

export type CanonicalHeroEquipment = Partial<Record<
  "mainHand" | "offHand" | "armor" | "accessory",
  CanonicalStoredItemInstance | null
>>;

export interface CanonicalCalculatedStats {
  maxHp: number;
  criticalChance: number;
  dodgeChance: number;
  hp: number;
  maxMana: number;
  mana: number;
  physicalDamage: number;
  magicDamage: number;
  estimatedDps: number;
  speed: number;
  physicalDefense: number;
  magicDefense: number;
  resistances: Record<(typeof CANONICAL_RESISTANCE_FIELDS)[number], number>;
}

export interface CanonicalHero {
  id: string;
  name: string;
  race: CanonicalHeroRace;
  classType: CanonicalHeroClass;
  level: number;
  xp: number;
  xpNeeded: number;
  currentHp: number;
  currentMana: number;
  baseStats: CanonicalHeroBaseStats;
  gender?: "Male" | "Female";
  spriteIndex?: number;
  isElite?: boolean;
  isActive: boolean;
  status: CanonicalHeroStatus;
  activeSkills: string[];
  passiveSkills: string[];
  calculatedStats: CanonicalCalculatedStats;
  equipment?: CanonicalHeroEquipment;
  cooldowns?: Record<string, number>;
}

export interface CanonicalForgeMaterialStack {
  materialId: string;
  rarity: CanonicalRarity;
  count: number;
}

export interface CanonicalItemBlueprint {
  itemId: string;
  unlocked: boolean;
}

export interface CanonicalPendingClassTransition {
  heroId: string;
  fromClass: CanonicalHeroClass;
  fromTier: number;
  toTier: number;
  originLevel: number;
  wasActive: boolean;
  previousStatus: CanonicalHeroStatus;
  reason: string;
  candidates: Array<{ classType: CanonicalHeroClass; affinity: number }>;
}

export interface CanonicalActiveDungeonEncounter {
  encounterId: string;
  kind: "pending";
  status: "active";
  dungeonId: string;
  floor: number;
  room: number;
  participantHeroIds: string[];
  commandId?: string;
}

export interface CanonicalDungeonHeroProgress {
  completedFloor: number;
  fixedVictoryIds: string[];
}

export interface CanonicalDungeonExpedition {
  dungeonId: string;
  mode: "progression" | "farm";
  zoneId: string | null;
  floor: number;
  room: number;
  halted: boolean;
  haltReason: "wipe" | "retreat" | null;
}

export interface CanonicalDungeonProgress {
  dungeonId: string;
  heroes: Record<string, CanonicalDungeonHeroProgress>;
  expedition: CanonicalDungeonExpedition;
}

export interface CanonicalPendingForge {
  previewId: string;
  recipeId: string;
  itemId: string;
  itemType: "weapon" | "offhand" | "armor" | "accessory";
  itemLevel: number;
  powerModelId: CanonicalItemPowerModelId;
  offeredRarity: CanonicalRarity;
}

export interface CanonicalRngState {
  algorithm: "xorshift32";
  version: 1;
  seed: number;
  state: number;
  draws: number;
}

export const MAX_CANONICAL_RNG_DRAWS = Number.MAX_SAFE_INTEGER;
export const CURRENT_CANONICAL_STATE_VERSION = 5 as const;

export const CANONICAL_GAME_STATE_REQUIRED_FIELDS = [
  "stateVersion", "resources", "buildings", "citizens", "districts", "heroes", "storedItems",
  "forgeMaterials", "itemBlueprints", "encounterHistory", "rngState",
  "totalCitizensCount", "activeDungeonFloor", "activeDungeonRoom",
  "highestFloorReached", "citizenGrowthProgress", "autoExplore", "currentEncounter",
  "pendingClassTransitions", "heroProgressionModelId", "dungeonProgress",
] as const;

export interface CanonicalGameStateFields {
  stateVersion: typeof CURRENT_CANONICAL_STATE_VERSION;
  heroProgressionModelId: CanonicalHeroProgressionModelId;
  cityName?: string;
  resources: CanonicalResources;
  buildings: Record<string, number>;
  citizens: CanonicalCitizenAllocation;
  totalCitizensCount: number;
  districts: Record<string, boolean>;
  heroes: CanonicalHero[];
  storedItems: CanonicalStoredItemInstance[];
  forgeMaterials: CanonicalForgeMaterialStack[];
  itemBlueprints: CanonicalItemBlueprint[];
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  highestFloorReached: number;
  currentEncounter: CanonicalActiveDungeonEncounter | null;
  encounterHistory: CanonicalDungeonEncounterRecord[];
  autoExplore: boolean;
  citizenGrowthProgress: number;
  pendingClassTransitions: CanonicalPendingClassTransition[];
  dungeonProgress: CanonicalDungeonProgress;
  rngState: CanonicalRngState;
  pendingForge?: CanonicalPendingForge | null;
  pendingRecruit?: CanonicalHero | null;
  onboardingCandidates?: CanonicalHero[];
  pendingOnboardingCityName?: string;
}

// Persisted snapshots may carry forward fields introduced by a newer server.
// Known fields remain strongly typed while unknown additions survive replay/cache round-trips.
export type CanonicalGameState = CanonicalGameStateFields & Record<string, unknown>;
export type CanonicalGameEvent = Record<string, unknown>;
export interface CanonicalStateTransition {
  state: CanonicalGameState;
  events: CanonicalGameEvent[];
}

type CanonicalRequiredField = {
  [K in keyof CanonicalGameStateFields]-?: object extends Pick<CanonicalGameStateFields, K> ? never : K
}[keyof CanonicalGameStateFields];
type MissingCanonicalRequiredField = Exclude<
  CanonicalRequiredField,
  (typeof CANONICAL_GAME_STATE_REQUIRED_FIELDS)[number]
>;
const canonicalRequiredFieldsAreExhaustive: MissingCanonicalRequiredField extends never ? true : never = true;
void canonicalRequiredFieldsAreExhaustive;

export type CanonicalGameCommand =
  | { type: "onboarding.offer"; cityName: string }
  | { type: "onboarding.start"; cityName: string; starterHeroes: Array<{ id: string; name: string }> }
  | { type: "building.upgrade"; buildingId: string; levels?: number }
  | { type: "citizens.allocate"; role: "farmers" | "woodcutters" | "quarrymen" | "miners"; amount: number }
  | { type: "district.unlock"; districtId: string }
  | { type: "hero.recruit" }
  | { type: "hero.recruit_offer" }
  | { type: "hero.recruit_confirm"; name?: string }
  | { type: "hero.recruit_cancel" }
  | { type: "hero.dismiss"; heroId: string }
  | { type: "hero.activity"; heroId: string; active: boolean }
  | { type: "hero.choose_vocation"; heroId: string; classType: string }
  | { type: "hero.equip"; heroId: string; instanceId: string }
  | { type: "hero.unequip"; heroId: string; slot: "mainHand" | "offHand" | "armor" | "accessory" }
  | { type: "inventory.recycle"; instanceId: string }
  | { type: 'forge.start'; recipeId: string; levelBandMin?: number }
  | { type: "forge.finalize"; previewId: string; acceptUpgrade?: boolean; chosenModifierStat?: string }
  | { type: "forge.cancel"; previewId: string }
  | { type: "cheat.grant_resources"; amounts: Partial<Record<"gold" | "food" | "wood" | "stone" | "ore", number>> }
  | { type: "cheat.set_highest_floor"; floor: number }
  | { type: "dungeon.explore"; dungeonId?: string; floor: number }
  | { type: "dungeon.auto_advance"; dungeonId?: string; floor: number }
  | { type: "dungeon.select_floor"; dungeonId?: string; floor: number }
  | { type: "dungeon.resolve"; dungeonId?: string }
  | { type: "dungeon.auto_explore"; dungeonId?: string; enabled: boolean }
  | { type: "dungeon.retreat"; dungeonId?: string }
  | { type: "dungeon.resume"; dungeonId: string }
  | { type: "dungeon.select_farm_zone"; dungeonId: string; zoneId: string };

export interface CanonicalCommandEnvelope {
  commandId: string;
  idempotencyKey: string;
  clientVersion: string;
  expectedRevision: number;
  command: CanonicalGameCommand;
}

export const CANONICAL_COMMAND_TYPES = [
  "onboarding.offer", "onboarding.start", "building.upgrade", "citizens.allocate", "district.unlock",
  "hero.recruit", "hero.recruit_offer", "hero.recruit_confirm", "hero.recruit_cancel", "hero.dismiss", "hero.activity", "hero.choose_vocation", "hero.equip", "hero.unequip",
  "inventory.recycle", "forge.start", "forge.finalize", "forge.cancel",
  "cheat.grant_resources", "cheat.set_highest_floor",
  "dungeon.explore", "dungeon.auto_advance", "dungeon.select_floor", "dungeon.resolve", "dungeon.auto_explore", "dungeon.retreat", "dungeon.resume", "dungeon.select_farm_zone",
] as const;

const CANONICAL_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
const CANONICAL_EQUIPMENT_SLOTS = ["mainHand", "offHand", "armor", "accessory"] as const;
const CANONICAL_RESOURCE_FIELDS = ["gold", "food", "wood", "stone", "ore"] as const;
const CANONICAL_ENCOUNTER_KINDS = ["fight", "trap", "enigma", "ambush", "ritual", "obstacle", "negotiation", "treasure", "rest"] as const;
const CANONICAL_TRANSCRIPT_CATEGORIES = ["info", "victory", "defeat", "loot", "combat-hero", "combat-enemy"] as const;
const CANONICAL_DUNGEON_ENEMY_ROLES = ["ordinary", "protector", "ranged", "support", "guard", "king"] as const;
const CANONICAL_MODIFIER_STATS = new Set<string>(CANONICAL_ITEM_MODIFIER_FIELDS);

const hasOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));

function validateCanonicalModifiers(value: unknown, path: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return [`${path} must be an array`];
  const errors: string[] = [];
  value.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${path}[${index}] must be an object`);
      return;
    }
    const modifier = entry as Record<string, unknown>;
    if (!hasOnlyKeys(modifier, ["stat", "type", "value"])) errors.push(`${path}[${index}] contains unsupported fields`);
    if (typeof modifier.stat !== "string" || !modifier.stat.trim()) errors.push(`${path}[${index}].stat is required`);
    else if (!CANONICAL_MODIFIER_STATS.has(modifier.stat)) errors.push(`${path}[${index}].stat is invalid`);
    if (modifier.type !== "flat" && modifier.type !== "percent") errors.push(`${path}[${index}].type is invalid`);
    if (typeof modifier.value !== "number" || !Number.isFinite(modifier.value)) errors.push(`${path}[${index}].value must be finite`);
  });
  return errors;
}

function validateCanonicalCommandPayload(command: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const requireString = (field: string) => {
    if (typeof command[field] !== "string" || !String(command[field]).trim()) errors.push(`command.${field} is required`);
  };
  switch (command.type) {
    case "building.upgrade":
      if (!hasOnlyKeys(command, ["type", "buildingId", "levels"])) errors.push("command contains unsupported fields");
      requireString("buildingId");
      if (command.levels !== undefined && (!Number.isInteger(command.levels) || Number(command.levels) < 1 || Number(command.levels) > 5)) {
        errors.push("command.levels must be an integer between 1 and 5");
      }
      break;
    case "hero.equip":
      if (!hasOnlyKeys(command, ["type", "heroId", "instanceId"])) errors.push("command contains unsupported fields");
      requireString("heroId"); requireString("instanceId");
      break;
    case "hero.choose_vocation":
      if (!hasOnlyKeys(command, ["type", "heroId", "classType"])) errors.push("command contains unsupported fields");
      requireString("heroId");
      if (!CANONICAL_HERO_CLASSES.includes(command.classType as typeof CANONICAL_HERO_CLASSES[number]) || command.classType === "Novice") {
        errors.push("command.classType must be a known non-Novice class");
      }
      break;
    case "hero.unequip":
      if (!hasOnlyKeys(command, ["type", "heroId", "slot"])) errors.push("command contains unsupported fields");
      requireString("heroId");
      if (!CANONICAL_EQUIPMENT_SLOTS.includes(command.slot as typeof CANONICAL_EQUIPMENT_SLOTS[number])) errors.push("command.slot is invalid");
      break;
    case "inventory.recycle":
      if (!hasOnlyKeys(command, ["type", "instanceId"])) errors.push("command contains unsupported fields");
      requireString("instanceId");
      break;
    case "forge.start":
      if (!hasOnlyKeys(command, ["type", "recipeId", "levelBandMin"])) errors.push("command contains unsupported fields");
      requireString("recipeId");
      if (command.levelBandMin !== undefined
        && (![1, 6, 11, 16, 21, 26, 31, 36].includes(Number(command.levelBandMin)))) {
        errors.push('command.levelBandMin must start a five-level item band');
      }
      break;
    case "forge.finalize":
      if (!hasOnlyKeys(command, ["type", "previewId", "acceptUpgrade", "chosenModifierStat"])) errors.push("command contains unsupported fields");
      requireString("previewId");
      if (command.acceptUpgrade !== undefined && typeof command.acceptUpgrade !== "boolean") errors.push("command.acceptUpgrade must be a boolean");
      if (command.chosenModifierStat !== undefined && (typeof command.chosenModifierStat !== "string" || !command.chosenModifierStat.trim())) errors.push("command.chosenModifierStat is invalid");
      if (command.acceptUpgrade === true && command.chosenModifierStat === undefined) errors.push("command.chosenModifierStat is required for an upgrade");
      if (command.acceptUpgrade !== true && command.chosenModifierStat !== undefined) errors.push("command.chosenModifierStat requires an accepted upgrade");
      break;
    case "forge.cancel":
      if (!hasOnlyKeys(command, ["type", "previewId"])) errors.push("command contains unsupported fields");
      requireString("previewId");
      break;
    case "dungeon.explore":
    case "dungeon.auto_advance":
    case "dungeon.select_floor":
      if (!hasOnlyKeys(command, ["type", "dungeonId", "floor"])) errors.push("command contains unsupported fields");
      if (command.dungeonId !== undefined && (typeof command.dungeonId !== "string" || !command.dungeonId.trim())) {
        errors.push("command.dungeonId must be a non-empty string");
      }
      if (!Number.isInteger(command.floor) || Number(command.floor) < 1) {
        errors.push("command.floor must be an integer >= 1");
      }
      break;
    case "dungeon.resolve":
    case "dungeon.retreat":
      if (!hasOnlyKeys(command, ["type", "dungeonId"])) errors.push("command contains unsupported fields");
      if (command.dungeonId !== undefined && (typeof command.dungeonId !== "string" || !command.dungeonId.trim())) {
        errors.push("command.dungeonId must be a non-empty string");
      }
      break;
    case "dungeon.auto_explore":
      if (!hasOnlyKeys(command, ["type", "dungeonId", "enabled"])) errors.push("command contains unsupported fields");
      if (command.dungeonId !== undefined && (typeof command.dungeonId !== "string" || !command.dungeonId.trim())) {
        errors.push("command.dungeonId must be a non-empty string");
      }
      if (typeof command.enabled !== "boolean") errors.push("command.enabled must be a boolean");
      break;
    case "dungeon.resume":
      if (!hasOnlyKeys(command, ["type", "dungeonId"])) errors.push("command contains unsupported fields");
      requireString("dungeonId");
      break;
    case "dungeon.select_farm_zone":
      if (!hasOnlyKeys(command, ["type", "dungeonId", "zoneId"])) errors.push("command contains unsupported fields");
      requireString("dungeonId");
      requireString("zoneId");
      break;
    default:
      break;
  }
  return errors;
}

const HERO_BASE_STAT_FIELDS = ["str", "agi", "end", "int", "wiz", "dex", "luk"] as const;
const HERO_CALCULATED_STAT_FIELDS = [
  "maxHp",
  "criticalChance",
  "dodgeChance",
  "hp",
  "maxMana",
  "mana",
  "physicalDamage",
  "magicDamage",
  "estimatedDps",
  "speed",
  "physicalDefense",
  "magicDefense",
] as const;
const HERO_STATUSES = ["idle", "exploring", "resting"] as const;
export const CANONICAL_HERO_RACES = [
  "Humain", "Elfe", "Nain", "Orc", "Gobelin", "Homme-Lézard", "Tieffelin", "Homme-Bête",
] as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function requireFiniteFields(
  value: Record<string, unknown>,
  fields: readonly string[],
  path: string,
  errors: string[],
) {
  for (const field of fields) {
    if (!isFiniteNumber(value[field])) errors.push(`${path}.${field} must be a finite number`);
  }
}

export function validateCanonicalHero(input: unknown, path = "hero"): string[] {
  if (!isRecord(input)) return [`${path} must be an object`];
  const hero = input;
  const errors: string[] = [];

  for (const field of ["id", "name"] as const) {
    const fieldValue = hero[field];
    if (typeof fieldValue !== "string" || !fieldValue.trim()) {
      errors.push(`${path}.${field} must be a non-empty string`);
    }
  }
  if (!CANONICAL_HERO_RACES.includes(hero.race as typeof CANONICAL_HERO_RACES[number])) {
    errors.push(`${path}.race must be a known canonical race`);
  }
  if (!CANONICAL_HERO_CLASSES.includes(hero.classType as typeof CANONICAL_HERO_CLASSES[number])) {
    errors.push(`${path}.classType must be Novice or a known Tier 1 class`);
  }
  if (typeof hero.isActive !== "boolean") errors.push(`${path}.isActive must be a boolean`);
  if (hero.gender !== undefined && hero.gender !== "Male" && hero.gender !== "Female") errors.push(`${path}.gender is invalid`);
  if (hero.spriteIndex !== undefined && (!Number.isInteger(hero.spriteIndex) || Number(hero.spriteIndex) < 0)) errors.push(`${path}.spriteIndex must be an integer >= 0`);
  if (hero.isElite !== undefined && typeof hero.isElite !== "boolean") errors.push(`${path}.isElite must be a boolean`);
  if (!HERO_STATUSES.includes(hero.status as typeof HERO_STATUSES[number])) {
    errors.push(`${path}.status must be idle, exploring or resting`);
  }
  if (!Number.isInteger(hero.level) || Number(hero.level) < 1) {
    errors.push(`${path}.level must be an integer >= 1`);
  }
  if (!isFiniteNumber(hero.xp) || Number(hero.xp) < 0) errors.push(`${path}.xp must be a number >= 0`);
  if (!isFiniteNumber(hero.xpNeeded) || Number(hero.xpNeeded) <= 0) {
    errors.push(`${path}.xpNeeded must be a number > 0`);
  }
  if (!isFiniteNumber(hero.currentHp) || Number(hero.currentHp) < 0) {
    errors.push(`${path}.currentHp must be a number >= 0`);
  }
  if (!isFiniteNumber(hero.currentMana) || Number(hero.currentMana) < 0) {
    errors.push(`${path}.currentMana must be a number >= 0`);
  }

  if (!isRecord(hero.baseStats)) errors.push(`${path}.baseStats must be an object`);
  else requireFiniteFields(hero.baseStats, HERO_BASE_STAT_FIELDS, `${path}.baseStats`, errors);

  if (!isRecord(hero.calculatedStats)) {
    errors.push(`${path}.calculatedStats must be an object`);
  } else {
    requireFiniteFields(
      hero.calculatedStats,
      HERO_CALCULATED_STAT_FIELDS,
      `${path}.calculatedStats`,
      errors,
    );
    if (isFiniteNumber(hero.calculatedStats.maxHp) && hero.calculatedStats.maxHp <= 0) {
      errors.push(`${path}.calculatedStats.maxHp must be > 0`);
    }
    if (isFiniteNumber(hero.calculatedStats.maxMana) && hero.calculatedStats.maxMana < 0) {
      errors.push(`${path}.calculatedStats.maxMana must be >= 0`);
    }
    if (isFiniteNumber(hero.calculatedStats.estimatedDps) && hero.calculatedStats.estimatedDps <= 0) {
      errors.push(`${path}.calculatedStats.estimatedDps must be > 0`);
    }
    if (!isRecord(hero.calculatedStats.resistances)) {
      errors.push(`${path}.calculatedStats.resistances must be an object`);
    } else {
      for (const damageType of CANONICAL_RESISTANCE_FIELDS) {
        const resistance = hero.calculatedStats.resistances[damageType];
        if (!isFiniteNumber(resistance)) {
          errors.push(`${path}.calculatedStats.resistances.${damageType} must be a finite number`);
        }
      }
    }
    if (
      isFiniteNumber(hero.currentHp)
      && isFiniteNumber(hero.calculatedStats.maxHp)
      && hero.currentHp > hero.calculatedStats.maxHp
    ) {
      errors.push(`${path}.currentHp must not exceed calculatedStats.maxHp`);
    }
    if (
      isFiniteNumber(hero.currentMana)
      && isFiniteNumber(hero.calculatedStats.maxMana)
      && hero.currentMana > hero.calculatedStats.maxMana
    ) {
      errors.push(`${path}.currentMana must not exceed calculatedStats.maxMana`);
    }
  }

  for (const field of ["activeSkills", "passiveSkills"] as const) {
    if (!Array.isArray(hero[field]) || hero[field].some((skill) => typeof skill !== "string")) {
      errors.push(`${path}.${field} must be an array of strings`);
    }
  }
  if (hero.cooldowns !== undefined) {
    if (!isRecord(hero.cooldowns)) errors.push(`${path}.cooldowns must be an object`);
    else {
      for (const [skillId, turns] of Object.entries(hero.cooldowns)) {
        if (!Number.isInteger(turns) || Number(turns) < 0) {
          errors.push(`${path}.cooldowns.${skillId} must be an integer >= 0`);
        }
      }
    }
  }
  if (hero.equipment !== undefined) {
    if (!isRecord(hero.equipment)) errors.push(`${path}.equipment must be an object`);
    else {
      if (!hasOnlyKeys(hero.equipment, CANONICAL_EQUIPMENT_SLOTS)) errors.push(`${path}.equipment contains unsupported slots`);
      for (const slot of CANONICAL_EQUIPMENT_SLOTS) {
        const equipped = hero.equipment[slot];
        if (equipped === undefined || equipped === null) continue;
        if (!isRecord(equipped)) {
          errors.push(`${path}.equipment.${slot} must be an object or null`);
          continue;
        }
        if (!hasOnlyKeys(equipped, ["instanceId", "itemId", "itemLevel", "powerModelId", "rarity", "modifiers", "sourceDungeonId", "sourceZoneId"])) errors.push(`${path}.equipment.${slot} contains unsupported fields`);
        if (typeof equipped.instanceId !== "string" || !equipped.instanceId.trim()) errors.push(`${path}.equipment.${slot}.instanceId is required`);
        if (typeof equipped.itemId !== "string" || !equipped.itemId.trim()) errors.push(`${path}.equipment.${slot}.itemId is required`);
        if (!Number.isInteger(equipped.itemLevel) || Number(equipped.itemLevel) < 1 || Number(equipped.itemLevel) > 40) errors.push(`${path}.equipment.${slot}.itemLevel is invalid`);
        if (!CANONICAL_ITEM_POWER_MODEL_IDS.includes(equipped.powerModelId as CanonicalItemPowerModelId)) errors.push(`${path}.equipment.${slot}.powerModelId is invalid`);
        if (!CANONICAL_RARITIES.includes(equipped.rarity as typeof CANONICAL_RARITIES[number])) errors.push(`${path}.equipment.${slot}.rarity is invalid`);
        errors.push(...validateCanonicalModifiers(equipped.modifiers, `${path}.equipment.${slot}.modifiers`));
      }
    }
  }

  return errors;
}

export function validateCanonicalCommandEnvelope(input: unknown): string[] {
  if (!input || typeof input !== "object") return ["payload must be an object"];
  const value = input as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof value.commandId !== "string" || !value.commandId.trim()) errors.push("commandId is required");
  if (typeof value.idempotencyKey !== "string" || !value.idempotencyKey.trim()) errors.push("idempotencyKey is required");
  if (typeof value.clientVersion !== "string" || !value.clientVersion.trim()) errors.push("clientVersion is required");
  if (!Number.isInteger(value.expectedRevision) || Number(value.expectedRevision) < 0) errors.push("expectedRevision must be an integer >= 0");
  const command = value.command;
  if (!command || typeof command !== "object" || typeof (command as Record<string, unknown>).type !== "string") {
    errors.push("command.type is required");
  } else if (!(CANONICAL_COMMAND_TYPES as readonly string[]).includes((command as Record<string, unknown>).type as string)) {
    errors.push("unsupported command type");
  } else {
    errors.push(...validateCanonicalCommandPayload(command as Record<string, unknown>));
  }
  return errors;
}


export function validateCanonicalGameState(input: unknown): string[] {
  if (!input || typeof input !== "object") return ["state must be an object"];
  const value = input as Record<string, unknown>;
  const errors: string[] = [];
  for (const field of CANONICAL_GAME_STATE_REQUIRED_FIELDS) {
    if (!(field in value)) errors.push(`${field} is required`);
  }
  if ("stateVersion" in value && value.stateVersion !== CURRENT_CANONICAL_STATE_VERSION) {
    errors.push(`stateVersion must be ${CURRENT_CANONICAL_STATE_VERSION}`);
  }
  if ("heroProgressionModelId" in value
    && !CANONICAL_HERO_PROGRESSION_MODEL_IDS.includes(value.heroProgressionModelId as CanonicalHeroProgressionModelId)) {
    errors.push("heroProgressionModelId is invalid");
  }
  const validateNumberMap = (field: "resources" | "buildings", options: { integer?: boolean; allowed?: readonly string[] } = {}) => {
    if (!(field in value)) return;
    if (!isRecord(value[field])) {
      errors.push(`${field} must be an object`);
      return;
    }
    if (options.allowed && !hasOnlyKeys(value[field], options.allowed)) errors.push(`${field} contains unsupported fields`);
    if (options.allowed) for (const key of options.allowed) {
      if (!(key in value[field])) errors.push(`${field}.${key} is required`);
    }
    for (const [key, entry] of Object.entries(value[field])) {
      if (!isFiniteNumber(entry) || (options.integer && !Number.isInteger(entry))) {
        errors.push(`${field}.${key} must be ${options.integer ? "an integer" : "a finite number"}`);
      }
    }
  };
  validateNumberMap("resources", { allowed: CANONICAL_RESOURCE_FIELDS });
  validateNumberMap("buildings", { integer: true });
  if ("citizens" in value) {
    if (!isRecord(value.citizens)) errors.push("citizens must be an object");
    else {
      if (!hasOnlyKeys(value.citizens, ["farmers", "woodcutters", "quarrymen", "miners", "unassigned"])) errors.push("citizens contains unsupported fields");
      for (const field of ["farmers", "woodcutters", "quarrymen", "miners", "unassigned"] as const) {
        if (!Number.isInteger(value.citizens[field])) errors.push(`citizens.${field} must be an integer`);
      }
    }
  }
  if ("districts" in value) {
    if (!isRecord(value.districts)) errors.push("districts must be an object");
    else for (const [key, entry] of Object.entries(value.districts)) {
      if (typeof entry !== "boolean") errors.push(`districts.${key} must be a boolean`);
    }
  }
  if ("cityName" in value && value.cityName !== undefined && typeof value.cityName !== "string") {
    errors.push("cityName must be a string");
  }
  if ("heroes" in value) {
    if (!Array.isArray(value.heroes)) errors.push("heroes must be an array");
    else value.heroes.forEach((hero, index) => errors.push(...validateCanonicalHero(hero, `heroes[${index}]`)));
  }
  if ("storedItems" in value) {
    if (!Array.isArray(value.storedItems)) errors.push("storedItems must be an array");
    else value.storedItems.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`storedItems[${index}] must be an object`);
        return;
      }
      if (!hasOnlyKeys(entry, ["instanceId", "itemId", "itemLevel", "powerModelId", "rarity", "modifiers", "sourceDungeonId", "sourceZoneId"])) errors.push(`storedItems[${index}] contains unsupported fields`);
      if (typeof entry.instanceId !== "string" || !entry.instanceId.trim()) errors.push(`storedItems[${index}].instanceId is required`);
      if (typeof entry.itemId !== "string" || !entry.itemId.trim()) errors.push(`storedItems[${index}].itemId is required`);
      if (!Number.isInteger(entry.itemLevel) || Number(entry.itemLevel) < 1 || Number(entry.itemLevel) > 40) errors.push(`storedItems[${index}].itemLevel is invalid`);
      if (!CANONICAL_ITEM_POWER_MODEL_IDS.includes(entry.powerModelId as CanonicalItemPowerModelId)) errors.push(`storedItems[${index}].powerModelId is invalid`);
      if (!CANONICAL_RARITIES.includes(entry.rarity as typeof CANONICAL_RARITIES[number])) errors.push(`storedItems[${index}].rarity is invalid`);
      for (const field of ["sourceDungeonId", "sourceZoneId"] as const) if (entry[field] !== undefined && (typeof entry[field] !== "string" || !entry[field].trim())) errors.push(`storedItems[${index}].${field} is invalid`);
      errors.push(...validateCanonicalModifiers(entry.modifiers, `storedItems[${index}].modifiers`));
    });
  }
  if ("forgeMaterials" in value) {
    if (!Array.isArray(value.forgeMaterials)) errors.push("forgeMaterials must be an array");
    else value.forgeMaterials.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`forgeMaterials[${index}] must be an object`);
        return;
      }
      if (typeof entry.materialId !== "string" || !entry.materialId.trim()) errors.push(`forgeMaterials[${index}].materialId is required`);
      if (!CANONICAL_RARITIES.includes(entry.rarity as typeof CANONICAL_RARITIES[number])) errors.push(`forgeMaterials[${index}].rarity is invalid`);
      if (!Number.isInteger(entry.count) || Number(entry.count) <= 0) errors.push(`forgeMaterials[${index}].count must be a positive integer`);
    });
  }
  if ("itemBlueprints" in value) {
    if (!Array.isArray(value.itemBlueprints)) errors.push("itemBlueprints must be an array");
    else {
      const itemIds = new Set<string>();
      value.itemBlueprints.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`itemBlueprints[${index}] must be an object`);
        return;
      }
      if (typeof entry.itemId !== "string" || !entry.itemId.trim()) {
        errors.push(`itemBlueprints[${index}].itemId is required`);
      } else if (itemIds.has(entry.itemId)) {
        errors.push(`itemBlueprints[${index}].itemId must be unique`);
      } else {
        itemIds.add(entry.itemId);
      }
      if (typeof entry.unlocked !== "boolean") errors.push(`itemBlueprints[${index}].unlocked must be a boolean`);
      });
    }
  }
  if ("pendingClassTransitions" in value) {
    if (!Array.isArray(value.pendingClassTransitions)) {
      errors.push("pendingClassTransitions must be an array");
    } else {
      const heroIds = new Set<string>();
      value.pendingClassTransitions.forEach((entry, index) => {
        const path = `pendingClassTransitions[${index}]`;
        if (!isRecord(entry)) {
          errors.push(`${path} must be an object`);
          return;
        }
        if (!hasOnlyKeys(entry, ["heroId", "fromClass", "fromTier", "toTier", "originLevel", "wasActive", "previousStatus", "reason", "candidates"])) {
          errors.push(`${path} contains unsupported fields`);
        }
        if (typeof entry.heroId !== "string" || !entry.heroId.trim()) errors.push(`${path}.heroId is required`);
        else if (heroIds.has(entry.heroId)) errors.push(`${path}.heroId must be unique`);
        else heroIds.add(entry.heroId);
        const knownFromClass = CANONICAL_HERO_CLASSES.includes(entry.fromClass as typeof CANONICAL_HERO_CLASSES[number]);
        if (!knownFromClass) errors.push(`${path}.fromClass must be a known canonical class`);
        const expectedFromTier = knownFromClass
          ? CANONICAL_HERO_CLASS_TIERS[entry.fromClass as typeof CANONICAL_HERO_CLASSES[number]]
          : null;
        if (!Number.isInteger(entry.fromTier) || entry.fromTier !== expectedFromTier) errors.push(`${path}.fromTier must match fromClass`);
        if (!Number.isInteger(entry.toTier) || entry.toTier !== Number(entry.fromTier) + 1) errors.push(`${path}.toTier must follow fromTier`);
        if (!Number.isInteger(entry.originLevel) || Number(entry.originLevel) < 1) errors.push(`${path}.originLevel must be a positive integer`);
        if (typeof entry.wasActive !== "boolean") errors.push(`${path}.wasActive must be a boolean`);
        if (!HERO_STATUSES.includes(entry.previousStatus as typeof HERO_STATUSES[number])) errors.push(`${path}.previousStatus is invalid`);
        if (typeof entry.reason !== "string" || !entry.reason.trim()) errors.push(`${path}.reason is required`);
        if (!Array.isArray(entry.candidates) || entry.candidates.length === 0) {
          errors.push(`${path}.candidates must be a non-empty array`);
        } else {
          const candidateClasses = new Set<string>();
          entry.candidates.forEach((candidate, candidateIndex) => {
            const candidatePath = `${path}.candidates[${candidateIndex}]`;
            if (!isRecord(candidate)) {
              errors.push(`${candidatePath} must be an object`);
              return;
            }
            if (!hasOnlyKeys(candidate, ["classType", "affinity"])) errors.push(`${candidatePath} contains unsupported fields`);
            if (!CANONICAL_HERO_CLASSES.includes(candidate.classType as typeof CANONICAL_HERO_CLASSES[number])) {
              errors.push(`${candidatePath}.classType must be a known canonical class`);
            } else if (CANONICAL_HERO_CLASS_TIERS[candidate.classType as typeof CANONICAL_HERO_CLASSES[number]] !== entry.toTier) {
              errors.push(`${candidatePath}.classType must match toTier`);
            } else if (candidateClasses.has(String(candidate.classType))) {
              errors.push(`${candidatePath}.classType must be unique`);
            } else candidateClasses.add(String(candidate.classType));
            if (!isFiniteNumber(candidate.affinity)) errors.push(`${candidatePath}.affinity must be a finite number`);
          });
        }
      });
    }
  }
  if ("pendingForge" in value && value.pendingForge !== null && value.pendingForge !== undefined) {
    if (!isRecord(value.pendingForge)) errors.push("pendingForge must be an object or null");
    else {
      if (!hasOnlyKeys(value.pendingForge, ["previewId", "recipeId", "itemId", "itemType", "itemLevel", "powerModelId", "offeredRarity"])) errors.push("pendingForge contains unsupported fields");
      for (const field of ["previewId", "recipeId", "itemId", "itemType"] as const) {
        if (typeof value.pendingForge[field] !== "string" || !String(value.pendingForge[field]).trim()) errors.push(`pendingForge.${field} is required`);
      }
      if (!["weapon", "offhand", "armor", "accessory"].includes(String(value.pendingForge.itemType))) errors.push("pendingForge.itemType is invalid");
      if (!CANONICAL_RARITIES.includes(value.pendingForge.offeredRarity as CanonicalRarity)) errors.push("pendingForge.offeredRarity is invalid");
      if (!Number.isInteger(value.pendingForge.itemLevel) || Number(value.pendingForge.itemLevel) < 1 || Number(value.pendingForge.itemLevel) > 40) errors.push("pendingForge.itemLevel is invalid");
      if (!CANONICAL_ITEM_POWER_MODEL_IDS.includes(value.pendingForge.powerModelId as CanonicalItemPowerModelId)) errors.push("pendingForge.powerModelId is invalid");
    }
  }
  if ("encounterHistory" in value) {
    if (!Array.isArray(value.encounterHistory)) errors.push("encounterHistory must be an array");
    else value.encounterHistory.forEach((entry, index) => {
      const path = `encounterHistory[${index}]`;
      if (!isRecord(entry)) {
        errors.push(`${path} must be an object`);
        return;
      }
      for (const field of ["encounterId", "kind", "outcome"] as const) {
        if (typeof entry[field] !== "string" || !String(entry[field]).trim()) errors.push(`${path}.${field} is required`);
      }
      if (!CANONICAL_ENCOUNTER_KINDS.includes(entry.kind as typeof CANONICAL_ENCOUNTER_KINDS[number])) errors.push(`${path}.kind is invalid`);
      if (entry.outcome !== "victory" && entry.outcome !== "defeat") errors.push(`${path}.outcome is invalid`);
      for (const field of ["floor", "room", "roundCount"] as const) {
        if (!Number.isInteger(entry[field])) errors.push(`${path}.${field} must be an integer`);
      }
      if (entry.dungeonId !== undefined && (typeof entry.dungeonId !== "string" || !entry.dungeonId.trim())) errors.push(`${path}.dungeonId is invalid`);
      if (entry.enemies !== undefined) {
        if (!Array.isArray(entry.enemies)) errors.push(`${path}.enemies must be an array`);
        else {
          const enemyIds = new Set<string>();
          entry.enemies.forEach((enemy, enemyIndex) => {
            const enemyPath = `${path}.enemies[${enemyIndex}]`;
            if (!isRecord(enemy)) {
              errors.push(`${enemyPath} must be an object`);
              return;
            }
            if (typeof enemy.id !== "string" || !enemy.id.trim()) errors.push(`${enemyPath}.id is required`);
            else if (enemyIds.has(enemy.id)) errors.push(`${enemyPath}.id must be unique`);
            else enemyIds.add(enemy.id);
            if (typeof enemy.name !== "string" || !enemy.name.trim()) errors.push(`${enemyPath}.name is required`);
            if (!isFiniteNumber(enemy.hp) || Number(enemy.hp) < 0) errors.push(`${enemyPath}.hp is invalid`);
            if (!isFiniteNumber(enemy.maxHp) || Number(enemy.maxHp) <= 0) errors.push(`${enemyPath}.maxHp is invalid`);
            if (isFiniteNumber(enemy.hp) && isFiniteNumber(enemy.maxHp) && Number(enemy.hp) > Number(enemy.maxHp)) errors.push(`${enemyPath}.hp exceeds maxHp`);
            if (enemy.isBoss !== undefined && typeof enemy.isBoss !== "boolean") errors.push(`${enemyPath}.isBoss must be a boolean`);
            if (enemy.role !== undefined && !CANONICAL_DUNGEON_ENEMY_ROLES.includes(enemy.role as typeof CANONICAL_DUNGEON_ENEMY_ROLES[number])) errors.push(`${enemyPath}.role is invalid`);
            if (enemy.intent !== undefined && typeof enemy.intent !== "string") errors.push(`${enemyPath}.intent must be a string`);
            if (enemy.effects !== undefined && (!Array.isArray(enemy.effects) || enemy.effects.some((effect) => typeof effect !== "string"))) errors.push(`${enemyPath}.effects must be an array of strings`);
          });
        }
      }
      if (!Array.isArray(entry.transcript)) errors.push(`${path}.transcript must be an array`);
      else entry.transcript.forEach((event, eventIndex) => {
        const eventPath = `${path}.transcript[${eventIndex}]`;
        if (!isRecord(event)) {
          errors.push(`${eventPath} must be an object`);
          return;
        }
        if (!Number.isInteger(event.sequence) || Number(event.sequence) < 0) errors.push(`${eventPath}.sequence must be an integer >= 0`);
        if (typeof event.type !== "string" || !event.type.trim()) errors.push(`${eventPath}.type is required`);
        if (event.category !== undefined && !CANONICAL_TRANSCRIPT_CATEGORIES.includes(event.category as typeof CANONICAL_TRANSCRIPT_CATEGORIES[number])) errors.push(`${eventPath}.category is invalid`);
        for (const field of ["message", "heroId", "heroName", "monsterId", "monsterName"] as const) {
          if (event[field] !== undefined && typeof event[field] !== "string") errors.push(`${eventPath}.${field} must be a string`);
        }
        for (const field of ["round", "damage", "healing", "enemyHp", "enemyMaxHp", "heroHp", "heroMaxHp"] as const) {
          if (event[field] !== undefined && !isFiniteNumber(event[field])) errors.push(`${eventPath}.${field} must be a finite number`);
        }
      });
      if (entry.enemy !== null) {
        if (!isRecord(entry.enemy)) errors.push(`${path}.enemy must be an object or null`);
        else {
          for (const field of ["hp", "maxHp"] as const) if (!isFiniteNumber(entry.enemy[field])) errors.push(`${path}.enemy.${field} must be a finite number`);
          for (const field of ["id", "name"] as const) if (entry.enemy[field] !== undefined && typeof entry.enemy[field] !== "string") errors.push(`${path}.enemy.${field} must be a string`);
          if (entry.enemy.isBoss !== undefined && typeof entry.enemy.isBoss !== "boolean") errors.push(`${path}.enemy.isBoss must be a boolean`);
        }
      }
      if (!isRecord(entry.rewards)) errors.push(`${path}.rewards must be an object`);
      else {
        if (!isFiniteNumber(entry.rewards.gold)) errors.push(`${path}.rewards.gold must be a finite number`);
        if (!Array.isArray(entry.rewards.loot)) errors.push(`${path}.rewards.loot must be an array`);
        else entry.rewards.loot.forEach((loot, lootIndex) => {
          const lootPath = `${path}.rewards.loot[${lootIndex}]`;
          if (!isRecord(loot)) {
            errors.push(`${lootPath} must be an object`);
            return;
          }
          if (!Number.isInteger(loot.count) || Number(loot.count) < 1) errors.push(`${lootPath}.count must be a positive integer`);
          if (loot.type === "item") {
            if (typeof loot.instanceId !== "string" || !loot.instanceId.trim()) errors.push(`${lootPath}.instanceId is required`);
            if (typeof loot.itemId !== "string" || !loot.itemId.trim()) errors.push(`${lootPath}.itemId is required`);
            if (!Number.isInteger(loot.itemLevel) || Number(loot.itemLevel) < 1 || Number(loot.itemLevel) > 40) errors.push(`${lootPath}.itemLevel is invalid`);
            if (!CANONICAL_ITEM_POWER_MODEL_IDS.includes(loot.powerModelId as CanonicalItemPowerModelId)) errors.push(`${lootPath}.powerModelId is invalid`);
            if (!CANONICAL_RARITIES.includes(loot.rarity as CanonicalRarity)) errors.push(`${lootPath}.rarity is invalid`);
            for (const field of ["sourceDungeonId", "sourceZoneId"] as const) if (loot[field] !== undefined && (typeof loot[field] !== "string" || !loot[field].trim())) errors.push(`${lootPath}.${field} is invalid`);
            errors.push(...validateCanonicalModifiers(loot.modifiers, `${lootPath}.modifiers`));
          } else if (loot.type === "material") {
            if (typeof loot.materialId !== "string" || !loot.materialId.trim()) errors.push(`${lootPath}.materialId is required`);
            if (typeof loot.name !== "string" || !loot.name.trim()) errors.push(`${lootPath}.name is required`);
            if (!CANONICAL_RARITIES.includes(loot.rarity as CanonicalRarity)) errors.push(`${lootPath}.rarity is invalid`);
            for (const field of ["sourceDungeonId", "sourceZoneId"] as const) if (loot[field] !== undefined && (typeof loot[field] !== "string" || !loot[field].trim())) errors.push(`${lootPath}.${field} is invalid`);
            errors.push(...validateCanonicalModifiers(loot.modifiers, `${lootPath}.modifiers`));
          } else if (loot.type === "blueprint") {
            if (typeof loot.itemId !== "string" || !loot.itemId.trim()) errors.push(`${lootPath}.itemId is required`);
          } else errors.push(`${lootPath}.type is invalid`);
        });
      }
    });
  }
  if ("dungeonProgress" in value) {
    if (!isRecord(value.dungeonProgress)) errors.push("dungeonProgress must be an object");
    else {
      const progress = value.dungeonProgress;
      if (!hasOnlyKeys(progress, ["dungeonId", "heroes", "expedition"])) errors.push("dungeonProgress contains unsupported fields");
      if (typeof progress.dungeonId !== "string" || !progress.dungeonId.trim()) errors.push("dungeonProgress.dungeonId is required");
      if (!isRecord(progress.heroes)) errors.push("dungeonProgress.heroes must be an object");
      else {
        for (const [heroId, heroProgress] of Object.entries(progress.heroes)) {
          const path = "dungeonProgress.heroes." + heroId;
          if (!heroId.trim() || !isRecord(heroProgress)) {
            errors.push(path + " must be an object");
            continue;
          }
          if (!hasOnlyKeys(heroProgress, ["completedFloor", "fixedVictoryIds"])) errors.push(path + " contains unsupported fields");
          if (!Number.isInteger(heroProgress.completedFloor) || Number(heroProgress.completedFloor) < 0 || Number(heroProgress.completedFloor) > 50) errors.push(path + ".completedFloor is invalid");
          if (!Array.isArray(heroProgress.fixedVictoryIds) || heroProgress.fixedVictoryIds.some((id) => typeof id !== "string" || !id.trim()) || new Set(heroProgress.fixedVictoryIds).size !== heroProgress.fixedVictoryIds.length) errors.push(path + ".fixedVictoryIds is invalid");
        }
      }
      if (!isRecord(progress.expedition)) errors.push("dungeonProgress.expedition must be an object");
      else {
        const expedition = progress.expedition;
        if (!hasOnlyKeys(expedition, ["dungeonId", "mode", "zoneId", "floor", "room", "halted", "haltReason"])) errors.push("dungeonProgress.expedition contains unsupported fields");
        if (typeof expedition.dungeonId !== "string" || expedition.dungeonId !== progress.dungeonId) errors.push("dungeonProgress.expedition.dungeonId is invalid");
        if (expedition.mode !== "progression" && expedition.mode !== "farm") errors.push("dungeonProgress.expedition.mode is invalid");
        if (expedition.zoneId !== null && (typeof expedition.zoneId !== "string" || !expedition.zoneId.trim())) errors.push("dungeonProgress.expedition.zoneId is invalid");
        if (expedition.mode === "progression" && expedition.zoneId !== null) errors.push("dungeonProgress.expedition.zoneId must be null in progression mode");
        if (expedition.mode === "farm" && expedition.zoneId === null) errors.push("dungeonProgress.expedition.zoneId is required in farm mode");
        if (!Number.isInteger(expedition.floor) || Number(expedition.floor) < 1 || Number(expedition.floor) > 50) errors.push("dungeonProgress.expedition.floor is invalid");
        if (!Number.isInteger(expedition.room) || Number(expedition.room) < 1) errors.push("dungeonProgress.expedition.room is invalid");
        if (typeof expedition.halted !== "boolean") errors.push("dungeonProgress.expedition.halted must be a boolean");
        if (expedition.haltReason !== null && expedition.haltReason !== "wipe" && expedition.haltReason !== "retreat") errors.push("dungeonProgress.expedition.haltReason is invalid");
        if (typeof expedition.halted === "boolean" && expedition.halted !== (expedition.haltReason !== null)) errors.push("dungeonProgress.expedition halt state is inconsistent");
      }
    }
  }
  if ("rngState" in value) {
    const rngState = value.rngState as Record<string, unknown> | null;
    if (!rngState || typeof rngState !== "object") errors.push("rngState must be an object");
    else {
      if (rngState.algorithm !== "xorshift32") errors.push("rngState.algorithm must be xorshift32");
      if (rngState.version !== 1) errors.push("rngState.version must be 1");
      for (const field of ["seed", "state"]) {
        if (!Number.isInteger(rngState[field]) || Number(rngState[field]) < 1 || Number(rngState[field]) > 0xffff_ffff) {
          errors.push(`rngState.${field} must be a non-zero unsigned 32-bit integer`);
        }
      }
      if (
        !Number.isSafeInteger(rngState.draws)
        || Number(rngState.draws) < 0
        || Number(rngState.draws) > MAX_CANONICAL_RNG_DRAWS
      ) {
        errors.push("rngState.draws must be a non-negative safe integer");
      }
    }
  }
  for (const field of ["totalCitizensCount", "activeDungeonFloor", "activeDungeonRoom", "highestFloorReached", "citizenGrowthProgress"]) {
    if (field in value && (typeof value[field] !== "number" || !Number.isFinite(value[field]))) errors.push(`${field} must be a number`);
  }
  if ("autoExplore" in value && typeof value.autoExplore !== "boolean") errors.push("autoExplore must be a boolean");
  if ("currentEncounter" in value && value.currentEncounter !== null) {
    if (!isRecord(value.currentEncounter)) errors.push("currentEncounter must be an object or null");
    else {
      for (const field of ["encounterId", "kind", "status"] as const) {
        if (typeof value.currentEncounter[field] !== "string" || !String(value.currentEncounter[field]).trim()) errors.push(`currentEncounter.${field} is required`);
      }
      if (!hasOnlyKeys(value.currentEncounter, ["encounterId", "kind", "status", "dungeonId", "floor", "room", "participantHeroIds", "commandId"])) errors.push("currentEncounter contains unsupported fields");
      if (typeof value.currentEncounter.dungeonId !== "string" || !value.currentEncounter.dungeonId.trim()) errors.push("currentEncounter.dungeonId is required");
      if (!Array.isArray(value.currentEncounter.participantHeroIds) || value.currentEncounter.participantHeroIds.length === 0 || value.currentEncounter.participantHeroIds.some((heroId) => typeof heroId !== "string" || !heroId.trim()) || new Set(value.currentEncounter.participantHeroIds).size !== value.currentEncounter.participantHeroIds.length) {
        errors.push("currentEncounter.participantHeroIds must contain at least one unique hero id");
      } else if (Array.isArray(value.heroes)) {
        const heroIds = new Set(value.heroes.filter(isRecord).map((hero) => hero.id).filter((heroId): heroId is string => typeof heroId === "string"));
        if (value.currentEncounter.participantHeroIds.some((heroId) => !heroIds.has(heroId))) {
          errors.push("currentEncounter.participantHeroIds must reference existing heroes");
        }
      }
      if (value.currentEncounter.kind !== "pending") errors.push("currentEncounter.kind must be pending");
      if (value.currentEncounter.status !== "active") errors.push("currentEncounter.status must be active");
      for (const field of ["floor", "room"] as const) {
        if (!Number.isInteger(value.currentEncounter[field])) errors.push(`currentEncounter.${field} must be an integer`);
      }
      if (value.currentEncounter.commandId !== undefined && typeof value.currentEncounter.commandId !== "string") {
        errors.push("currentEncounter.commandId must be a string");
      }
    }
  }
  if (Array.isArray(value.onboardingCandidates)) {
    value.onboardingCandidates.forEach((hero, index) => errors.push(...validateCanonicalHero(hero, `onboardingCandidates[${index}]`)));
  } else if (value.onboardingCandidates !== undefined) errors.push("onboardingCandidates must be an array");
  if (value.pendingRecruit !== undefined && value.pendingRecruit !== null) {
    errors.push(...validateCanonicalHero(value.pendingRecruit, "pendingRecruit"));
  }
  if (value.pendingOnboardingCityName !== undefined && typeof value.pendingOnboardingCityName !== "string") {
    errors.push("pendingOnboardingCityName must be a string");
  }
  const instanceOwners = new Map<string, string>();
  const registerInstance = (instanceId: unknown, owner: string) => {
    if (typeof instanceId !== "string" || !instanceId.trim()) return;
    const previous = instanceOwners.get(instanceId);
    if (previous) errors.push(`${owner}.instanceId duplicates ${previous}`);
    else instanceOwners.set(instanceId, owner);
  };
  if (Array.isArray(value.storedItems)) {
    value.storedItems.forEach((entry, index) => {
      if (isRecord(entry)) registerInstance(entry.instanceId, `storedItems[${index}]`);
    });
  }
  const registerEquipment = (hero: unknown, owner: string) => {
      if (!isRecord(hero) || !isRecord(hero.equipment)) return;
      for (const slot of CANONICAL_EQUIPMENT_SLOTS) {
        const equipped = hero.equipment[slot];
        if (isRecord(equipped)) registerInstance(equipped.instanceId, `${owner}.equipment.${slot}`);
      }
  };
  if (Array.isArray(value.heroes)) {
    value.heroes.forEach((hero, heroIndex) => registerEquipment(hero, `heroes[${heroIndex}]`));
  }
  if (Array.isArray(value.onboardingCandidates)) {
    value.onboardingCandidates.forEach((hero, heroIndex) => registerEquipment(hero, `onboardingCandidates[${heroIndex}]`));
  }
  if (isRecord(value.pendingRecruit)) {
    registerEquipment(value.pendingRecruit, "pendingRecruit");
  }
  return errors;
}

export function isCanonicalGameState(input: unknown): input is CanonicalGameState {
  return validateCanonicalGameState(input).length === 0;
}
