import HeroPortrait from "../HeroPortrait";
import EquipmentItemDetails from "../heroes/EquipmentItemDetails";
import EquipmentChangeSummary from "../heroes/EquipmentChangeSummary";
import type { StorageEquipmentDecisionView } from "../../domain/storagePresentation";
import StoragePanelFrame from "./StoragePanelFrame";

export default function StorageEquipmentDecisionPanel(props: {
  view: StorageEquipmentDecisionView | null;
  selectedHeroId: string | null;
  canMutate: boolean;
  onSelectHero: (heroId: string) => void;
  onEquip: (heroId: string, instanceId: string) => void;
}) {
  const selectedTarget = props.view?.targets.find((target) => target.heroId === props.selectedHeroId) ?? props.view?.targets[0] ?? null;
  return <StoragePanelFrame title="Décision d’équipement" subtitle={props.view ? "Choisissez le héros puis confirmez le remplacement" : "Sélectionnez un objet dans l’inventaire"} testId="storage-equipment-decision" className="xl:flex xl:min-h-0 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
    {!props.view ? <p className="rounded-lg border border-dashed border-[#4a321f] p-8 text-center text-xs text-[#8f7a67]">Aucun objet sélectionné.</p> : <div className="space-y-4">
      <div className="rounded-lg border border-[#6e4b2b] bg-[#21150d] p-3"><span className="mb-1 block text-[9px] uppercase tracking-wider text-[#8f7a67]">Nouvel objet</span><EquipmentItemDetails item={props.view.item} showDescription /></div>
      {props.view.targets.length === 0 ? <p className="rounded-lg border border-dashed border-[#4a321f] p-5 text-center text-xs text-[#8f7a67]">Aucun héros recruté.</p> : <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{props.view.targets.map((target) => <button key={target.heroId} type="button" aria-pressed={selectedTarget?.heroId === target.heroId} onClick={() => props.onSelectHero(target.heroId)} className={`flex min-h-16 items-center gap-2 rounded-lg border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] ${selectedTarget?.heroId === target.heroId ? "border-[#caa050] bg-[#2b1c11]" : "border-[#3f2b1c] bg-[#130c08]"}`}>
        <HeroPortrait hero={target.portrait} size="sm" />
        <span className="min-w-0"><strong className="block truncate font-serif text-xs text-[#eadabc]">{target.heroName}</strong><span className="block text-[9px] text-[#9f8872]">{target.identityLabel}</span><span className="block text-[9px] text-[#caa050]">{target.slotLabel}</span></span>
      </button>)}</div>}
      {selectedTarget && <div className="space-y-3 rounded-lg border border-[#3f2b1c] bg-[#120b07] p-3">
        {selectedTarget.candidate ? <EquipmentChangeSummary currentItem={selectedTarget.currentItem} candidate={selectedTarget.candidate} /> : <div><span className="mb-1 block text-[9px] uppercase text-[#8f7a67]">Équipement actuel</span>{selectedTarget.currentItem ? <EquipmentItemDetails item={selectedTarget.currentItem} /> : <p className="text-[10px] italic text-[#756353]">Emplacement vide</p>}</div>}
        {selectedTarget.blockedReason && <p role="status" className="rounded border border-red-900/50 p-2 text-[10px] text-red-400">{selectedTarget.blockedReason}</p>}
        <button type="button" disabled={!props.canMutate || !selectedTarget.candidate || Boolean(selectedTarget.blockedReason)} onClick={() => props.onEquip(selectedTarget.heroId, props.view!.instanceId)} className="min-h-11 w-full rounded-lg border border-[#d4af37]/60 bg-gradient-to-b from-[#caa050] to-[#8c5a2b] text-xs font-bold text-[#110905] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:border-[#3a281a] disabled:bg-none disabled:bg-[#21150d] disabled:text-[#756353]">{selectedTarget.currentItem ? "Remplacer" : "Équiper"}</button>
      </div>}
    </div>}
  </StoragePanelFrame>;
}
