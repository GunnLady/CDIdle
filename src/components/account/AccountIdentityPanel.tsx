import { LogOut, User } from "lucide-react";
import AccountPanelFrame from "./AccountPanelFrame";

export default function AccountIdentityPanel(props: { email: string; interactionLocked: boolean; error?: string | null; onSignOut: () => void }) {
  return <AccountPanelFrame title="Identité et session" subtitle="Compte actuellement lié au royaume" testId="account-identity-panel">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/20"><User className="h-5 w-5 text-emerald-400" /><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#18110b] bg-emerald-500" /></div>
        <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-widest text-emerald-400">Souverain cloud actif</span><strong className="block truncate font-serif text-xs text-[#dfdbc7]">{props.email}</strong></div>
      </div>
      <button type="button" onClick={props.onSignOut} disabled={props.interactionLocked} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-900/40 px-3 text-[10px] font-bold text-red-400 disabled:cursor-wait disabled:opacity-40"><LogOut className="h-3.5 w-3.5" />Fermer la session</button>
    </div>
    {props.error && <p role="alert" className="mt-3 rounded-lg border border-red-800/50 bg-red-950/30 p-3 text-[10px] text-red-300">{props.error}</p>}
  </AccountPanelFrame>;
}
