import type { Rarity, StoredForgeMaterialStack, StoredItemStack, Modifier } from "../types";
import { BASIC_FORGE_CRAFT_COST, BASIC_FORGE_UPGRADE_COSTS, scrapItemFromStorage, type BasicForgeUpgradeProc } from "../utils/gameCalculations";

export type ForgeCostResult = { ok: true; materials: StoredForgeMaterialStack[] } | { ok: false; error: "FORGE_LOCKED" | "BLUEPRINT_LOCKED" | "INSUFFICIENT_MATERIALS" };

const clone = (materials: StoredForgeMaterialStack[]) => materials.map((material) => ({ ...material }));
const consume = (materials: StoredForgeMaterialStack[], costs: StoredForgeMaterialStack[]): StoredForgeMaterialStack[] | null => {
  const next = clone(materials);
  for (const cost of costs) {
    const stack = next.find((entry) => entry.materialId === cost.materialId && entry.rarity === cost.rarity);
    if (!stack || stack.count < cost.count) return null;
    stack.count -= cost.count;
  }
  return next.filter((entry) => entry.count > 0);
};

export function startBasicCraft(materials: StoredForgeMaterialStack[], forgeUnlocked: boolean, blueprintUnlocked: boolean): ForgeCostResult {
  if (!forgeUnlocked) return { ok: false, error: "FORGE_LOCKED" };
  if (!blueprintUnlocked) return { ok: false, error: "BLUEPRINT_LOCKED" };
  const next = consume(materials, BASIC_FORGE_CRAFT_COST);
  return next ? { ok: true, materials: next } : { ok: false, error: "INSUFFICIENT_MATERIALS" };
}

export function applyUpgradeCost(materials: StoredForgeMaterialStack[], proc: BasicForgeUpgradeProc): ForgeCostResult {
  if (proc === "none") return { ok: true, materials: clone(materials) };
  const next = consume(materials, BASIC_FORGE_UPGRADE_COSTS[proc]);
  return next ? { ok: true, materials: next } : { ok: false, error: "INSUFFICIENT_MATERIALS" };
}

export function recycleItem(storedItems: StoredItemStack[], forgeMaterials: StoredForgeMaterialStack[], forgeUnlocked: boolean, itemId: string, rarity: Rarity, modifiers?: Modifier[]): { ok: true; storedItems: StoredItemStack[]; forgeMaterials: StoredForgeMaterialStack[]; rewards: StoredForgeMaterialStack[] } | { ok: false; error: "FORGE_LOCKED" | "ITEM_NOT_FOUND" } {
  if (!forgeUnlocked) return { ok: false, error: "FORGE_LOCKED" };
  const result = scrapItemFromStorage(storedItems, forgeMaterials, itemId, rarity, modifiers);
  if (result.rewards.length === 0) return { ok: false, error: "ITEM_NOT_FOUND" };
  return { ok: true, ...result };
}
