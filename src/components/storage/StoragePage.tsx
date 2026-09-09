import { useEffect, useMemo, useState } from "react";
import type { Hero, StoredForgeMaterialStack, StoredItemInstance } from "../../types";
import {
  createStorageEquipmentDecisionView,
  createStorageHeroChoiceViews,
  createStorageHeroItemChoiceViews,
  createStorageInventoryItemViews,
  createStorageSummaryView,
  defaultStorageFilters,
  filterAndSortStorageItems,
  resolveStorageItems,
  type StorageFilters,
} from "../../domain/storagePresentation";
import ItemInventoryPanel from "./ItemInventoryPanel";
import StorageEquipmentDecisionPanel from "./StorageEquipmentDecisionPanel";
import StorageSummary from "./StorageSummary";
import StorageToolbar from "./StorageToolbar";

export interface StoragePageProps {
  storedItems: StoredItemInstance[];
  heroes?: Hero[];
  onEquipItem?: (heroId: string, instanceId: string) => void;
  isForgeUnlocked?: boolean;
  onScrapItem?: (instanceId: string) => void;
  forgeMaterials?: StoredForgeMaterialStack[];
  canMutate?: boolean;
  lockedHeroIds?: string[];
}

export default function StoragePage({ storedItems = [], heroes = [], onEquipItem, isForgeUnlocked = false, onScrapItem, forgeMaterials = [], canMutate = true, lockedHeroIds = [] }: StoragePageProps) {
  const [filters, setFilters] = useState<StorageFilters>({ ...defaultStorageFilters });
  const [selectedItemInstanceId, setSelectedItemInstanceId] = useState<string | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const resolvedItems = useMemo(() => resolveStorageItems(storedItems), [storedItems]);
  const filteredItems = useMemo(() => filterAndSortStorageItems(resolvedItems, filters), [filters, resolvedItems]);
  const inventoryItems = useMemo(() => createStorageInventoryItemViews(filteredItems), [filteredItems]);
  const summary = useMemo(() => createStorageSummaryView(resolvedItems.length, isForgeUnlocked, forgeMaterials), [forgeMaterials, isForgeUnlocked, resolvedItems.length]);
  const selectedItem = resolvedItems.find((item) => item.instanceId === selectedItemInstanceId) ?? null;
  const heroChoices = useMemo(() => createStorageHeroChoiceViews(heroes, lockedHeroIds), [heroes, lockedHeroIds]);
  const selectedHero = heroes.find((hero) => hero.id === selectedHeroId) ?? null;
  const heroItemChoices = useMemo(() => createStorageHeroItemChoiceViews(selectedHero, storedItems), [selectedHero, storedItems]);
  const decision = useMemo(() => createStorageEquipmentDecisionView(selectedItem, heroes, lockedHeroIds), [heroes, lockedHeroIds, selectedItem]);

  useEffect(() => {
    if (selectedItemInstanceId && !resolvedItems.some((item) => item.instanceId === selectedItemInstanceId)) setSelectedItemInstanceId(null);
  }, [resolvedItems, selectedItemInstanceId]);
  useEffect(() => {
    if (selectedHeroId && !heroes.some((hero) => hero.id === selectedHeroId)) setSelectedHeroId(null);
  }, [heroes, selectedHeroId]);

  return <section aria-labelledby="storage-page-title" className="space-y-4 animate-fade-in motion-reduce:animate-none">
    <h2 id="storage-page-title" className="sr-only">Coffre</h2>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,1fr)]" data-testid="storage-page-layout">
      <div data-testid="storage-master-column" className="space-y-4">
        <StorageSummary view={summary} />
        <StorageToolbar filters={filters} onChange={setFilters} resultCount={filteredItems.length} />
        <ItemInventoryPanel items={inventoryItems} totalItemCount={resolvedItems.length} selectedItemInstanceId={selectedItemInstanceId} canMutate={canMutate} canRecycle={isForgeUnlocked} onSelect={(instanceId) => { setSelectedItemInstanceId(instanceId); setSelectedHeroId(null); }} onRecycle={onScrapItem} onResetFilters={() => setFilters({ ...defaultStorageFilters })} />
      </div>
      <StorageEquipmentDecisionPanel view={decision} heroes={heroChoices} itemChoices={heroItemChoices} selectedHeroId={selectedHeroId} selectedItemInstanceId={selectedItemInstanceId} canMutate={canMutate && Boolean(onEquipItem)} onSelectHero={setSelectedHeroId} onSelectItem={setSelectedItemInstanceId} onClearItem={() => setSelectedItemInstanceId(null)} onEquip={(heroId, instanceId) => onEquipItem?.(heroId, instanceId)} />
    </div>
  </section>;
}
