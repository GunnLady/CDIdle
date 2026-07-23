export type CanonicalRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type CanonicalModifier = { stat: string; type?: "flat" | "percent"; value: number };

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
  autoExplore: boolean;
  citizenGrowthProgress: number;
}

export type CanonicalGameCommand =
  | { type: "onboarding.start"; cityName: string }
  | { type: "building.upgrade"; buildingId: string }
  | { type: "citizens.allocate"; role: "farmers" | "woodcutters" | "quarrymen" | "miners" | "unassigned"; amount: number }
  | { type: "district.unlock"; districtId: string }
  | { type: "hero.recruit" }
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
  | { type: "dungeon.explore"; floor: number }
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
  "onboarding.start", "building.upgrade", "citizens.allocate", "district.unlock",
  "hero.recruit", "hero.dismiss", "hero.activity", "hero.equip", "hero.unequip",
  "inventory.add", "inventory.remove", "inventory.recycle", "forge.start", "forge.finalize", "forge.cancel",
  "dungeon.explore", "dungeon.resolve", "dungeon.auto_explore", "dungeon.retreat",
] as const;

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
  for (const field of ["resources", "buildings", "citizens", "districts", "heroes", "storedItems", "forgeMaterials", "itemBlueprints"]) {
    if (!(field in value)) errors.push(`${field} is required`);
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
