import { Search } from "lucide-react";
import { useState } from "react";
import type { Rarity } from "../../types";
import {
  defaultStorageFilters,
  countActiveAdvancedStorageFilters,
  hasActiveStorageFilters,
  type StorageFilters,
  type StorageLevelRange,
  type StorageSortDirection,
  type StorageSortKey,
} from "../../domain/storagePresentation";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import Select from "../../ui/primitives/Select";
import TextField from "../../ui/primitives/TextField";

const itemTypes = [["weapon", "Armes"], ["offhand", "Mains gauches"], ["armor", "Armures"], ["accessory", "Accessoires"]] as const;
const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

export default function StorageToolbar(props: { filters: StorageFilters; onChange: (filters: StorageFilters) => void; resultCount: number }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const update = <Key extends keyof StorageFilters>(key: Key, value: StorageFilters[Key]) => props.onChange({ ...props.filters, [key]: value });
  const activeAdvancedCount = countActiveAdvancedStorageFilters(props.filters);
  return <Panel title="Recherche et filtres" subtitle={`${props.resultCount} résultat(s)`} testId="storage-toolbar">
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 xl:grid-cols-[minmax(10rem,1.4fr)_repeat(5,minmax(0,1fr))_auto]">
      <TextField aria-label="Rechercher un objet" type="search" placeholder="Rechercher un objet..." value={props.filters.searchTerm} onChange={(event) => update("searchTerm", event.target.value)} leading={<Search className="h-4 w-4" />} />
      <Button type="button" size="sm" aria-expanded={advancedOpen} aria-controls="storage-advanced-filters" onClick={() => setAdvancedOpen((open) => !open)} className="uppercase xl:hidden">Filtres{activeAdvancedCount > 0 ? ` · ${activeAdvancedCount}` : ""}</Button>
      <div id="storage-advanced-filters" className={`${advancedOpen ? "grid" : "hidden"} col-span-full grid-cols-1 gap-2 sm:grid-cols-2 xl:contents`}>
        <Select aria-label="Type d’objet" value={props.filters.itemType} onChange={(event) => update("itemType", event.target.value)}><option value="all">Tous les types</option>{itemTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Select aria-label="Rareté" value={props.filters.rarity} onChange={(event) => update("rarity", event.target.value)}><option value="all">Toutes les raretés</option>{rarities.map((rarity) => <option key={rarity} value={rarity}>{rarity.toUpperCase()}</option>)}</Select>
        <Select aria-label="Tranche de niveau requis" value={props.filters.levelRange} onChange={(event) => update("levelRange", event.target.value as StorageLevelRange)}><option value="all">Tous les niveaux</option><option value="1-9">Niveaux 1–9</option><option value="10-19">Niveaux 10–19</option><option value="20-29">Niveaux 20–29</option><option value="30+">Niveaux 30+</option></Select>
        <Select aria-label="Critère de tri" value={props.filters.sortKey} onChange={(event) => update("sortKey", event.target.value as StorageSortKey)}><option value="none">Ordre du coffre</option><option value="rarity">Trier par rareté</option><option value="requiredLevel">Trier par niveau requis</option><option value="name">Trier par nom</option></Select>
        <Select aria-label="Direction du tri" value={props.filters.sortDirection} onChange={(event) => update("sortDirection", event.target.value as StorageSortDirection)} disabled={props.filters.sortKey === "none"}><option value="asc">Croissant</option><option value="desc">Décroissant</option></Select>
        <Button type="button" size="sm" disabled={!hasActiveStorageFilters(props.filters)} onClick={() => props.onChange({ ...defaultStorageFilters })}>Réinitialiser</Button>
      </div>
    </div>
  </Panel>;
}
