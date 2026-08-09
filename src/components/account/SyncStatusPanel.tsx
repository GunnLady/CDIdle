import { Database, RefreshCw } from "lucide-react";
import AccountPanelFrame from "./AccountPanelFrame";

export default function SyncStatusPanel(props: { isSyncing: boolean; isCommandPending: boolean; canRefresh: boolean; blockReason?: string; onRefreshServerState: () => Promise<void> }) {
  const interactionLocked = props.isSyncing || props.isCommandPending || !props.canRefresh;
  const busy = props.isSyncing || props.isCommandPending;
  const status = props.isSyncing ? "Synchronisation avec le serveur en cours." : props.isCommandPending ? "Une commande canonique est en attente." : !props.canRefresh ? props.blockReason ?? "Synchronisation momentanément indisponible." : "Le royaume peut être actualisé depuis son état serveur confirmé.";
  return <AccountPanelFrame title="Synchronisation" subtitle="État canonique du royaume" testId="account-sync-panel">
    <p className="mb-4 text-[11px] text-[#a89078]" aria-live="polite">{status}</p>
    <button type="button" onClick={() => { void props.onRefreshServerState(); }} disabled={interactionLocked} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ebd7a0]/40 bg-gradient-to-b from-[#caa050] to-[#ab813a] px-4 font-serif text-xs font-black uppercase tracking-widest text-[#110905] disabled:cursor-wait disabled:opacity-40">{busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Database className="h-4 w-4" />}{busy ? "Actualisation serveur..." : !props.canRefresh ? "Synchronisation indisponible" : "Actualiser l’état serveur"}</button>
  </AccountPanelFrame>;
}
