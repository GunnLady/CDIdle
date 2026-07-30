import { CANONICAL_RESISTANCE_FIELDS } from "../domain/hero-stats.ts";



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

export interface CanonicalDungeonEncounterRecord {
  encounterId: string;
  kind: "fight" | "trap" | "enigma" | "ambush" | "ritual" | "obstacle" | "negotiation" | "treasure" | "rest";
  floor: number;
  room: number;
  outcome: "victory" | "defeat";
  roundCount: number;
  enemy: { id?: string; name?: string; hp: number; maxHp: number; isBoss?: boolean } | null;
  transcript: CanonicalDungeonTranscriptEvent[];
  rewards: { gold: number; loot: Array<Record<string, unknown>> };
}

export interface CanonicalRngState {
  algorithm: "xorshift32";
  version: 1;
  seed: number;
  state: number;
  draws: number;
}

export const MAX_CANONICAL_RNG_DRAWS = Number.MAX_SAFE_INTEGER;

export const CANONICAL_GAME_STATE_REQUIRED_FIELDS = [
  "resources", "buildings", "citizens", "districts", "heroes", "storedItems",
  "forgeMaterials", "itemBlueprints", "encounterHistory", "rngState",
  "totalCitizensCount", "activeDungeonFloor", "activeDungeonRoom",
  "highestFloorReached", "citizenGrowthProgress", "autoExplore", "currentEncounter",
] as const;

export interface CanonicalGameState {
  resources: Record<string, number>;
  buildings: Record<string, number>;
  citizens: { farmers: number; woodcutters: number; quarrymen: number; miners: number; unassigned: number };
  totalCitizensCount: number;
  districts: Record<string, boolean>;
  heroes: Array<Record<string, unknown>>;
  storedItems: Array<Record<string, unknown>>;
  forgeMaterials: Array<Record<string, unknown>>;
  itemBlueprints: Array<Record<string, unknown>>;
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  highestFloorReached: number;
  currentEncounter: Record<string, unknown> | null;
  encounterHistory: CanonicalDungeonEncounterRecord[];
  autoExplore: boolean;
  citizenGrowthProgress: number;
  rngState: CanonicalRngState;
}

type MissingCanonicalRequiredField = Exclude<
  keyof CanonicalGameState,
  (typeof CANONICAL_GAME_STATE_REQUIRED_FIELDS)[number]
>;
const canonicalRequiredFieldsAreExhaustive: MissingCanonicalRequiredField extends never ? true : never = true;
void canonicalRequiredFieldsAreExhaustive;

export type CanonicalGameCommand =
  | { type: "onboarding.offer"; cityName: string }
  | { type: "onboarding.start"; cityName: string; starterHeroes: Array<{ id: string; name: string }> }
  | { type: "building.upgrade"; buildingId: string }
  | { type: "citizens.allocate"; role: "farmers" | "woodcutters" | "quarrymen" | "miners"; amount: number }
  | { type: "district.unlock"; districtId: string }
  | { type: "hero.recruit" }
  | { type: "hero.recruit_offer" }
  | { type: "hero.recruit_confirm"; name?: string }
  | { type: "hero.recruit_cancel" }
  | { type: "hero.dismiss"; heroId: string }
  | { type: "hero.activity"; heroId: string; active: boolean }
  | { type: "hero.equip"; heroId: string; instanceId: string }
  | { type: "hero.unequip"; heroId: string; slot: "mainHand" | "offHand" | "armor" | "accessory" }
  | { type: "inventory.recycle"; instanceId: string }
  | { type: "forge.start"; recipeId: string }
  | { type: "forge.finalize"; previewId: string; acceptUpgrade?: boolean; chosenModifierStat?: string }
  | { type: "forge.cancel"; previewId: string }
  | { type: "cheat.grant_resources"; amounts: Partial<Record<"gold" | "food" | "wood" | "stone" | "ore", number>> }
  | { type: "cheat.set_highest_floor"; floor: number }
  | { type: "dungeon.explore"; floor: number }
  | { type: "dungeon.select_floor"; floor: number }
  | { type: "dungeon.resolve" }
  | { type: "dungeon.auto_explore"; enabled: boolean }
  | { type: "dungeon.retreat" };

export interface CanonicalCommandEnvelope {
  commandId: string;
  idempotencyKey: string;
  clientVersion: string;
  expectedRevision: number;
  command: CanonicalGameCommand;
}

export const CANONICAL_COMMAND_TYPES = [
  "onboarding.offer", "onboarding.start", "building.upgrade", "citizens.allocate", "district.unlock",
  "hero.recruit", "hero.recruit_offer", "hero.recruit_confirm", "hero.recruit_cancel", "hero.dismiss", "hero.activity", "hero.equip", "hero.unequip",
  "inventory.recycle", "forge.start", "forge.finalize", "forge.cancel",
  "cheat.grant_resources", "cheat.set_highest_floor",
  "dungeon.explore", "dungeon.select_floor", "dungeon.resolve", "dungeon.auto_explore", "dungeon.retreat",
] as const;

