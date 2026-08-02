import {
  calculateAuthoritativeHeroStats,
  type AuthoritativeNoviceStats,
} from "./novice-stats-authority.ts";
import {
  getItemById,
  getItemHandedness,
  getItemSlot,
} from "../../../shared/domain/items/items.ts";

export type InventoryRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type InventorySlot = "mainHand" | "offHand" | "armor" | "accessory";
export type InventoryModifier = { stat: string; type?: "flat" | "percent"; value: number };
export type InventoryItemInstance = { instanceId: string; itemId: string; rarity: InventoryRarity; modifiers?: InventoryModifier[] };
export type InventoryEquipmentRef = InventoryItemInstance;
export type InventoryHero = {
  id: string;
  level?: number;
  classType?: string;
  baseStats?: AuthoritativeNoviceStats;
  passiveSkills?: string[];
  currentHp?: number;
  currentMana?: number;
  calculatedStats?: Record<string, unknown>;
  equipment?: Partial<Record<InventorySlot, InventoryEquipmentRef | null>>;
};

type ItemDefinition = {
  slot: InventorySlot;
  requiredLevel: number;
  twoHanded?: boolean;
};

const NOVICE_WEAPON_IDS = ["starter_sword", "quick_dagger", "woodcutter_axe"] as const;
const NOVICE_ARMOR_IDS = ["traveler_clothes", "simple_leather_armor", "novice_mystic_robe"] as const;

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Server-owned equivalent of the historical novice equipment generator.
 * The command-derived seed makes the result deterministic and replay-safe.
 */
export function generateAuthoritativeNoviceEquipment(seedKey: string, ownerId = seedKey): Record<InventorySlot, InventoryEquipmentRef | null> {
  const weaponId = NOVICE_WEAPON_IDS[stableHash(`${seedKey}:weapon`) % NOVICE_WEAPON_IDS.length];
  const armorId = NOVICE_ARMOR_IDS[stableHash(`${seedKey}:armor`) % NOVICE_ARMOR_IDS.length];
  const hasShield = stableHash(`${seedKey}:shield`) % 100 < 15;
  return {
    mainHand: { instanceId: `item:${ownerId}:mainHand`, itemId: weaponId, rarity: "common" },
    offHand: hasShield ? { instanceId: `item:${ownerId}:offHand`, itemId: "wooden_shield", rarity: "common" } : null,
    armor: { instanceId: `item:${ownerId}:armor`, itemId: armorId, rarity: "common" },
    accessory: null,
  };
}

export type InventoryCommand =
  | { type: "hero.equip"; heroId: string; instanceId: string }
  | { type: "hero.unequip"; heroId: string; slot: InventorySlot };

export class InventoryCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function ensureItem(itemId: string): ItemDefinition {
  const item = getItemById(itemId);
  if (!item) throw new InventoryCommandError("ITEM_NOT_FOUND", "unknown item");
  const handedness = getItemHandedness(item);
  return {
    slot: getItemSlot(item),
    requiredLevel: item.requiredLevel,
    twoHanded: handedness === "two_handed" || handedness === "dual_wield",
  };
}

function preserveResourceRatio(
  current: number | undefined,
  previousMax: unknown,
  nextMax: number,
  keepAlive: boolean,
): number {
  if (typeof current !== "number" || !Number.isFinite(current)) return nextMax;
  if (typeof previousMax !== "number" || !Number.isFinite(previousMax) || previousMax <= 0) {
    return Math.min(Math.max(0, current), nextMax);
  }
  if (current <= 0) return 0;
  const ratio = Math.min(1, current / previousMax);
  const scaled = Math.floor(nextMax * ratio);
  return keepAlive ? Math.max(1, scaled) : scaled;
}

