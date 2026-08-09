import { useMemo } from "react";
import type { BattleLogEntry } from "../types";
import { createSystemHistoryView } from "../domain/accountPresentation";
import ActivityLogPanel from "./ActivityLogPanel";

export default function SystemHistoryPanel({ logs, onClear }: { logs: BattleLogEntry[]; onClear: () => void }) {
  const view = useMemo(() => createSystemHistoryView(logs), [logs]);
  return <ActivityLogPanel title="Historique système" subtitle="Connexion, synchronisation et état de l’application" testId="system-history-panel" entries={view.entries} emptyMessage={view.emptyMessage} onClear={onClear} />;
}
