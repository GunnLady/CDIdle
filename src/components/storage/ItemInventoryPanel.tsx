import { useState } from "react";
import type { StorageInventoryItemView } from "../../domain/storagePresentation";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import Card from "../../ui/components/Card";

export default function ItemInventoryPanel(props: {
  items: StorageInventoryItemView[];
  totalItemCount: number;
  selectedItemInstanceId: string | null;
  canMutate: boolean;
  canRecycle: boolean;
  onSelect: (instanceId: string) => void;
  onRecycle?: (instanceId: string) => void;
  onResetFilters: () => void;
}) {
  const [pendingRecycleId, setPendingRecycleId] = useState<string | null>(null);
  return <Panel title="Inventaire" subtitle="Sélectionnez un objet pour préparer son équipement" testId="item-inventory-panel" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1">
    {props.items.length === 0 ? <EmptySlot className="min-h-32 text-center">{props.totalItemCount === 0 ? "Votre coffre est vide." : <div className="flex flex-col items-center gap-3"><p>Aucun objet ne correspond aux filtres.</p><Button type="button" size="sm" onClick={props.onResetFilters}>Réinitialiser les filtres</Button></div>}</EmptySlot> : <div className="grid gap-3 md:grid-cols-2 xl:max-h-full xl:overflow-y-auto xl:pr-1 2xl:grid-cols-3">
      {props.items.map(({ instanceId, itemTypeLabel, item }) => {
        const selected = props.selectedItemInstanceId === instanceId;
        const pendingRecycle = pendingRecycleId === instanceId;
        return <Card key={instanceId} data-testid={`storage-item-${instanceId}`} selected={selected} className="flex flex-col">
          <button type="button" aria-pressed={selected} onClick={() => props.onSelect(instanceId)} className="min-h-11 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
            <span className="flex items-start justify-between gap-2"><span><span className="block text-[9px] uppercase text-[#8f7a67]">{itemTypeLabel}</span><strong className="font-serif text-xs text-[#eadabc]">{item.name}</strong></span><span className="text-[9px] uppercase text-[#caa050]">{item.rarity}</span></span>
            {item.facts.length > 0 && <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-[#9f8872]">{item.facts.map((fact) => <span key={fact}>{fact}</span>)}</span>}
            {item.modifiers.length > 0 && <span className="mt-2 flex flex-wrap gap-1">{item.modifiers.map((modifier) => <span key={modifier.id} className="rounded border border-[#63451f] px-1.5 py-0.5 text-[9px] text-amber-400">{modifier.label}</span>)}</span>}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#3e2b1f] pt-2">
            <Button type="button" size="sm" variant={selected ? "secondary" : "primary"} className={`min-w-0 whitespace-normal px-2 text-xs ${pendingRecycle ? "col-span-2" : ""}`} onClick={() => props.onSelect(instanceId)}>{selected ? "Sélectionné" : "Équiper"}</Button>
            {props.canRecycle && props.onRecycle && (pendingRecycle ? <><Button type="button" size="sm" variant="danger" disabled={!props.canMutate} className="min-w-0 whitespace-normal px-2 text-xs" onClick={() => { props.onRecycle?.(instanceId); setPendingRecycleId(null); }}>Confirmer</Button><Button type="button" size="sm" variant="ghost" className="min-w-0 whitespace-normal px-2 text-xs" onClick={() => setPendingRecycleId(null)}>Annuler</Button></> : <Button type="button" size="sm" variant="danger" disabled={!props.canMutate} className="min-w-0 whitespace-normal px-2 text-xs" onClick={() => setPendingRecycleId(instanceId)}>Recycler</Button>)}
          </div>
        </Card>;
      })}
    </div>}
  </Panel>;
}
