import type { EquipmentCandidateView, EquipmentItemView } from "../../domain/heroEquipmentPresentation";
import Alert from "../../ui/components/Alert";
import EquipmentItemDetails from "./EquipmentItemDetails";
import HeroDetailFrame from "./HeroDetailFrame";

export default function EquipmentChangeSummary(props: {
  currentItem: EquipmentItemView | null;
  candidate: EquipmentCandidateView;
  showItems?: boolean;
}) {
  return <div className="space-y-4">
    {props.showItems !== false && <div className="grid gap-4 sm:grid-cols-2">
      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#ae8650]">Actuellement équipé</h3>
        <HeroDetailFrame compact>{props.currentItem ? <EquipmentItemDetails item={props.currentItem} /> : <p className="text-[11px] italic text-[#756353]">Emplacement vide</p>}</HeroDetailFrame>
      </section>
      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#ae8650]">Nouvel équipement</h3>
        <HeroDetailFrame compact><EquipmentItemDetails item={props.candidate.item} showDescription levelBlocked={props.candidate.levelBlocked} /></HeroDetailFrame>
      </section>
    </div>}
    {props.candidate.displacedItems.length > 0 && <Alert variant="warning" title="Retour au Coffre">{props.candidate.displacedItems.join(", ")}</Alert>}
    <section>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#ae8650]">Impact sur les statistiques</h3>
      <HeroDetailFrame compact>{props.candidate.statDeltas.length > 0 ? <dl className="grid gap-2">{props.candidate.statDeltas.map((delta) => <div key={delta.label} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-[11px]"><dt className="text-[#9f8872]">{delta.label}</dt><dd className="font-mono text-[#dfdbc7]">{delta.before} → {delta.after}</dd><dd className={`min-w-12 text-right font-mono text-xs font-bold ${delta.value > 0 ? "text-emerald-400" : "text-red-400"}`}>{delta.value > 0 ? "+" : ""}{delta.value}</dd></div>)}</dl> : <p className="text-[11px] text-[#8f7a67]">Aucune statistique modifiée.</p>}</HeroDetailFrame>
    </section>
  </div>;
}
