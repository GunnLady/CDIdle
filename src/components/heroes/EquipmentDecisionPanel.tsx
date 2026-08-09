import { X } from "lucide-react";
import type { EquipmentSlotView } from "../../domain/heroEquipmentPresentation";
import Alert from "../../ui/components/Alert";
import Card from "../../ui/components/Card";
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
    title={`Équiper ${props.heroName}`}
    description={`${props.slot.icon} ${props.slot.label}`}
    onDismiss={props.onClose}
    dismissOnBackdrop
    className="relative max-w-2xl overflow-hidden"
  >
    <IconButton type="button" label="Fermer la sélection d’équipement" onClick={props.onClose} className="absolute right-5 top-5"><X className="h-5 w-5" /></IconButton>
    <div className="max-h-[65vh] space-y-3 overflow-y-auto">
      {props.slot.candidates.length === 0 ? <Alert variant="info" className="text-center">Aucun objet compatible dans le Coffre.</Alert> : props.slot.candidates.map((candidate) => {
        const unavailableReason = !props.canMutate ? "Lecture seule" : candidate.levelBlocked ? `Niveau ${candidate.requiredLevel} requis` : undefined;
        const action = <Button type="button" variant="primary" block disabled={Boolean(unavailableReason)} onClick={() => props.onEquip(candidate.instanceId)} className="mt-3">{candidate.levelBlocked ? "Niveau insuffisant" : candidate.displacedItems.length > 0 ? "Remplacer" : "Équiper"}</Button>;
        return <Card key={candidate.instanceId}>
          <EquipmentChangeSummary currentItem={props.slot.item} candidate={candidate} />
          {unavailableReason ? <Tooltip label="Pourquoi cet équipement est indisponible" content={unavailableReason} className="w-full">{action}</Tooltip> : action}
        </Card>;
      })}
    </div>
  </Dialog>;
}
