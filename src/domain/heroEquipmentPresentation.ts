import { getItemById, getItemHandedness, getItemSlot } from "../../shared/domain/items/items";
import type { Hero, HeroEquipment, ItemInfo, Modifier, Rarity, StoredItemInstance } from "../types";
import { applyItemRarityScaling, equipItem, isMainHandTwoHanded, resolveEquippedItem, resolveWeaponDamageTypes } from "../utils/gameCalculations";
import { formatWeaponAttackSpeed, getWeaponAttackProfileLabel, getWeaponScalingLabel } from "./weaponPresentation";

export type EquipmentSlot = keyof HeroEquipment;

export interface EquipmentModifierView {
  id: string;
  label: string;
  value: string;
}

export interface EquipmentFactView {
  id: string;
  label: string;
  value: string;
}

export interface EquipmentItemView {
  name: string;
  rarity?: Rarity;
  rarityLabel?: string;
  description?: string;
  facts: EquipmentFactView[];
  modifiers: EquipmentModifierView[];
}

export interface EquipmentCandidateView {
  instanceId: string;
  item: EquipmentItemView;
  levelBlocked: boolean;
  requiredLevel: number;
  displacedItems: string[];
  statDeltas: Array<{ label: string; value: number; before: number; after: number }>;
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

export interface EquipmentCandidateTargetView {
  key: EquipmentSlot;
  label: string;
  icon: string;
  blocked: boolean;
  blockReason?: string;
  item: EquipmentItemView | null;
  candidate: EquipmentCandidateView | null;
}

const slots: Array<{ key: EquipmentSlot; label: string; icon: string }> = [
  { key: "mainHand", label: "Main principale", icon: "🗡️" },
  { key: "offHand", label: "Main gauche", icon: "🛡️" },
  { key: "armor", label: "Armure", icon: "👕" },
  { key: "accessory", label: "Accessoire", icon: "💍" },
];

const statLabels = {
  physicalDamage: "Dégâts physiques",
  magicDamage: "Dégâts magiques",
  physicalDefense: "Défense physique",
  magicDefense: "Défense magique",
  maxHp: "Points de vie max",
  maxMana: "Mana max",
  speed: "Vitesse",
  dodgeChance: "Chance d’esquive",
  criticalChance: "Chance de critique",
  estimatedDps: "Dégâts par seconde",
} as const;

const rarityLabels: Record<Rarity, string> = {
  common: "Commune",
  uncommon: "Inhabituelle",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
};

const damageTypeLabels: Record<string, string> = {
  physical: "Physiques",
  arcane: "Arcaniques",
  fire: "Feu",
  ice: "Glace",
  water: "Eau",
  earth: "Terre",
  wind: "Vent",
  lightning: "Foudre",
  holy: "Sacrés",
  dark: "Ténèbres",
  nature: "Nature",
  sound: "Sonores",
  poison: "Poison",
  blood: "Sang",
  radiant: "Radiants",
};

const comparisonKeys = Object.keys(statLabels) as Array<keyof typeof statLabels>;

function modifierViews(modifiers?: Modifier[]): EquipmentModifierView[] {
  return (modifiers ?? []).map((modifier, index) => ({
    id: `${modifier.stat}-${index}`,
    label: statLabels[modifier.stat as keyof typeof statLabels] ?? modifier.stat,
    value: `${modifier.value >= 0 ? "+" : ""}${modifier.value}${modifier.type === "percent" ? " %" : ""}`,
  }));
}

export function createEquipmentItemView(item: ItemInfo, rarity?: Rarity): EquipmentItemView {
  const facts: EquipmentFactView[] = [];
  if (item.requiredLevel !== undefined) facts.push({ id: "required-level", label: "Niveau requis", value: String(item.requiredLevel) });
  if (item.itemType === "weapon" && item.damageRange) facts.push({ id: "damage", label: "Dégâts", value: `${item.damageRange.min} à ${item.damageRange.max}` });
  if (item.itemType === "weapon" && item.attackSpeed !== undefined) facts.push({ id: "attack-speed", label: "Vitesse d’attaque", value: formatWeaponAttackSpeed(item.attackSpeed) });
  if (item.itemType === "weapon") facts.push({ id: "damage-types", label: "Type de dégâts", value: resolveWeaponDamageTypes(item).map((type) => damageTypeLabels[type] ?? type).join(", ") });
  if (item.itemType === "weapon") facts.push({ id: "scaling", label: "Caractéristique", value: getWeaponScalingLabel(item) });
  if (item.itemType === "weapon") facts.push({ id: "attack-profile", label: "Profil d’attaque", value: getWeaponAttackProfileLabel(item) });
  return { name: item.name, rarity, rarityLabel: rarity ? rarityLabels[rarity] : undefined, description: item.description, facts, modifiers: modifierViews(item.modifiers) };
}

export function resolveStoredEquipmentItem(instance: StoredItemInstance): ItemInfo | null {
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

function statDeltas(hero: Hero, instance: StoredItemInstance) {
  const previewHero = { ...hero, equipment: { ...(hero.equipment ?? {}) } };
  const previewStorage = [{ ...instance, modifiers: instance.modifiers?.map((modifier) => ({ ...modifier })) }];
  const projected = equipItem(previewHero, previewStorage, instance.instanceId);
  return comparisonKeys.flatMap((key) => {
    const before = hero.calculatedStats[key];
    const after = projected.calculatedStats[key];
    if (typeof before !== "number" || typeof after !== "number") return [];
    const value = Math.round((after - before) * 100) / 100;
    return value === 0 ? [] : [{ label: statLabels[key], value, before, after }];
  });
}

function createEquipmentCandidateView(
  hero: Hero,
  instance: StoredItemInstance,
  item: ItemInfo,
): EquipmentCandidateView {
  return {
    instanceId: instance.instanceId,
    item: createEquipmentItemView(item, instance.rarity),
    levelBlocked: hero.level < (item.requiredLevel ?? 1),
    requiredLevel: item.requiredLevel ?? 1,
    displacedItems: displacedItemNames(hero, getItemSlot(item), item),
    statDeltas: statDeltas(hero, instance),
  };
}

export function createEquipmentCandidateTargetView(
  hero: Hero,
  instance: StoredItemInstance,
): EquipmentCandidateTargetView | null {
  const candidateItem = resolveStoredEquipmentItem(instance);
  if (!candidateItem) return null;
  const key = getItemSlot(candidateItem);
  const definition = slots.find((slot) => slot.key === key);
  if (!definition) return null;
  const blocked = key === "offHand" && isMainHandTwoHanded(hero);
  const equippedRef = hero.equipment?.[key];
  const equipped = resolveEquippedItem(equippedRef);
  return {
    ...definition,
    blocked,
    blockReason: blocked ? "Bloquée par l’arme principale" : undefined,
    item: equipped ? createEquipmentItemView(equipped, equippedRef?.rarity) : null,
    candidate: blocked ? null : createEquipmentCandidateView(hero, instance, candidateItem),
  };
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
        const item = resolveStoredEquipmentItem(instance);
        if (!item || getItemSlot(item) !== slot.key) return [];
        return [createEquipmentCandidateView(hero, instance, item)];
      });
      return {
        ...slot,
        blocked,
        blockReason: blocked ? "Bloquée par l’arme principale" : undefined,
        item: equipped ? createEquipmentItemView(equipped, equippedRef?.rarity) : null,
        candidates,
      };
    }),
  };
}
