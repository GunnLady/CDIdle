import { getItemById, getItemHandedness, getItemSlot } from "../../shared/domain/items/items";
import type { Hero, HeroEquipment, ItemInfo, Modifier, Rarity, StoredItemInstance } from "../types";
import { applyItemRarityScaling, equipItem, isMainHandTwoHanded, resolveEquippedItem, resolveWeaponDamageTypes } from "../utils/gameCalculations";
import { formatWeaponAttackSpeed, getWeaponAttackProfileLabel, getWeaponScalingLabel } from "./weaponPresentation";

export type EquipmentSlot = keyof HeroEquipment;

export interface EquipmentModifierView {
  id: string;
  label: string;
}

export interface EquipmentItemView {
  name: string;
  rarity?: Rarity;
  description?: string;
  facts: string[];
  modifiers: EquipmentModifierView[];
}

export interface EquipmentCandidateView {
  instanceId: string;
  item: EquipmentItemView;
  levelBlocked: boolean;
  requiredLevel: number;
  displacedItems: string[];
  statDeltas: Array<{ label: string; value: number }>;
}

export interface EquipmentSlotView {
  key: EquipmentSlot;
  label: string;
  icon: string;
  blocked: boolean;
  blockReason?: string;
  item: EquipmentItemView | null;
  candidates: EquipmentCandidateView[];
}

export interface HeroEquipmentView {
  heroId: string;
  heroName: string;
  slots: EquipmentSlotView[];
}

const slots: Array<{ key: EquipmentSlot; label: string; icon: string }> = [
  { key: "mainHand", label: "Main principale", icon: "🗡️" },
  { key: "offHand", label: "Main gauche", icon: "🛡️" },
  { key: "armor", label: "Armure", icon: "👕" },
  { key: "accessory", label: "Accessoire", icon: "💍" },
];

const statLabels = {
  physicalDamage: "Dégâts phys.",
  magicDamage: "Dégâts mag.",
  physicalDefense: "Défense phys.",
  magicDefense: "Défense mag.",
  maxHp: "PV max",
  maxMana: "PM max",
  speed: "Vitesse",
  dodgeChance: "Esquive",
  criticalChance: "Critique",
  estimatedDps: "DPS estimé",
} as const;

const comparisonKeys = Object.keys(statLabels) as Array<keyof typeof statLabels>;

function modifierViews(modifiers?: Modifier[]): EquipmentModifierView[] {
  return (modifiers ?? []).map((modifier, index) => ({
    id: `${modifier.stat}-${index}`,
    label: `${modifier.value >= 0 ? "+" : ""}${modifier.value}${modifier.type === "percent" ? "%" : ""} ${statLabels[modifier.stat as keyof typeof statLabels] ?? modifier.stat}`,
  }));
}

function itemView(item: ItemInfo, rarity?: Rarity): EquipmentItemView {
  const facts: string[] = [];
  if (item.requiredLevel !== undefined) facts.push(`Niv. requis ${item.requiredLevel}`);
  if (item.itemType === "weapon" && item.damageRange) facts.push(`Dégâts ${item.damageRange.min}-${item.damageRange.max}`);
  if (item.itemType === "weapon" && item.attackSpeed !== undefined) facts.push(`Indice vit. : ${formatWeaponAttackSpeed(item.attackSpeed)}`);
  if (item.itemType === "weapon") facts.push(resolveWeaponDamageTypes(item).join(", "));
  if (item.itemType === "weapon") facts.push(`Scaling: ${getWeaponScalingLabel(item)}`);
  if (item.itemType === "weapon") facts.push(`Profil: ${getWeaponAttackProfileLabel(item)}`);
  return { name: item.name, rarity, description: item.description, facts, modifiers: modifierViews(item.modifiers) };
}

function resolveStoredItem(instance: StoredItemInstance): ItemInfo | null {
  const base = getItemById(instance.itemId);
  if (!base) return null;
  const scaled = applyItemRarityScaling(base, instance.rarity);
  if (instance.modifiers?.length) scaled.modifiers = instance.modifiers.map((modifier) => ({ ...modifier }));
  return scaled;
}

function displacedItemNames(hero: Hero, slot: EquipmentSlot, candidate: ItemInfo): string[] {
  const displaced = [resolveEquippedItem(hero.equipment?.[slot])?.name].filter((name): name is string => Boolean(name));
  if (slot === "mainHand" && candidate.itemType === "weapon") {
    const handedness = getItemHandedness(candidate);
    if (handedness === "two_handed" || handedness === "dual_wield") {
      const offHand = resolveEquippedItem(hero.equipment?.offHand)?.name;
      if (offHand) displaced.push(offHand);
    }
  }
  return [...new Set(displaced)];
}

function statDeltas(hero: Hero, storedItems: StoredItemInstance[], instanceId: string) {
  const previewHero = { ...hero, equipment: { ...(hero.equipment ?? {}) } };
  const previewStorage = storedItems.map((instance) => ({ ...instance, modifiers: instance.modifiers?.map((modifier) => ({ ...modifier })) }));
  const projected = equipItem(previewHero, previewStorage, instanceId);
  return comparisonKeys.flatMap((key) => {
    const before = hero.calculatedStats[key];
    const after = projected.calculatedStats[key];
    if (typeof before !== "number" || typeof after !== "number") return [];
    const value = Math.round((after - before) * 100) / 100;
    return value === 0 ? [] : [{ label: statLabels[key], value }];
  });
}

export function createHeroEquipmentView(hero: Hero | null, storedItems: StoredItemInstance[]): HeroEquipmentView | null {
  if (!hero) return null;
  const offHandBlocked = isMainHandTwoHanded(hero);
  return {
    heroId: hero.id,
    heroName: hero.name,
    slots: slots.map((slot) => {
      const blocked = slot.key === "offHand" && offHandBlocked;
      const equippedRef = hero.equipment?.[slot.key];
      const equipped = resolveEquippedItem(equippedRef);
      const candidates = blocked ? [] : storedItems.flatMap((instance): EquipmentCandidateView[] => {
        const item = resolveStoredItem(instance);
        if (!item || getItemSlot(item) !== slot.key) return [];
        return [{
          instanceId: instance.instanceId,
          item: itemView(item, instance.rarity),
          levelBlocked: hero.level < (item.requiredLevel ?? 1),
          requiredLevel: item.requiredLevel ?? 1,
          displacedItems: displacedItemNames(hero, slot.key, item),
          statDeltas: statDeltas(hero, storedItems, instance.instanceId),
        }];
      });
      return {
        ...slot,
        blocked,
        blockReason: blocked ? "Bloquée par l’arme principale" : undefined,
        item: equipped ? itemView(equipped, equippedRef?.rarity) : null,
        candidates,
      };
    }),
  };
}
