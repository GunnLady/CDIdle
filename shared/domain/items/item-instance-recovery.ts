import { getItemById } from "./items.ts";

export type RecoverableEquipmentSlot = "mainHand" | "offHand" | "armor" | "accessory";

const RECOVERY_ITEM_BY_SLOT: Record<RecoverableEquipmentSlot, string> = {
  mainHand: "starter_sword",
  offHand: "wooden_shield",
  armor: "traveler_clothes",
  accessory: "copper_focus_ring",
};

const RECOVERY_ITEM_BY_TYPE: Record<string, string> = {
  weapon: RECOVERY_ITEM_BY_SLOT.mainHand,
  offhand: RECOVERY_ITEM_BY_SLOT.offHand,
  armor: RECOVERY_ITEM_BY_SLOT.armor,
  accessory: RECOVERY_ITEM_BY_SLOT.accessory,
};

const RARITIES = new Set(["common", "uncommon", "rare", "epic", "legendary"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function recoverItemDefinitionId(
  input: Record<string, unknown>,
  slot?: RecoverableEquipmentSlot,
): string {
  const itemId = nonEmptyString(input.itemId);
  if (itemId) return itemId;
  const legacyId = nonEmptyString(input.id);
  if (legacyId && getItemById(legacyId)) return legacyId;
  if (slot) return RECOVERY_ITEM_BY_SLOT[slot];
  return RECOVERY_ITEM_BY_TYPE[String(input.itemType ?? "")] ?? RECOVERY_ITEM_BY_SLOT.mainHand;
}

export function recoverItemInstance(
  input: unknown,
  recoveryInstanceId: string,
  slot?: RecoverableEquipmentSlot,
): Record<string, unknown> | null {
  if (!isRecord(input)) return null;
  const itemId = recoverItemDefinitionId(input, slot);
  const definition = getItemById(itemId) ?? getItemById(slot ? RECOVERY_ITEM_BY_SLOT[slot] : RECOVERY_ITEM_BY_SLOT.mainHand)!;
  const instanceId = nonEmptyString(input.instanceId) ?? recoveryInstanceId;
  const rarity = RARITIES.has(String(input.rarity)) ? String(input.rarity) : "common";
  const recovered: Record<string, unknown> = {
    instanceId,
    itemId,
    itemLevel: Number.isInteger(input.itemLevel) ? input.itemLevel : definition.requiredLevel,
    powerModelId: nonEmptyString(input.powerModelId) ?? definition.powerModelId,
    rarity,
  };
  if (Array.isArray(input.modifiers)) recovered.modifiers = structuredClone(input.modifiers);
  if (nonEmptyString(input.sourceDungeonId)) recovered.sourceDungeonId = input.sourceDungeonId;
  if (nonEmptyString(input.sourceZoneId)) recovered.sourceZoneId = input.sourceZoneId;
  return recovered;
}
