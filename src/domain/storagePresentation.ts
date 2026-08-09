import { RARITY_ORDER, getItemById } from "../../shared/domain/items/items";
import type { Hero, ItemInfo, StoredForgeMaterialStack, StoredItemInstance } from "../types";
import { applyItemRarityScaling, FORGE_MATERIALS } from "../utils/gameCalculations";
import {
  createEquipmentCandidateTargetView,
  createEquipmentItemView,
  resolveStoredEquipmentItem,
  type EquipmentCandidateView,
  type EquipmentItemView,
  type EquipmentSlot,
} from "./heroEquipmentPresentation";
import type { HeroPortraitView } from "./heroPortrait";

export type StorageSortKey = "none" | "rarity" | "requiredLevel" | "name";
export type StorageSortDirection = "asc" | "desc";
export type StorageLevelRange = "all" | "1-9" | "10-19" | "20-29" | "30+";

export interface StorageFilters {
  searchTerm: string;
  rarity: string;
  itemType: string;
  levelRange: StorageLevelRange;
  sortKey: StorageSortKey;
  sortDirection: StorageSortDirection;
}

export type ResolvedStorageItem = StoredItemInstance & { item: ItemInfo };

export interface StorageInventoryItemView {
  instanceId: string;
  itemTypeLabel: string;
  item: EquipmentItemView;
}

export interface StorageSummaryView {
  itemCount: number;
  forgeUnlocked: boolean;
  materials: Array<{ id: string; name: string; description: string; count: number }>;
}

export interface StorageHeroEquipmentTargetView {
  heroId: string;
  heroName: string;
  portrait: HeroPortraitView;
  identityLabel: string;
  slot: EquipmentSlot;
  slotLabel: string;
  currentItem: EquipmentItemView | null;
  candidate: EquipmentCandidateView | null;
  blockedReason?: string;
}

export interface StorageEquipmentDecisionView {
  instanceId: string;
  item: EquipmentItemView;
  targets: StorageHeroEquipmentTargetView[];
}

export const defaultStorageFilters: StorageFilters = {
  searchTerm: "",
  rarity: "all",
  itemType: "all",
  levelRange: "all",
  sortKey: "none",
  sortDirection: "asc",
};

export function resolveStorageItems(storedItems: StoredItemInstance[]): ResolvedStorageItem[] {
  return storedItems.flatMap((instance): ResolvedStorageItem[] => {
    const baseItem = getItemById(instance.itemId);
    if (!baseItem) return [];
    const item = applyItemRarityScaling(baseItem, instance.rarity);
    if (instance.modifiers?.length) item.modifiers = instance.modifiers.map((modifier) => ({ ...modifier }));
    return [{ ...instance, item }];
  });
}

const itemTypeLabels: Record<ItemInfo["itemType"], string> = {
  weapon: "Arme",
  offhand: "Main gauche",
  armor: "Armure",
  accessory: "Accessoire",
};

const storageStatLabels: Record<string, string> = {
  physicalDamage: "Dégâts Phys",
  magicDamage: "Dégâts Mag",
  physicalDefense: "Défense Phys",
  magicDefense: "Défense Mag",
  maxHp: "PV Max",
  maxMana: "PM Max",
  speed: "Vitesse",
  dodgeChance: "Esquive",
  criticalChance: "Coup Critique",
  blockChance: "Blocage",
  healthRegen: "Régén. PV",
  manaRegen: "Régén. PM",
};

export function createStorageInventoryItemViews(items: ResolvedStorageItem[]): StorageInventoryItemView[] {
  return items.map(({ instanceId, rarity, item }) => {
    const baseView = createEquipmentItemView(item, rarity);
    return {
      instanceId,
      itemTypeLabel: itemTypeLabels[item.itemType],
      item: {
        ...baseView,
        facts: baseView.facts.map((fact) => fact
          .replace(/^Dégâts /, "Dégâts : ")
          .replace(/^Scaling:/, "Scaling :")
          .replace(/^Profil:/, "Profil :")),
        modifiers: (item.modifiers ?? []).map((modifier, index) => ({
          id: `${modifier.stat}-${index}`,
          label: `${modifier.value >= 0 ? "+" : ""}${modifier.value}${modifier.type === "percent" ? "%" : ""} ${storageStatLabels[modifier.stat] ?? modifier.stat}`,
        })),
      },
    };
  });
}

