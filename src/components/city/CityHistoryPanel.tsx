import type { CityHistoryView } from "../../domain/cityPresentation";
import ActivityLogPanel from "../ActivityLogPanel";

export default function CityHistoryPanel({ view, onClear }: { view: CityHistoryView; onClear?: () => void }) {
  return <ActivityLogPanel title="Historique de la cité" subtitle="Production, constructions et gestion de la colonie" testId="city-history-panel" entries={view.entries} emptyMessage={view.emptyMessage} onClear={onClear} />;
}
