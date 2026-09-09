import { RARITY_ORDER, getItemById } from "../../shared/domain/items/items";
import { recoverItemInstance } from "../../shared/domain/items/item-instance-recovery";
import { CANONICAL_HERO_STAT_PRESENTATION, type CanonicalHeroStat } from "../../shared/domain/hero-stats";
import type { Hero, ItemInfo, StoredForgeMaterialStack, StoredItemInstance } from "../types";
import { createForgeMaterialReserveView, type BossComponentGroupView, type ForgeMaterialView } from "./forgeMaterialPresentation";
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
export type StorageLevelRange = 'all' | '1-5' | '6-10' | '11-15' | '16-20'
  | '21-25' | '26-30' | '31-35' | '36-40';

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
  materials: ForgeMaterialView[];
  bossComponents: BossComponentGroupView[];
}

export interface StorageHeroChoiceView {
  heroId: string;
  heroName: string;
  portrait: HeroPortraitView;
  identityLabel: string;
  stats: Array<{ id: CanonicalHeroStat; label: string; name: string; value: string }>;
  subStats: Array<{ id: string; label: string; value: string }>;
  blockedReason?: string;
}

export interface StorageHeroEquipmentTargetView extends StorageHeroChoiceView {
  slot: EquipmentSlot;
  slotLabel: string;
  currentItem: EquipmentItemView | null;
  candidate: EquipmentCandidateView | null;
}

export interface StorageHeroItemChoiceView {
  instanceId: string;
  item: EquipmentItemView;
  slotLabel: string;
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
  return storedItems.flatMap((source, index): ResolvedStorageItem[] => {
    const instance = recoverItemInstance(source, `item:recovery:storage:${index}`) as unknown as StoredItemInstance | null;
    if (!instance) return [];
    const item = resolveStoredEquipmentItem(instance);
    if (!item) return [];
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
        modifiers: (item.modifiers ?? []).map((modifier, index) => ({
          id: `${modifier.stat}-${index}`,
          label: storageStatLabels[modifier.stat] ?? modifier.stat,
          value: `${modifier.value >= 0 ? "+" : ""}${modifier.value}${modifier.type === "percent" ? " %" : ""}`,
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
  const reserve = forgeUnlocked
    ? createForgeMaterialReserveView(forgeMaterials)
    : { materials: [], bossComponents: [] };
  return { itemCount, forgeUnlocked, ...reserve };
}

function matchesLevel(requiredLevel: number, range: StorageLevelRange): boolean {
  if (range === 'all') return true;
  const [minimum, maximum] = range.split('-').map(Number);
  return requiredLevel >= minimum && requiredLevel <= maximum;
}

export function filterAndSortStorageItems(items: ResolvedStorageItem[], filters: StorageFilters): ResolvedStorageItem[] {
  const search = filters.searchTerm.trim().toLocaleLowerCase("fr");
  const filtered = items.filter(({ item, rarity }) => {
    const matchesSearch = !search
      || item.name.toLocaleLowerCase("fr").includes(search)
      || getItemById(item.id)?.name.toLocaleLowerCase("fr").includes(search)
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

const storageHeroStatKeys: readonly CanonicalHeroStat[] = ["str", "agi", "end", "int", "wiz", "dex", "luk"];

function createStorageHeroChoiceView(hero: Hero, lockedHeroIds: readonly string[]): StorageHeroChoiceView {
  const baseStats = hero.baseStats ?? { str: 5, agi: 5, end: 5, int: 5, wiz: 5, dex: 5, luk: 5 };
  return {
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
    stats: storageHeroStatKeys.map((key) => ({
      id: key,
      label: CANONICAL_HERO_STAT_PRESENTATION[key].short,
      name: CANONICAL_HERO_STAT_PRESENTATION[key].name,
      value: String(baseStats[key] ?? 0),
    })),
    subStats: [
      { id: "hp", label: "PV", value: `${Math.max(0, Math.floor(hero.currentHp))}/${Math.max(1, hero.calculatedStats.maxHp)}` },
      { id: "mana", label: "PM", value: `${Math.max(0, Math.floor(hero.currentMana))}/${Math.max(0, hero.calculatedStats.maxMana)}` },
      { id: "dps", label: "DPS", value: hero.calculatedStats.estimatedDps.toFixed(2) },
      { id: "physical-damage", label: "Dég. phys.", value: String(hero.calculatedStats.physicalDamage) },
      { id: "magic-damage", label: "Dég. mag.", value: String(hero.calculatedStats.magicDamage) },
      { id: "physical-defense", label: "Déf. phys.", value: String(hero.calculatedStats.physicalDefense) },
      { id: "magic-defense", label: "Déf. mag.", value: String(hero.calculatedStats.magicDefense) },
      { id: "speed", label: "Vitesse", value: String(hero.calculatedStats.speed) },
      { id: "critical", label: "Critique", value: `${hero.calculatedStats.criticalChance}%` },
      { id: "dodge", label: "Esquive", value: `${hero.calculatedStats.dodgeChance}%` },
    ],
    blockedReason: lockedHeroIds.includes(hero.id) ? "Équipement verrouillé pendant l’expédition" : undefined,
  };
}

export function createStorageHeroChoiceViews(
  heroes: Hero[],
  lockedHeroIds: readonly string[] = [],
): StorageHeroChoiceView[] {
  return heroes.map((hero) => createStorageHeroChoiceView(hero, lockedHeroIds));
}

export function createStorageHeroItemChoiceViews(
  hero: Hero | null,
  storedItems: StoredItemInstance[],
): StorageHeroItemChoiceView[] {
  if (!hero) return [];
  return resolveStorageItems(storedItems).flatMap((instance): StorageHeroItemChoiceView[] => {
    const target = createEquipmentCandidateTargetView(hero, instance);
    if (!target?.candidate) return [];
    return [{
      instanceId: instance.instanceId,
      item: createEquipmentItemView(instance.item, instance.rarity),
      slotLabel: target.label,
      blockedReason: target.candidate.levelBlocked ? `Niveau ${target.candidate.requiredLevel} requis` : undefined,
    }];
  });
}

export function createStorageEquipmentDecisionView(
  selectedItem: StoredItemInstance | null,
  heroes: Hero[],
  lockedHeroIds: readonly string[] = [],
): StorageEquipmentDecisionView | null {
  if (!selectedItem) return null;
  const resolvedSelectedItem = resolveStoredEquipmentItem(selectedItem);
  if (!resolvedSelectedItem) return null;
  const targets = heroes.flatMap((hero): StorageHeroEquipmentTargetView[] => {
    const target = createEquipmentCandidateTargetView(hero, selectedItem);
    if (!target) return [];
    const candidate = target.candidate;
    return [{
      ...createStorageHeroChoiceView(hero, lockedHeroIds),
      slot: target.key,
      slotLabel: target.label,
      currentItem: target.item,
      candidate,
      blockedReason: lockedHeroIds.includes(hero.id)
        ? "Équipement verrouillé pendant l’expédition"
        : target.blocked ? target.blockReason : candidate?.levelBlocked ? `Niveau ${candidate.requiredLevel} requis` : undefined,
    }];
  });
  return {
    instanceId: selectedItem.instanceId,
    item: createEquipmentItemView(resolvedSelectedItem, selectedItem.rarity),
    targets,
  };
}
