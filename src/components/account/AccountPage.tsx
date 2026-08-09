import { useState } from "react";
import type { BattleLogEntry, Resources } from "../../types";
import { createRealmSummaryView } from "../../domain/accountPresentation";
import SystemHistoryPanel from "../SystemHistoryPanel";
import AccountDangerZonePanel from "./AccountDangerZonePanel";
import AccountIdentityPanel from "./AccountIdentityPanel";
import RealmSummaryPanel from "./RealmSummaryPanel";
import SyncStatusPanel from "./SyncStatusPanel";

export interface AccountPageProps {
  currentUser: { id?: string; email?: string | null };
  isSyncing: boolean;
  isCommandPending?: boolean;
  canMutate: boolean;
  canUseDangerActions: boolean;
  mutationBlockReason?: string;
  dangerActionBlockReason?: string;
  resources: Resources;
  buildings: Record<string, number>;
  totalCitizensCount: number;
  heroesCount: number;
  highestFloorReached: number;
  onSaveCloud: () => Promise<void>;
  onHardReset: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onSignOut: () => Promise<void>;
  systemLogs: BattleLogEntry[];
  onClearSystemLogs: () => void;
}

export default function AccountPage(props: AccountPageProps) {
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionInteractionLocked = props.isSyncing || Boolean(props.isCommandPending);
  const dangerInteractionLocked = sessionInteractionLocked || !props.canUseDangerActions;
  const summary = createRealmSummaryView(props);

  const closeSession = async () => {
    if (sessionInteractionLocked) return;
    setSessionError(null);
    try {
      await props.onSignOut();
    } catch (error) {
      const failure = error as { message?: string };
      setSessionError(`Impossible de fermer la session : ${failure.message ?? "erreur inconnue"}`);
    }
  };

  const history = <SystemHistoryPanel logs={props.systemLogs} onClear={props.onClearSystemLogs} />;
  return <section aria-labelledby="account-page-title" className="space-y-4 animate-fade-in motion-reduce:animate-none">
    <h2 id="account-page-title" className="sr-only">Compte</h2>
    <div data-testid="account-page-layout" className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,1fr)]">
      <div className="space-y-4"><AccountIdentityPanel email={props.currentUser.email || "Utilisateur anonyme"} interactionLocked={sessionInteractionLocked} error={sessionError} onSignOut={() => { void closeSession(); }} /><SyncStatusPanel isSyncing={props.isSyncing} isCommandPending={Boolean(props.isCommandPending)} canRefresh={props.canMutate} blockReason={props.mutationBlockReason} onSaveCloud={props.onSaveCloud} /></div>
      <RealmSummaryPanel view={summary} />
    </div>
    {history}
    <AccountDangerZonePanel interactionLocked={dangerInteractionLocked} blockReason={!props.canUseDangerActions ? props.dangerActionBlockReason : undefined} onHardReset={props.onHardReset} onDeleteAccount={props.onDeleteAccount} />
  </section>;
}
