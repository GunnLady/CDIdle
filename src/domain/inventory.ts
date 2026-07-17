import type { Hero, Modifier, Rarity, StoredItemStack } from "../types";
import { addItemToStorage, areModifiersEqual, equipItem, getStoredItemStack, removeItemFromStorage, unequipItem } from "../utils/gameCalculations";

export interface InventoryState { heroes: Hero[]; storedItems: StoredItemStack[]; }
export type InventoryError = "INVALID_COUNT" | "ITEM_NOT_FOUND" | "HERO_NOT_FOUND" | "EQUIP_BLOCKED";
export type InventoryResult = { ok: true; state: InventoryState } | { ok: false; error: InventoryError };

const cloneState = (state: InventoryState): InventoryState => ({
  heroes: state.heroes.map((hero) => ({ ...hero, equipment: hero.equipment ? { ...hero.equipment } : hero.equipment })),
  storedItems: state.storedItems.map((stack) => ({ ...stack, modifiers: stack.modifiers ? [...stack.modifiers] : stack.modifiers }))
});

export function addStack(state: InventoryState, itemId: string, rarity: Rarity, count = 1, modifiers?: Modifier[]): InventoryResult {
  if (!itemId || !Number.isInteger(count) || count <= 0) return { ok: false, error: "INVALID_COUNT" };
  const next = cloneState(state); addItemToStorage(next.storedItems, itemId, rarity, count, modifiers);
  return { ok: true, state: next };
}

export function removeStack(state: InventoryState, itemId: string, rarity: Rarity, count = 1, modifiers?: Modifier[]): InventoryResult {
  if (!Number.isInteger(count) || count <= 0) return { ok: false, error: "INVALID_COUNT" };
  const stack = getStoredItemStack(state.storedItems, itemId, rarity, modifiers);
  if (!stack || stack.count < count) return { ok: false, error: "ITEM_NOT_FOUND" };
  const next = cloneState(state); removeItemFromStorage(next.storedItems, itemId, rarity, count, modifiers);
  return { ok: true, state: next };
}

export function equipStoredItem(state: InventoryState, heroId: string, itemId: string, rarity: Rarity, modifiers?: Modifier[]): InventoryResult {
  const hero = state.heroes.find((entry) => entry.id === heroId);
  if (!hero) return { ok: false, error: "HERO_NOT_FOUND" };
  if (!getStoredItemStack(state.storedItems, itemId, rarity, modifiers)) return { ok: false, error: "ITEM_NOT_FOUND" };
  const next = cloneState(state); const index = next.heroes.findIndex((entry) => entry.id === heroId);
  const equipped = equipItem(next.heroes[index], next.storedItems, itemId, rarity, modifiers);
  if (equipped === next.heroes[index]) return { ok: false, error: "EQUIP_BLOCKED" };
  next.heroes[index] = equipped; return { ok: true, state: next };
}

export function unequipStoredItem(state: InventoryState, heroId: string, slot: keyof NonNullable<Hero["equipment"]>): InventoryResult {
  const hero = state.heroes.find((entry) => entry.id === heroId);
  if (!hero) return { ok: false, error: "HERO_NOT_FOUND" };
  const next = cloneState(state); const index = next.heroes.findIndex((entry) => entry.id === heroId);
  if (!next.heroes[index].equipment?.[slot]) return { ok: false, error: "ITEM_NOT_FOUND" };
  next.heroes[index] = unequipItem(next.heroes[index], next.storedItems, slot);
  return { ok: true, state: next };
}

export { areModifiersEqual };
