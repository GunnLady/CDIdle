import { LogOut, User } from "lucide-react";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Tooltip from "../../ui/components/Tooltip";
import Button from "../../ui/primitives/Button";

export default function AccountIdentityPanel(props: { email: string; interactionLocked: boolean; error?: string | null; onSignOut: () => void }) {
  return <Panel title="Identité et session" subtitle="Compte actuellement lié au royaume" testId="account-identity-panel">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/20"><User className="h-5 w-5 text-emerald-400" /><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#18110b] bg-emerald-500" /></div>
        <div className="flex min-w-0 flex-col items-start"><span className="block text-[9px] font-bold uppercase tracking-widest text-ui-success-text">Compte connecté</span><Tooltip label="Afficher l’adresse du compte" content={props.email} className="mt-1 max-w-full min-w-0"><strong className="block min-w-0 truncate font-serif text-xs text-ui-text">{props.email}</strong></Tooltip></div>
      </div>
      <Button type="button" size="sm" variant="danger" onClick={props.onSignOut} disabled={props.interactionLocked} className="shrink-0"><LogOut className="h-3.5 w-3.5" />Fermer la session</Button>
    </div>
    {props.error && <Alert variant="error" live="assertive" className="mt-3">{props.error}</Alert>}
  </Panel>;
}