const CANONICAL_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
const CANONICAL_EQUIPMENT_SLOTS = ["mainHand", "offHand", "armor", "accessory"] as const;
const CANONICAL_MODIFIER_STATS = new Set([
  "str", "agi", "end", "int", "wiz", "dex", "luk",
  "maxHp", "maxMana", "physicalDamage", "magicDamage", "criticalChance",
  "dodgeChance", "speed", "physicalDefense", "magicDefense", "luck", "physicalResistance",
  ...CANONICAL_RESISTANCE_FIELDS.map((field) => `${field}Resistance`),
]);

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
    if (modifier.type !== undefined && modifier.type !== "flat" && modifier.type !== "percent") errors.push(`${path}[${index}].type is invalid`);
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
    case "hero.equip":
      if (!hasOnlyKeys(command, ["type", "heroId", "instanceId"])) errors.push("command contains unsupported fields");
      requireString("heroId"); requireString("instanceId");
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
      if (!hasOnlyKeys(command, ["type", "recipeId"])) errors.push("command contains unsupported fields");
      requireString("recipeId");
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
  "speed",
  "physicalDefense",
  "magicDefense",
] as const;
const HERO_STATUSES = ["idle", "exploring", "resting"] as const;
export const CANONICAL_HERO_RACES = [
  "Humain", "Elfe", "Nain", "Orc", "Gobelin", "Homme-Lézard", "Tieffelin", "Homme-Bête",
] as const;
export const CANONICAL_HERO_CLASSES = [
  "Novice", "Guerrier", "Voleur", "Archer", "Mage", "Acolyte", "Aède", "Druide",
  "Artificier", "Pugiliste",
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
      for (const slot of CANONICAL_EQUIPMENT_SLOTS) {
        const equipped = hero.equipment[slot];
        if (equipped === undefined || equipped === null) continue;
        if (!isRecord(equipped)) {
          errors.push(`${path}.equipment.${slot} must be an object or null`);
          continue;
        }
        if (!hasOnlyKeys(equipped, ["instanceId", "itemId", "rarity", "modifiers"])) errors.push(`${path}.equipment.${slot} contains unsupported fields`);
        if (typeof equipped.instanceId !== "string" || !equipped.instanceId.trim()) errors.push(`${path}.equipment.${slot}.instanceId is required`);
        if (typeof equipped.itemId !== "string" || !equipped.itemId.trim()) errors.push(`${path}.equipment.${slot}.itemId is required`);
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
      if (!hasOnlyKeys(entry, ["instanceId", "itemId", "rarity", "modifiers"])) errors.push(`storedItems[${index}] contains unsupported fields`);
      if (typeof entry.instanceId !== "string" || !entry.instanceId.trim()) errors.push(`storedItems[${index}].instanceId is required`);
      if (typeof entry.itemId !== "string" || !entry.itemId.trim()) errors.push(`storedItems[${index}].itemId is required`);
      if (!CANONICAL_RARITIES.includes(entry.rarity as typeof CANONICAL_RARITIES[number])) errors.push(`storedItems[${index}].rarity is invalid`);
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
    else value.itemBlueprints.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`itemBlueprints[${index}] must be an object`);
        return;
      }
      if (typeof entry.itemId !== "string" || !entry.itemId.trim()) errors.push(`itemBlueprints[${index}].itemId is required`);
      if (typeof entry.unlocked !== "boolean") errors.push(`itemBlueprints[${index}].unlocked must be a boolean`);
    });
  }
  if ("pendingForge" in value && value.pendingForge !== null && value.pendingForge !== undefined) {
    if (!isRecord(value.pendingForge)) errors.push("pendingForge must be an object or null");
    else {
      for (const field of ["previewId", "recipeId", "itemId", "itemType"] as const) {
        if (typeof value.pendingForge[field] !== "string" || !String(value.pendingForge[field]).trim()) errors.push(`pendingForge.${field} is required`);
      }
      if (!["weapon", "offhand", "armor", "accessory"].includes(String(value.pendingForge.itemType))) errors.push("pendingForge.itemType is invalid");
      if (!["none", "uncommon", "rare"].includes(String(value.pendingForge.upgradeProc))) errors.push("pendingForge.upgradeProc is invalid");
    }
  }
  if ("encounterHistory" in value && !Array.isArray(value.encounterHistory)) errors.push("encounterHistory must be an array");
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
  if ("currentEncounter" in value && value.currentEncounter !== null && (typeof value.currentEncounter !== "object" || value.currentEncounter === undefined)) errors.push("currentEncounter must be an object or null");
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
