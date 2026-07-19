export type InventoryRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type InventorySlot = "mainHand" | "offHand" | "armor" | "accessory";
export type InventoryModifier = Record<string, unknown>;
export type InventoryStack = { itemId: string; rarity: InventoryRarity; count: number; modifiers?: InventoryModifier[] };
export type InventoryHero = { id: string; level?: number; equipment?: Partial<Record<InventorySlot, { itemId: string; rarity: InventoryRarity; modifiers?: InventoryModifier[] }>> };

type ItemDefinition = { slot: InventorySlot; requiredLevel: number; twoHanded?: boolean };

// Server-owned catalog subset. Unknown identifiers are rejected instead of
// trusting client-supplied item metadata.
const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  starter_sword: { slot: "mainHand", requiredLevel: 1 },
  quick_dagger: { slot: "mainHand", requiredLevel: 1 },
  woodcutter_axe: { slot: "mainHand", requiredLevel: 1 },
  wooden_shield: { slot: "offHand", requiredLevel: 1 },
  traveler_clothes: { slot: "armor", requiredLevel: 1 },
  simple_leather_armor: { slot: "armor", requiredLevel: 1 },
  novice_mystic_robe: { slot: "armor", requiredLevel: 1 },
};

export type InventoryCommand =
  | { type: "inventory.add"; itemId: string; rarity: InventoryRarity; count?: number; modifiers?: InventoryModifier[] }
  | { type: "inventory.remove"; itemId: string; rarity: InventoryRarity; count?: number; modifiers?: InventoryModifier[] }
  | { type: "hero.equip"; heroId: string; itemId: string; rarity: InventoryRarity; modifiers?: InventoryModifier[] }
  | { type: "hero.unequip"; heroId: string; slot: InventorySlot };

export class InventoryCommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sameModifiers = (left?: InventoryModifier[], right?: InventoryModifier[]) => JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
const stackIndex = (items: InventoryStack[], itemId: string, rarity: InventoryRarity, modifiers?: InventoryModifier[]) =>
  items.findIndex((entry) => entry.itemId === itemId && entry.rarity === rarity && sameModifiers(entry.modifiers, modifiers));

function ensureItem(itemId: string): ItemDefinition {
  const definition = ITEM_DEFINITIONS[itemId];
  if (!definition) throw new InventoryCommandError("ITEM_NOT_FOUND", "unknown item");
  return definition;
}

function ensureCount(count: number | undefined): number {
  const value = count ?? 1;
  if (!Number.isInteger(value) || value <= 0) throw new InventoryCommandError("INVALID_COUNT", "count must be a positive integer");
  return value;
}

export function applyInventoryCommand(current: Record<string, unknown>, command: Record<string, unknown>): { state: Record<string, unknown>; events: unknown[] } {
  const storedItems = clone((current.storedItems as InventoryStack[] | undefined) ?? []);
  const heroes = clone((current.heroes as InventoryHero[] | undefined) ?? []);
  const typed = command as InventoryCommand;

  if (typed.type === "inventory.add" || typed.type === "inventory.remove") {
    ensureItem(typed.itemId);
    const count = ensureCount(typed.count);
    const index = stackIndex(storedItems, typed.itemId, typed.rarity, typed.modifiers);
    if (typed.type === "inventory.add") {
      if (index === -1) storedItems.push({ itemId: typed.itemId, rarity: typed.rarity, count, modifiers: typed.modifiers });
      else storedItems[index].count += count;
      return { state: { ...current, storedItems }, events: [{ type: "inventory.added", itemId: typed.itemId, count }] };
    }
    if (index === -1 || storedItems[index].count < count) throw new InventoryCommandError("ITEM_NOT_FOUND", "item stack is unavailable");
    storedItems[index].count -= count;
    if (storedItems[index].count === 0) storedItems.splice(index, 1);
    return { state: { ...current, storedItems }, events: [{ type: "inventory.removed", itemId: typed.itemId, count }] };
  }

  if (typed.type === "hero.equip") {
    const definition = ensureItem(typed.itemId);
    const hero = heroes.find((entry) => entry.id === typed.heroId);
    if (!hero) throw new InventoryCommandError("HERO_NOT_FOUND", "hero not found");
    if ((hero.level ?? 1) < definition.requiredLevel) throw new InventoryCommandError("EQUIP_BLOCKED", "hero level is too low");
    const index = stackIndex(storedItems, typed.itemId, typed.rarity, typed.modifiers);
    if (index === -1 || storedItems[index].count < 1) throw new InventoryCommandError("ITEM_NOT_FOUND", "item stack is unavailable");
    const equipment = { ...(hero.equipment ?? {}) };
    if (equipment[definition.slot]) throw new InventoryCommandError("EQUIP_BLOCKED", "equipment slot is occupied");
    if (definition.slot === "offHand" && equipment.mainHand && ITEM_DEFINITIONS[equipment.mainHand.itemId]?.twoHanded) {
      throw new InventoryCommandError("EQUIP_BLOCKED", "off-hand is blocked by the main-hand item");
    }
    storedItems[index].count -= 1;
    if (storedItems[index].count === 0) storedItems.splice(index, 1);
    equipment[definition.slot] = { itemId: typed.itemId, rarity: typed.rarity, modifiers: typed.modifiers };
    return { state: { ...current, heroes: heroes.map((entry) => entry.id === typed.heroId ? { ...entry, equipment } : entry), storedItems }, events: [{ type: "hero.equipped", heroId: typed.heroId, itemId: typed.itemId, slot: definition.slot }] };
  }

  if (typed.type === "hero.unequip") {
    const hero = heroes.find((entry) => entry.id === typed.heroId);
    if (!hero) throw new InventoryCommandError("HERO_NOT_FOUND", "hero not found");
    const equipment = { ...(hero.equipment ?? {}) };
    const equipped = equipment[typed.slot];
    if (!equipped) throw new InventoryCommandError("ITEM_NOT_FOUND", "equipment slot is empty");
    const index = stackIndex(storedItems, equipped.itemId, equipped.rarity, equipped.modifiers);
    if (index === -1) storedItems.push({ itemId: equipped.itemId, rarity: equipped.rarity, count: 1, modifiers: equipped.modifiers });
    else storedItems[index].count += 1;
    equipment[typed.slot] = undefined;
    return { state: { ...current, heroes: heroes.map((entry) => entry.id === typed.heroId ? { ...entry, equipment } : entry), storedItems }, events: [{ type: "hero.unequipped", heroId: typed.heroId, itemId: equipped.itemId, slot: typed.slot }] };
  }

  throw new InventoryCommandError("INVALID_COMMAND", "unsupported inventory command");
}
