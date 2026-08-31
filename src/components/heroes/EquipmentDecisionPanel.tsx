import { X } from "lucide-react";
import type { EquipmentSlotView } from "../../domain/heroEquipmentPresentation";
import Alert from "../../ui/components/Alert";
import Dialog from "../../ui/components/Dialog";
import Tooltip from "../../ui/components/Tooltip";
import Button from "../../ui/primitives/Button";
import IconButton from "../../ui/primitives/IconButton";
import EquipmentChangeSummary from "./EquipmentChangeSummary";

export default function EquipmentDecisionPanel(props: {
  heroName: string;
  slot: EquipmentSlotView;
  canMutate: boolean;
  onEquip: (instanceId: string) => void;
  onClose: () => void;
}) {
  return <Dialog
    title={`${props.slot.item ? "Changer" : "Équiper"} l’équipement de ${props.heroName}`}
    description={`Emplacement : ${props.slot.icon} ${props.slot.label} · ${props.slot.candidates.length} option${props.slot.candidates.length > 1 ? "s" : ""} compatible${props.slot.candidates.length > 1 ? "s" : ""}`}
    onDismiss={props.onClose}
    dismissOnBackdrop
    className="ui-hero-equipment-dialog relative max-w-3xl overflow-hidden"
  >
    <IconButton type="button" size="xs" label="Fermer la sélection d’équipement" onClick={props.onClose} className="absolute right-4 top-4"><X className="h-4 w-4" /></IconButton>
    <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
      {props.slot.candidates.length === 0 ? <Alert variant="info" className="text-center">Aucun objet compatible dans le Coffre.</Alert> : props.slot.candidates.map((candidate, index) => {
        const unavailableReason = !props.canMutate ? "Lecture seule" : candidate.levelBlocked ? `Niveau ${candidate.requiredLevel} requis` : undefined;
        const action = <Button type="button" size="sm" variant="primary" disabled={Boolean(unavailableReason)} onClick={() => props.onEquip(candidate.instanceId)}>{candidate.levelBlocked ? "Niveau insuffisant" : candidate.displacedItems.length > 0 ? "Remplacer" : "Équiper"}</Button>;
        return <article key={candidate.instanceId} className="border-b border-[#63451f]/60 pb-5 last:border-0 last:pb-0">
          <header className="mb-3"><h3 className="font-serif text-[15px] font-bold text-[#eadabc]">Option {index + 1} · {candidate.item.name}</h3></header>
          <EquipmentChangeSummary currentItem={props.slot.item} candidate={candidate} />
          <div className="mt-4 flex justify-end">{unavailableReason ? <Tooltip label="Pourquoi cet équipement est indisponible" content={unavailableReason}>{action}</Tooltip> : action}</div>
        </article>;
      })}
    </div>
  </Dialog>;
}
