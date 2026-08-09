import type { EquipmentCandidateView, EquipmentItemView } from "../../domain/heroEquipmentPresentation";
import EquipmentItemDetails from "./EquipmentItemDetails";

export default function EquipmentChangeSummary(props: {
  currentItem: EquipmentItemView | null;
  candidate: EquipmentCandidateView;
  showItems?: boolean;
}) {
  return <div className="space-y-3">
    {props.showItems !== false && <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <span className="mb-1 block text-[9px] uppercase text-[#8f7a67]">Équipement actuel</span>
        {props.currentItem ? <EquipmentItemDetails item={props.currentItem} /> : <p className="text-[10px] italic text-[#756353]">Emplacement vide</p>}
      </div>
      <div>
        <span className="mb-1 block text-[9px] uppercase text-[#8f7a67]">Après remplacement</span>
        <EquipmentItemDetails item={props.candidate.item} showDescription />
      </div>
    </div>}
    {props.candidate.displacedItems.length > 0 && <p className="text-[10px] text-orange-300">Objets restitués au Coffre : {props.candidate.displacedItems.join(", ")}</p>}
    {props.candidate.statDeltas.length > 0 ? <div className="space-y-1">{props.candidate.statDeltas.map((delta) => <div key={delta.label} className="flex items-center justify-between gap-3 text-[10px]"><span className="text-[#9f8872]">{delta.label}</span><span className={delta.value > 0 ? "text-emerald-400" : "text-red-400"}>{delta.before} → {delta.after} ({delta.value > 0 ? "+" : ""}{delta.value})</span></div>)}</div> : <p className="text-[10px] text-[#8f7a67]">Aucune statistique dérivée modifiée.</p>}
  </div>;
}
