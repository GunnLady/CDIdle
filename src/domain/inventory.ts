import type { Hero, StoredItemInstance } from "../types";
import { addItemToStorage, areModifiersEqual, equipItem, getStoredItemInstance, removeItemFromStorage, unequipItem } from "../utils/gameCalculations";

export interface InventoryState { heroes: Hero[]; storedItems: StoredItemInstance[]; }
export type InventoryError = "INVALID_ITEM" | "ITEM_NOT_FOUND" | "HERO_NOT_FOUND" | "EQUIP_BLOCKED";
export type InventoryResult = { ok: true; state: InventoryState } | { ok: false; error: InventoryError };

const cloneState = (state: InventoryState): InventoryState => ({
  heroes: state.heroes.map((hero) => ({ ...hero, equipment: hero.equipment ? { ...hero.equipment } : hero.equipment })),
  storedItems: state.storedItems.map((stack) => ({ ...stack, modifiers: stack.modifiers ? [...stack.modifiers] : stack.modifiers }))
});

export function addItemInstance(state: InventoryState, instance: StoredItemInstance): InventoryResult {
  if (!instance.instanceId || !instance.itemId || getStoredItemInstance(state.storedItems, instance.instanceId)) return { ok: false, error: "INVALID_ITEM" };
  const next = cloneState(state); addItemToStorage(next.storedItems, { ...instance });
  return { ok: true, state: next };
}

export function removeItemInstance(state: InventoryState, instanceId: string): InventoryResult {
  if (!getStoredItemInstance(state.storedItems, instanceId)) return { ok: false, error: "ITEM_NOT_FOUND" };
  const next = cloneState(state); removeItemFromStorage(next.storedItems, instanceId);
  return { ok: true, state: next };
}

export function equipStoredItem(state: InventoryState, heroId: string, instanceId: string): InventoryResult {
  const hero = state.heroes.find((entry) => entry.id === heroId);
  if (!hero) return { ok: false, error: "HERO_NOT_FOUND" };
  if (!getStoredItemInstance(state.storedItems, instanceId)) return { ok: false, error: "ITEM_NOT_FOUND" };
  const next = cloneState(state); const index = next.heroes.findIndex((entry) => entry.id === heroId);
  const equipped = equipItem(next.heroes[index], next.storedItems, instanceId);
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
