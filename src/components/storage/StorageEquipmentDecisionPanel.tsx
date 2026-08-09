import HeroPortrait from "../HeroPortrait";
import EquipmentItemDetails from "../heroes/EquipmentItemDetails";
import EquipmentChangeSummary from "../heroes/EquipmentChangeSummary";
import type { StorageEquipmentDecisionView } from "../../domain/storagePresentation";
import Alert from "../../ui/components/Alert";
import Card from "../../ui/components/Card";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import SelectableCard from "../../ui/components/SelectableCard";
import Button from "../../ui/primitives/Button";

export default function StorageEquipmentDecisionPanel(props: {
  view: StorageEquipmentDecisionView | null;
  selectedHeroId: string | null;
  canMutate: boolean;
  onSelectHero: (heroId: string) => void;
  onEquip: (heroId: string, instanceId: string) => void;
}) {
  const selectedTarget = props.view?.targets.find((target) => target.heroId === props.selectedHeroId) ?? props.view?.targets[0] ?? null;
  return <Panel title="Décision d’équipement" subtitle={props.view ? "Choisissez le héros puis confirmez le remplacement" : "Sélectionnez un objet dans l’inventaire"} testId="storage-equipment-decision" className="xl:flex xl:min-h-0 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
    {!props.view ? <EmptySlot className="min-h-32 text-center">Aucun objet sélectionné.</EmptySlot> : <div className="space-y-4">
      <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Héros cible</h4>
      {props.view.targets.length === 0 ? <EmptySlot className="min-h-32 text-center">Aucun héros recruté.</EmptySlot> : <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{props.view.targets.map((target) => <SelectableCard key={target.heroId} selected={selectedTarget?.heroId === target.heroId} onClick={() => props.onSelectHero(target.heroId)} className="flex min-h-16 items-center gap-2 p-2">
        <HeroPortrait hero={target.portrait} size="sm" />
        <span className="min-w-0"><strong className="block truncate font-serif text-xs text-[#eadabc]">{target.heroName}</strong><span className="block text-[9px] text-[#9f8872]">{target.identityLabel}</span><span className="block text-[9px] text-[#caa050]">{target.slotLabel}</span></span>
      </SelectableCard>)}</div>}
      </section>
      {selectedTarget && <>
        <div className="grid gap-3 sm:grid-cols-2">
          <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Équipement actuel</h4><Card>{selectedTarget.currentItem ? <EquipmentItemDetails item={selectedTarget.currentItem} showDescription /> : <p className="text-[10px] italic text-[#756353]">Emplacement vide</p>}</Card></section>
          <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Équipement sélectionné</h4><Card><EquipmentItemDetails item={props.view.item} showDescription /></Card></section>
        </div>
        <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Gains et pertes</h4><Card>{selectedTarget.candidate ? <EquipmentChangeSummary currentItem={selectedTarget.currentItem} candidate={selectedTarget.candidate} showItems={false} /> : <p className="text-[10px] text-[#8f7a67]">Comparatif indisponible pour cet emplacement.</p>}</Card></section>
        {selectedTarget.blockedReason && <Alert variant="error" live="polite">{selectedTarget.blockedReason}</Alert>}
        <div><span className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Action</span><Button type="button" variant="primary" block disabled={!props.canMutate || !selectedTarget.candidate || Boolean(selectedTarget.blockedReason)} onClick={() => props.onEquip(selectedTarget.heroId, props.view!.instanceId)}>{selectedTarget.currentItem ? "Remplacer" : "Équiper"}</Button></div>
      </>}
    </div>}
  </Panel>;
}
