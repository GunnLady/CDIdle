import { CANONICAL_RESISTANCE_FIELDS } from "../domain/hero-stats.ts";

export type CanonicalRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type CanonicalModifier = { stat: string; type?: "flat" | "percent"; value: number };

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

export type CanonicalGameCommand =
  | { type: "onboarding.offer"; cityName: string }
  | { type: "onboarding.start"; cityName: string; starterHeroes: Array<{ id: string; name: string }> }
  | { type: "building.upgrade"; buildingId: string }
  | { type: "citizens.allocate"; role: "farmers" | "woodcutters" | "quarrymen" | "miners" | "unassigned"; amount: number }
  | { type: "district.unlock"; districtId: string }
  | { type: "hero.recruit" }
  | { type: "hero.recruit_offer" }
  | { type: "hero.recruit_confirm"; name?: string }
  | { type: "hero.recruit_cancel" }
  | { type: "hero.dismiss"; heroId: string }
  | { type: "hero.activity"; heroId: string; active: boolean }
  | { type: "hero.equip"; heroId: string; itemId: string; rarity: CanonicalRarity; modifiers?: CanonicalModifier[] }
  | { type: "hero.unequip"; heroId: string; slot: "mainHand" | "offHand" | "armor" | "accessory" }
  | { type: "inventory.add"; itemId: string; rarity: CanonicalRarity; count?: number; modifiers?: CanonicalModifier[] }
  | { type: "inventory.remove"; itemId: string; rarity: CanonicalRarity; count?: number; modifiers?: CanonicalModifier[] }
  | { type: "inventory.recycle"; itemId: string; rarity: CanonicalRarity; modifiers?: CanonicalModifier[] }
  | { type: "forge.start"; recipeId: string }
  | { type: "forge.finalize"; previewId: string; accepted?: boolean; chosenModifierStat?: string }
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
  "inventory.add", "inventory.remove", "inventory.recycle", "forge.start", "forge.finalize", "forge.cancel",
  "cheat.grant_resources", "cheat.set_highest_floor",
  "dungeon.explore", "dungeon.select_floor", "dungeon.resolve", "dungeon.auto_explore", "dungeon.retreat",
] as const;

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
  }
  return errors;
}


export function validateCanonicalGameState(input: unknown): string[] {
  if (!input || typeof input !== "object") return ["state must be an object"];
  const value = input as Record<string, unknown>;
  const errors: string[] = [];
  for (const field of ["resources", "buildings", "citizens", "districts", "heroes", "storedItems", "forgeMaterials", "itemBlueprints", "encounterHistory", "rngState"]) {
    if (!(field in value)) errors.push(`${field} is required`);
  }
  if ("heroes" in value) {
    if (!Array.isArray(value.heroes)) errors.push("heroes must be an array");
    else value.heroes.forEach((hero, index) => errors.push(...validateCanonicalHero(hero, `heroes[${index}]`)));
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
    if (!(field in value)) errors.push(`${field} is required`);
    else if (typeof value[field] !== "number" || !Number.isFinite(value[field])) errors.push(`${field} must be a number`);
  }
  if (!("autoExplore" in value)) errors.push("autoExplore is required");
  else if (typeof value.autoExplore !== "boolean") errors.push("autoExplore must be a boolean");
  if (!("currentEncounter" in value)) errors.push("currentEncounter is required");
  else if (value.currentEncounter !== null && (typeof value.currentEncounter !== "object" || value.currentEncounter === undefined)) errors.push("currentEncounter must be an object or null");
  return errors;
}
