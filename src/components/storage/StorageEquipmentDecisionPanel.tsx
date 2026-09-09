import HeroPortrait from "../HeroPortrait";
import EquipmentItemDetails from "../heroes/EquipmentItemDetails";
import EquipmentChangeSummary from "../heroes/EquipmentChangeSummary";
import type { StorageEquipmentDecisionView, StorageHeroChoiceView, StorageHeroItemChoiceView } from "../../domain/storagePresentation";
import Alert from "../../ui/components/Alert";
import Card from "../../ui/components/Card";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import SelectableCard from "../../ui/components/SelectableCard";
import Button from "../../ui/primitives/Button";

export default function StorageEquipmentDecisionPanel(props: {
  view: StorageEquipmentDecisionView | null;
  heroes: StorageHeroChoiceView[];
  itemChoices: StorageHeroItemChoiceView[];
  selectedHeroId: string | null;
  selectedItemInstanceId: string | null;
  canMutate: boolean;
  onSelectHero: (heroId: string) => void;
  onSelectItem: (instanceId: string) => void;
  onClearItem: () => void;
  onEquip: (heroId: string, instanceId: string) => void;
}) {
  const selectedHero = props.heroes.find((hero) => hero.heroId === props.selectedHeroId) ?? null;
  const selectedTarget = props.view?.targets.find((target) => target.heroId === props.selectedHeroId) ?? null;
  const subtitle = selectedTarget
    ? "Comparez puis confirmez l’équipement"
    : selectedHero
      ? "Choisissez un objet compatible"
      : props.view
        ? "Choisissez le héros à équiper"
        : "Commencez par un héros ou un objet";
  return <Panel title="Équipement des héros" subtitle={subtitle} testId="storage-equipment-decision" className="xl:flex xl:min-h-0 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
    <div className="space-y-4">
      <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Héros cible</h4>
      {props.heroes.length === 0 ? <EmptySlot className="min-h-32 text-center">Aucun héros recruté.</EmptySlot> : <div className="grid gap-2" data-testid="storage-hero-list">{props.heroes.map((hero) => {
        const target = props.view?.targets.find((entry) => entry.heroId === hero.heroId);
        const selected = selectedHero?.heroId === hero.heroId;
        return <SelectableCard key={hero.heroId} selected={selected} onClick={() => props.onSelectHero(hero.heroId)} className="p-2">
          <span className="flex min-h-12 items-center gap-2">
            <HeroPortrait hero={hero.portrait} size="sm" />
            <span className="min-w-0"><strong className="block truncate font-serif text-xs text-[#eadabc]">{hero.heroName}</strong><span className="block text-[9px] text-[#9f8872]">{hero.identityLabel}</span><span className="block text-[9px] text-[#caa050]">{target?.slotLabel ?? "Choisir un objet"}</span></span>
          </span>
          {selected && <span className="mt-2 block space-y-2 border-t border-[#63451f]/50 pt-2">
            <span className="block text-[8px] font-bold uppercase tracking-wider text-[#ae8650]">Caractéristiques</span>
            <span className="grid grid-cols-7 gap-1">{hero.stats.map((stat) => <span key={stat.id} title={stat.name} className="min-w-0 rounded border border-[#3e2b1f] bg-black/10 px-1 py-1 text-center"><span className="block truncate text-[8px] text-[#8f7a67]">{stat.label}</span><strong className="block font-mono text-[10px] text-[#dfdbc7]">{stat.value}</strong></span>)}</span>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-[#ae8650]">Statistiques de combat</span>
            <span className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">{hero.subStats.map((stat) => <span key={stat.id} className="flex min-w-0 justify-between gap-2 text-[9px]"><span className="truncate text-[#8f7a67]">{stat.label}</span><strong className="shrink-0 font-mono text-[#dfdbc7]">{stat.value}</strong></span>)}</span>
          </span>}
        </SelectableCard>;
      })}</div>}
      </section>
      {selectedHero && !props.view && <section data-testid="storage-hero-item-picker"><h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Objets compatibles</h4>
        {props.itemChoices.length === 0 ? <EmptySlot className="min-h-24 text-center">Aucun objet compatible dans le coffre.</EmptySlot> : <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{props.itemChoices.map((choice) => <SelectableCard key={choice.instanceId} selected={props.selectedItemInstanceId === choice.instanceId} onClick={() => props.onSelectItem(choice.instanceId)} className="p-2">
          <span className="block text-[9px] uppercase text-[#8f7a67]">{choice.slotLabel}</span><strong className="block font-serif text-xs text-[#eadabc]">{choice.item.name}</strong>{choice.blockedReason && <span className="mt-1 block text-[9px] text-red-400">{choice.blockedReason}</span>}
        </SelectableCard>)}</div>}
      </section>}
      {!selectedHero && !props.view && <EmptySlot className="min-h-24 text-center">Sélectionnez un héros ici ou un objet dans l’inventaire.</EmptySlot>}
      {!selectedHero && props.view && <EmptySlot className="min-h-24 text-center">Sélectionnez le héros à équiper.</EmptySlot>}
      {selectedTarget && <>
        <div className="grid gap-3 sm:grid-cols-2">
          <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Équipement actuel</h4><Card>{selectedTarget.currentItem ? <EquipmentItemDetails item={selectedTarget.currentItem} showDescription /> : <p className="text-[10px] italic text-[#756353]">Emplacement vide</p>}</Card></section>
          <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Équipement sélectionné</h4><Card><EquipmentItemDetails item={props.view.item} showDescription /></Card></section>
        </div>
        <section><h4 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Gains et pertes</h4><Card>{selectedTarget.candidate ? <EquipmentChangeSummary currentItem={selectedTarget.currentItem} candidate={selectedTarget.candidate} showItems={false} /> : <p className="text-[10px] text-[#8f7a67]">Comparatif indisponible pour cet emplacement.</p>}</Card></section>
        {selectedTarget.blockedReason && <Alert variant="error" live="polite">{selectedTarget.blockedReason}</Alert>}
        <div><span className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-[#ae8650]">Action</span><Button type="button" variant="primary" block disabled={!props.canMutate || !selectedTarget.candidate || Boolean(selectedTarget.blockedReason)} onClick={() => props.onEquip(selectedTarget.heroId, props.view!.instanceId)}>{selectedTarget.currentItem ? "Remplacer" : "Équiper"}</Button></div>
        <div className="flex justify-end"><Button type="button" size="sm" variant="secondary" onClick={props.onClearItem}>Choisir un autre objet</Button></div>
      </>}
    </div>
  </Panel>;
}
