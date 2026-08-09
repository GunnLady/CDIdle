import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import AccountPanelFrame from "./AccountPanelFrame";

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
  if (!props.active) return <button type="button" onClick={props.onOpen} disabled={props.disabled} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-800/50 bg-red-950/30 px-4 text-xs font-bold text-red-300 disabled:cursor-wait disabled:opacity-40"><Trash2 className="h-4 w-4" />{props.label}</button>;
  return <div role="alertdialog" aria-modal="false" aria-labelledby={`${props.id}-confirmation-title`} className="space-y-3 rounded-xl border border-red-700/60 bg-red-950/30 p-4">
    <div className="flex items-start gap-2 text-xs leading-relaxed text-red-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><div><strong id={`${props.id}-confirmation-title`} className="block uppercase">Confirmation requise</strong>{props.warning}</div></div>
    <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { void props.onConfirm(); }} disabled={props.disabled} className="min-h-11 rounded-lg bg-red-800 px-3 text-xs font-black uppercase text-white disabled:cursor-wait disabled:opacity-40">{props.confirmLabel}</button><button type="button" onClick={props.onCancel} className="min-h-11 rounded-lg border border-[#5c402b]/60 bg-[#2c1d12] px-3 text-xs font-bold text-[#dfc3a7]">Annuler</button></div>
  </div>;
}

export default function AccountDangerZonePanel(props: { interactionLocked: boolean; blockReason?: string; onHardReset: () => Promise<void>; onDeleteAccount: () => Promise<void> }) {
  const [confirmation, setConfirmation] = useState<"reset" | "delete" | null>(null);
  const execute = async (action: () => Promise<void>) => { await action(); setConfirmation(null); };
  return <AccountPanelFrame title="Zone dangereuse" subtitle="Actions irréversibles sur le royaume et le compte" testId="account-danger-zone">
    {props.interactionLocked && props.blockReason && <p className="mb-3 rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-[10px] text-amber-300">{props.blockReason}</p>}
    <div className="grid gap-3 xl:grid-cols-2">
    <DangerAction id="reset" label="Réinitialiser totalement le Royaume (Reset)" warning="Les données locales et l’état serveur du royaume seront détruits. Le compte restera actif." confirmLabel="Oui, TOUT supprimer !" disabled={props.interactionLocked} active={confirmation === "reset"} onOpen={() => setConfirmation("reset")} onCancel={() => setConfirmation(null)} onConfirm={() => execute(props.onHardReset)} />
    <DangerAction id="delete" label="Supprimer définitivement le compte" warning="Le compte Auth, la partie, les commandes et les données associées seront supprimés sans retour." confirmLabel="Supprimer le compte" disabled={props.interactionLocked} active={confirmation === "delete"} onOpen={() => setConfirmation("delete")} onCancel={() => setConfirmation(null)} onConfirm={() => execute(props.onDeleteAccount)} />
    </div>
  </AccountPanelFrame>;
}
