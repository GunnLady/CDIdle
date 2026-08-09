import { useState } from "react";
import type { StorageInventoryItemView } from "../../domain/storagePresentation";
import StoragePanelFrame from "./StoragePanelFrame";

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
  return <StoragePanelFrame title="Inventaire" subtitle="Sélectionnez un objet pour préparer son équipement" testId="item-inventory-panel" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1">
    {props.items.length === 0 ? <div className="rounded-lg border border-dashed border-[#4a321f] p-8 text-center">{props.totalItemCount === 0 ? <p className="text-xs text-[#8f7a67]">Votre coffre est vide.</p> : <><p className="text-xs text-[#8f7a67]">Aucun objet ne correspond aux filtres.</p><button type="button" onClick={props.onResetFilters} className="mt-3 min-h-11 text-xs font-bold text-[#caa050]">Réinitialiser les filtres</button></>}</div> : <div className="grid gap-3 md:grid-cols-2 xl:max-h-full xl:overflow-y-auto xl:pr-1 2xl:grid-cols-3">
      {props.items.map(({ instanceId, itemTypeLabel, item }) => {
        const selected = props.selectedItemInstanceId === instanceId;
        const pendingRecycle = pendingRecycleId === instanceId;
        return <article key={instanceId} data-testid={`storage-item-${instanceId}`} className={`flex flex-col rounded-xl border p-3 ${selected ? "border-[#caa050] bg-[#2a1b10]" : "border-[#3e2b1f] bg-[#130c08]"}`}>
          <button type="button" aria-pressed={selected} onClick={() => props.onSelect(instanceId)} className="min-h-11 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
            <span className="flex items-start justify-between gap-2"><span><span className="block text-[9px] uppercase text-[#8f7a67]">{itemTypeLabel}</span><strong className="font-serif text-xs text-[#eadabc]">{item.name}</strong></span><span className="text-[9px] uppercase text-[#caa050]">{item.rarity}</span></span>
            {item.facts.length > 0 && <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-[#9f8872]">{item.facts.map((fact) => <span key={fact}>{fact}</span>)}</span>}
            {item.modifiers.length > 0 && <span className="mt-2 flex flex-wrap gap-1">{item.modifiers.map((modifier) => <span key={modifier.id} className="rounded border border-[#63451f] px-1.5 py-0.5 text-[9px] text-amber-400">{modifier.label}</span>)}</span>}
          </button>
          <div className="mt-3 flex gap-2 border-t border-[#3e2b1f] pt-2">
            <button type="button" onClick={() => props.onSelect(instanceId)} className="min-h-11 flex-1 rounded border border-[#6e4b2b] text-[10px] font-bold text-[#caa050]">{selected ? "Sélectionné" : "Équiper"}</button>
            {props.canRecycle && props.onRecycle && (pendingRecycle ? <><button type="button" disabled={!props.canMutate} onClick={() => { props.onRecycle?.(instanceId); setPendingRecycleId(null); }} className="min-h-11 rounded border border-red-700 px-2 text-[9px] font-bold text-red-300 disabled:opacity-35">Confirmer</button><button type="button" onClick={() => setPendingRecycleId(null)} className="min-h-11 rounded px-2 text-[9px] text-[#a89078]">Annuler</button></> : <button type="button" disabled={!props.canMutate} onClick={() => setPendingRecycleId(instanceId)} className="min-h-11 rounded border border-red-900/60 px-2 text-[9px] text-red-400 disabled:opacity-35">Recycler</button>)}
          </div>
        </article>;
      })}
    </div>}
  </StoragePanelFrame>;
}
