import type { StorageSummaryView } from "../../domain/storagePresentation";
import Alert from "../../ui/components/Alert";
import Metric from "../../ui/components/Metric";
import Panel from "../../ui/components/Panel";

export default function StorageSummary({ view }: { view: StorageSummaryView }) {
  return <Panel title="Coffre" subtitle={`${view.itemCount} emplacement(s) occupé(s)`} testId="storage-summary">
    {!view.forgeUnlocked ? <Alert variant="locked">La réserve de forge sera visible après la construction de la Forge.</Alert> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {view.materials.map((material) => <div key={material.id} title={material.description}><Metric label={material.name} value={material.count} className="h-full min-w-0" /></div>)}
    </div>}
  </Panel>;
}
