export type ForgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ForgeMaterialStack = { materialId: string; rarity: ForgeRarity; count: number };
type ItemStack = { itemId: string; rarity: ForgeRarity; count: number; modifiers?: Array<Record<string, unknown>> };

export type ForgeCommand =
  | { type: "forge.start"; recipeId: string; commandId?: string }
  | { type: "forge.finalize"; previewId: string; accepted?: boolean; chosenModifierStat?: string }
  | { type: "forge.cancel"; previewId: string }
  | { type: "inventory.recycle"; itemId: string; rarity: ForgeRarity; modifiers?: Array<Record<string, unknown>> };

export class ForgeCommandError extends Error { constructor(public readonly code: string, message: string) { super(message); } }
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const craftCost: ForgeMaterialStack[] = [
  { materialId: "metal_scrap", rarity: "common", count: 6 },
  { materialId: "refined_metal", rarity: "uncommon", count: 1 },
];
const rewards: Record<ForgeRarity, ForgeMaterialStack[]> = {
  common: [{ materialId: "metal_scrap", rarity: "common", count: 2 }],
  uncommon: [{ materialId: "metal_scrap", rarity: "common", count: 4 }, { materialId: "refined_metal", rarity: "uncommon", count: 2 }],
  rare: [{ materialId: "metal_scrap", rarity: "common", count: 3 }, { materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 2 }],
  epic: [{ materialId: "refined_metal", rarity: "uncommon", count: 4 }, { materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }],
  legendary: [{ materialId: "enchanted_fragment", rarity: "rare", count: 4 }, { materialId: "arcane_core", rarity: "epic", count: 2 }, { materialId: "legendary_essence", rarity: "legendary", count: 1 }],
};

const sameModifiers = (a?: Array<Record<string, unknown>>, b?: Array<Record<string, unknown>>) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
const consume = (source: ForgeMaterialStack[], cost: ForgeMaterialStack[]) => {
  const next = clone(source);
  for (const entry of cost) {
    const stack = next.find((candidate) => candidate.materialId === entry.materialId && candidate.rarity === entry.rarity);
    if (!stack || stack.count < entry.count) throw new ForgeCommandError("INSUFFICIENT_MATERIALS", "insufficient forge materials");
    stack.count -= entry.count;
  }
  return next.filter((entry) => entry.count > 0);
};
const addMaterial = (target: ForgeMaterialStack[], reward: ForgeMaterialStack) => {
  const existing = target.find((entry) => entry.materialId === reward.materialId && entry.rarity === reward.rarity);
  if (existing) existing.count += reward.count;
  else target.push({ ...reward });
};

export function applyForgeCommand(current: Record<string, unknown>, command: Record<string, unknown>): { state: Record<string, unknown>; events: unknown[] } {
  const materials = clone((current.forgeMaterials as ForgeMaterialStack[] | undefined) ?? []);
  const items = clone((current.storedItems as ItemStack[] | undefined) ?? []);
  const pending = clone((current.pendingForge as Record<string, unknown> | null | undefined) ?? null);
  const typed = command as ForgeCommand;
  const forgeUnlocked = Number((current.buildings as Record<string, number> | undefined)?.forge ?? 0) >= 1;
  if (!forgeUnlocked) throw new ForgeCommandError("FORGE_LOCKED", "forge building is required");

  if (typed.type === "forge.start") {
    if (typed.recipeId !== "starter_sword") throw new ForgeCommandError("BLUEPRINT_LOCKED", "unknown forge blueprint");
    if (pending) throw new ForgeCommandError("FORGE_PENDING", "a forge preview is already pending");
    const nextMaterials = consume(materials, craftCost);
    const previewId = `preview-${typed.commandId ?? "command"}`;
    return { state: { ...current, forgeMaterials: nextMaterials, pendingForge: { previewId, recipeId: typed.recipeId, itemId: "starter_sword", upgradeProc: "none" } }, events: [{ type: "forge.preview_created", previewId, itemId: "starter_sword" }] };
  }

  if (typed.type === "forge.cancel") {
    if (!pending || pending.previewId !== typed.previewId) throw new ForgeCommandError("PREVIEW_NOT_FOUND", "forge preview not found");
    return { state: { ...current, pendingForge: null }, events: [{ type: "forge.preview_cancelled", previewId: typed.previewId }] };
  }

  if (typed.type === "forge.finalize") {
    if (!pending || pending.previewId !== typed.previewId) throw new ForgeCommandError("PREVIEW_NOT_FOUND", "forge preview not found");
    if (typed.accepted === false) return { state: { ...current, pendingForge: null }, events: [{ type: "forge.preview_declined", previewId: typed.previewId }] };
    const index = items.findIndex((entry) => entry.itemId === String(pending.itemId) && entry.rarity === "common" && sameModifiers(entry.modifiers, undefined));
    if (index === -1) items.push({ itemId: "starter_sword", rarity: "common", count: 1 });
    else items[index].count += 1;
    return { state: { ...current, storedItems: items, pendingForge: null }, events: [{ type: "forge.finalized", previewId: typed.previewId, itemId: "starter_sword", rarity: "common" }] };
  }

  if (typed.type === "inventory.recycle") {
    const index = items.findIndex((entry) => entry.itemId === typed.itemId && entry.rarity === typed.rarity && entry.count > 0 && sameModifiers(entry.modifiers, typed.modifiers));
    if (index === -1) throw new ForgeCommandError("ITEM_NOT_FOUND", "item stack is unavailable");
    items[index].count -= 1;
    if (items[index].count === 0) items.splice(index, 1);
    const nextMaterials = clone(materials);
    for (const reward of rewards[typed.rarity]) addMaterial(nextMaterials, reward);
    return { state: { ...current, storedItems: items, forgeMaterials: nextMaterials }, events: [{ type: "inventory.recycled", itemId: typed.itemId, rarity: typed.rarity, rewards: rewards[typed.rarity] }] };
  }

  throw new ForgeCommandError("INVALID_COMMAND", "unsupported forge command");
}