export function createStorageSummaryView(
  itemCount: number,
  forgeUnlocked: boolean,
  forgeMaterials: StoredForgeMaterialStack[],
): StorageSummaryView {
  return {
    itemCount,
    forgeUnlocked,
    materials: forgeUnlocked ? FORGE_MATERIALS.map((material) => ({
      id: material.id,
      name: material.name,
      description: material.description,
      count: forgeMaterials.find((stack) => stack.materialId === material.id)?.count ?? 0,
    })) : [],
  };
}

function matchesLevel(requiredLevel: number, range: StorageLevelRange): boolean {
  if (range === "all") return true;
  if (range === "1-9") return requiredLevel >= 1 && requiredLevel <= 9;
  if (range === "10-19") return requiredLevel >= 10 && requiredLevel <= 19;
  if (range === "20-29") return requiredLevel >= 20 && requiredLevel <= 29;
  return requiredLevel >= 30;
}

export function filterAndSortStorageItems(items: ResolvedStorageItem[], filters: StorageFilters): ResolvedStorageItem[] {
  const search = filters.searchTerm.trim().toLocaleLowerCase("fr");
  const filtered = items.filter(({ item, rarity }) => {
    const matchesSearch = !search
      || item.name.toLocaleLowerCase("fr").includes(search)
      || item.description?.toLocaleLowerCase("fr").includes(search);
    return Boolean(matchesSearch)
      && (filters.rarity === "all" || rarity === filters.rarity)
      && (filters.itemType === "all" || item.itemType === filters.itemType)
      && matchesLevel(item.requiredLevel ?? 1, filters.levelRange);
  });
  if (filters.sortKey === "none") return filtered;
  const direction = filters.sortDirection === "asc" ? 1 : -1;
  return filtered
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((left, right) => {
      const comparison = filters.sortKey === "rarity"
        ? RARITY_ORDER.indexOf(left.item.rarity) - RARITY_ORDER.indexOf(right.item.rarity)
        : filters.sortKey === "requiredLevel"
          ? (left.item.item.requiredLevel ?? 1) - (right.item.item.requiredLevel ?? 1)
          : left.item.item.name.localeCompare(right.item.item.name, "fr", { sensitivity: "base" });
      return comparison === 0 ? left.originalIndex - right.originalIndex : comparison * direction;
    })
    .map(({ item }) => item);
}

export function hasActiveStorageFilters(filters: StorageFilters): boolean {
  return Object.entries(defaultStorageFilters).some(([key, value]) => filters[key as keyof StorageFilters] !== value);
}

export function countActiveAdvancedStorageFilters(filters: StorageFilters): number {
  return [
    filters.rarity !== defaultStorageFilters.rarity,
    filters.itemType !== defaultStorageFilters.itemType,
    filters.levelRange !== defaultStorageFilters.levelRange,
    filters.sortKey !== defaultStorageFilters.sortKey,
    filters.sortKey !== "none" && filters.sortDirection !== defaultStorageFilters.sortDirection,
  ].filter(Boolean).length;
}

export function createStorageEquipmentDecisionView(
  selectedItem: StoredItemInstance | null,
  heroes: Hero[],
): StorageEquipmentDecisionView | null {
  if (!selectedItem) return null;
  const resolvedSelectedItem = resolveStoredEquipmentItem(selectedItem);
  if (!resolvedSelectedItem) return null;
  const targets = heroes.flatMap((hero): StorageHeroEquipmentTargetView[] => {
    const target = createEquipmentCandidateTargetView(hero, selectedItem);
    if (!target) return [];
    const candidate = target.candidate;
    return [{
      heroId: hero.id,
      heroName: hero.name,
      portrait: {
        id: hero.id,
        name: hero.name,
        classType: hero.classType,
        gender: hero.gender,
        spriteIndex: hero.spriteIndex,
      },
      identityLabel: `${hero.classType} · Niv. ${hero.level}`,
      slot: target.key,
      slotLabel: target.label,
      currentItem: target.item,
      candidate,
      blockedReason: target.blocked ? target.blockReason : candidate?.levelBlocked ? `Niveau ${candidate.requiredLevel} requis` : undefined,
    }];
  });
  return {
    instanceId: selectedItem.instanceId,
    item: createEquipmentItemView(resolvedSelectedItem, selectedItem.rarity),
    targets,
  };
}
