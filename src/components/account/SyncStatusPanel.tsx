import { Database, RefreshCw } from "lucide-react";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";

export default function SyncStatusPanel(props: { isSyncing: boolean; isCommandPending: boolean; canRefresh: boolean; blockReason?: string; onRefreshServerState: () => Promise<void> }) {
  const interactionLocked = props.isSyncing || props.isCommandPending || !props.canRefresh;
  const busy = props.isSyncing || props.isCommandPending;
  const status = props.isSyncing ? "Synchronisation avec le serveur en cours." : props.isCommandPending ? "Une commande canonique est en attente." : !props.canRefresh ? props.blockReason ?? "Synchronisation momentanément indisponible." : "Le royaume peut être actualisé depuis son état serveur confirmé.";
  return <Panel title="Synchronisation" subtitle="État canonique du royaume" testId="account-sync-panel">
    <Alert variant={!props.canRefresh ? "locked" : "info"} live="polite" className="mb-4">{status}</Alert>
    <Button type="button" variant="primary" block busy={busy} onClick={() => { void props.onRefreshServerState(); }} disabled={interactionLocked && !busy} className="uppercase tracking-widest">{busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Database className="h-4 w-4" />}{busy ? "Actualisation serveur..." : !props.canRefresh ? "Synchronisation indisponible" : "Actualiser l’état serveur"}</Button>
  </Panel>;
}
