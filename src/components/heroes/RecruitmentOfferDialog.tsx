import type { Hero } from "../../types";
import { createRecruitmentOfferView } from "../../domain/recruitmentPresentation";
import Alert from "../../ui/components/Alert";
import Dialog from "../../ui/components/Dialog";
import Button from "../../ui/primitives/Button";
import HeroCandidateCard from "./HeroCandidateCard";

export interface RecruitmentOfferDialogProps {
  candidate: Hero;
  editedName: string;
  heroCount: number;
  pending: boolean;
  readOnly: boolean;
  blockReason?: string;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RecruitmentOfferDialog({
  candidate,
  editedName,
  heroCount,
  pending,
  readOnly,
  blockReason,
  onNameChange,
  onConfirm,
  onCancel,
}: RecruitmentOfferDialogProps) {
  const offer = createRecruitmentOfferView(candidate, heroCount, editedName);
  const commandsDisabled = pending || readOnly;
  const confirmDisabled = commandsDisabled || editedName.trim().length === 0;
  return <Dialog
    title="Nouveau Pacte de Recrutement"
    description="Ajustez le prénom de ce candidat avant de sceller le contrat d'embauche."
    onDismiss={onCancel}
    dismissDisabled={commandsDisabled}
    className="max-w-sm select-none"
    footer={<>
      <Button type="button" className="flex-1" onClick={onCancel} disabled={commandsDisabled}>Décliner l'Offre</Button>
      <Button type="button" variant="primary" className="flex-1" busy={pending} onClick={onConfirm} disabled={confirmDisabled && !pending}>
        {pending ? "CONFIRMATION…" : `SCELLER (🪙 ${offer.cost.toLocaleString("fr-FR")})`}
      </Button>
    </>}
  >
      <HeroCandidateCard candidate={offer} nameLabel="Prénom de l'aventurier" onRename={onNameChange} />
      {readOnly && blockReason && <Alert variant="locked" live="polite" className="mb-3 text-center">{blockReason}</Alert>}
  </Dialog>;
}
