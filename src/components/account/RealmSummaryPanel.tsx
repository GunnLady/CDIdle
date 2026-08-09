import type { RealmSummaryView } from "../../domain/accountPresentation";
import Metric from "../../ui/components/Metric";
import Panel from "../../ui/components/Panel";
import { formatResourceValue } from "../IconDetails";

export default function RealmSummaryPanel({ view }: { view: RealmSummaryView }) {
  return <Panel title="Résumé du royaume" subtitle="Population, progression et réserves" testId="realm-summary-panel" className="xl:h-full">
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">{view.metrics.map((metric) => <div key={metric.id}><Metric label={metric.label} value={metric.value} className="h-full" /></div>)}</div>
    <div className="grid grid-cols-2 gap-2 border-t border-ui-border-subtle pt-4 sm:grid-cols-5">{view.resources.map((resource) => <div key={resource.id}><Metric label={resource.label} value={formatResourceValue(resource.value)} className="h-full p-2" /></div>)}</div>
  </Panel>;
}