function withEquipment(hero: InventoryHero, equipment: InventoryHero["equipment"]): InventoryHero {
  if (!hero.baseStats) return { ...hero, equipment };
  const calculatedStats = calculateAuthoritativeHeroStats(
    hero.baseStats,
    hero.passiveSkills,
    equipment ?? {},
  );
  return {
    ...hero,
    equipment,
    currentHp: preserveResourceRatio(
      hero.currentHp,
      hero.calculatedStats?.maxHp,
      calculatedStats.maxHp,
      true,
    ),
    currentMana: preserveResourceRatio(
      hero.currentMana,
      hero.calculatedStats?.maxMana,
      calculatedStats.maxMana,
      false,
    ),
    calculatedStats,
  };
}

export function applyInventoryCommand(current: Record<string, unknown>, command: Record<string, unknown>): { state: Record<string, unknown>; events: unknown[] } {
  const storedItems = clone((current.storedItems as InventoryItemInstance[] | undefined) ?? []);
  const heroes = clone((current.heroes as InventoryHero[] | undefined) ?? []);
  const typed = command as InventoryCommand;

  if (typed.type === "hero.equip") {
    const hero = heroes.find((entry) => entry.id === typed.heroId);
    if (!hero) throw new InventoryCommandError("HERO_NOT_FOUND", "hero not found");
    const index = storedItems.findIndex((entry) => entry.instanceId === typed.instanceId);
    if (index === -1) throw new InventoryCommandError("ITEM_NOT_FOUND", "item instance is unavailable");
    const instance = storedItems[index];
    const definition = ensureItem(instance.itemId);
    if ((hero.level ?? 1) < definition.requiredLevel) throw new InventoryCommandError("EQUIP_BLOCKED", "hero level is too low");
    const equipment = { ...(hero.equipment ?? {}) };
    if (equipment[definition.slot]) throw new InventoryCommandError("EQUIP_BLOCKED", "equipment slot is occupied");
    if (definition.slot === "offHand" && equipment.mainHand && ensureItem(equipment.mainHand.itemId).twoHanded) {
      throw new InventoryCommandError("EQUIP_BLOCKED", "off-hand is blocked by the main-hand item");
    }
    if (definition.slot === "mainHand" && definition.twoHanded && equipment.offHand) {
      if (storedItems.some((entry) => entry.instanceId === equipment.offHand?.instanceId)) {
        throw new InventoryCommandError("INVALID_GAME_STATE", "off-hand item instance is duplicated");
      }
      storedItems.push(equipment.offHand);
      equipment.offHand = undefined;
    }
    storedItems.splice(index, 1);
    equipment[definition.slot] = instance;
    return { state: { ...current, heroes: heroes.map((entry) => entry.id === typed.heroId ? withEquipment(entry, equipment) : entry), storedItems }, events: [{ type: "hero.equipped", heroId: typed.heroId, instanceId: instance.instanceId, itemId: instance.itemId, slot: definition.slot }] };
  }

  if (typed.type === "hero.unequip") {
    const hero = heroes.find((entry) => entry.id === typed.heroId);
    if (!hero) throw new InventoryCommandError("HERO_NOT_FOUND", "hero not found");
    const equipment = { ...(hero.equipment ?? {}) };
    const equipped = equipment[typed.slot];
    if (!equipped) throw new InventoryCommandError("ITEM_NOT_FOUND", "equipment slot is empty");
    if (storedItems.some((entry) => entry.instanceId === equipped.instanceId)) {
      throw new InventoryCommandError("INVALID_GAME_STATE", "item instance is duplicated");
    }
    storedItems.push(equipped);
    equipment[typed.slot] = undefined;
    return { state: { ...current, heroes: heroes.map((entry) => entry.id === typed.heroId ? withEquipment(entry, equipment) : entry), storedItems }, events: [{ type: "hero.unequipped", heroId: typed.heroId, instanceId: equipped.instanceId, itemId: equipped.itemId, slot: typed.slot }] };
  }

  throw new InventoryCommandError("INVALID_COMMAND", "unsupported inventory command");
}
