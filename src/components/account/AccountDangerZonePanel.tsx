import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";

interface DangerActionProps {
  id: "reset" | "delete";
  label: string;
  warning: string;
  confirmLabel: string;
  disabled: boolean;
  active: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

function DangerAction(props: DangerActionProps) {
  if (!props.active) return <Button type="button" variant="danger" block onClick={props.onOpen} disabled={props.disabled}><Trash2 className="h-4 w-4" />{props.label}</Button>;
  return <Alert role="alertdialog" variant="error" aria-modal="false" aria-labelledby={`${props.id}-confirmation-title`} className="space-y-3">
    <div className="flex items-start gap-2 text-xs leading-relaxed text-red-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><div><strong id={`${props.id}-confirmation-title`} className="block uppercase">Confirmation requise</strong>{props.warning}</div></div>
    <div className="grid gap-2 sm:grid-cols-2"><Button type="button" variant="danger" block onClick={() => { void props.onConfirm(); }} disabled={props.disabled}>{props.confirmLabel}</Button><Button type="button" block onClick={props.onCancel}>Annuler</Button></div>
  </Alert>;
}

export default function AccountDangerZonePanel(props: { interactionLocked: boolean; blockReason?: string; onHardReset: () => Promise<void>; onDeleteAccount: () => Promise<void> }) {
  const [confirmation, setConfirmation] = useState<"reset" | "delete" | null>(null);
  const execute = async (action: () => Promise<void>) => { await action(); setConfirmation(null); };
  return <Panel title="Zone dangereuse" subtitle="Actions irréversibles sur le royaume et le compte" testId="account-danger-zone">
    {props.interactionLocked && props.blockReason && <Alert variant="locked" className="mb-3">{props.blockReason}</Alert>}
    <div className="grid gap-3 xl:grid-cols-2">
    <DangerAction id="reset" label="Réinitialiser totalement le Royaume (Reset)" warning="Les données locales et l’état serveur du royaume seront détruits. Le compte restera actif." confirmLabel="Oui, TOUT supprimer !" disabled={props.interactionLocked} active={confirmation === "reset"} onOpen={() => setConfirmation("reset")} onCancel={() => setConfirmation(null)} onConfirm={() => execute(props.onHardReset)} />
    <DangerAction id="delete" label="Supprimer définitivement le compte" warning="Le compte Auth, la partie, les commandes et les données associées seront supprimés sans retour." confirmLabel="Supprimer le compte" disabled={props.interactionLocked} active={confirmation === "delete"} onOpen={() => setConfirmation("delete")} onCancel={() => setConfirmation(null)} onConfirm={() => execute(props.onDeleteAccount)} />
    </div>
  </Panel>;
}
