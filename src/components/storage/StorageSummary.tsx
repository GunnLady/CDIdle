import type { StorageSummaryView } from "../../domain/storagePresentation";
import Alert from "../../ui/components/Alert";
import Metric from "../../ui/components/Metric";
import Panel from "../../ui/components/Panel";

export default function StorageSummary({ view }: { view: StorageSummaryView }) {
  return <Panel title="Coffre" subtitle={`${view.itemCount} emplacement(s) occupé(s)`} testId="storage-summary" className="xl:flex xl:max-h-48 xl:flex-col" contentClassName="xl:min-h-0 xl:overflow-y-auto xl:pr-1">
    {!view.forgeUnlocked ? <Alert variant="locked">La réserve de forge sera visible après la construction de la Forge.</Alert> : <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {view.materials.map((material) => <div key={material.id} title={material.description}><Metric label={material.name} value={material.count} className="h-full min-w-0" /></div>)}
      </div>
      {view.bossComponents.length > 0 && <section aria-labelledby="storage-boss-components-title" className="border-t border-ui-border-subtle pt-3">
        <h3 id="storage-boss-components-title" className="mb-2 text-xs font-semibold uppercase tracking-wider text-ui-accent">Composants de boss</h3>
        <div className="space-y-3">{view.bossComponents.map((group) => <div key={group.bossId} className="rounded-ui-control border border-ui-border-subtle bg-ui-panel p-3">
          <p className="mb-2 text-xs text-ui-text-muted">{group.bossName}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{group.materials.map((material) => <div key={material.id} title={material.description}><Metric label={material.name} value={material.count} className="h-full min-w-0" /></div>)}</div>
        </div>)}</div>
      </section>}
    </div>}
  </Panel>;
}
