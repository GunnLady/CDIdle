import type { StorageSummaryView } from "../../domain/storagePresentation";
import StoragePanelFrame from "./StoragePanelFrame";

export default function StorageSummary({ view }: { view: StorageSummaryView }) {
  return <StoragePanelFrame title="Coffre" subtitle={`${view.itemCount} emplacement(s) occupé(s)`} testId="storage-summary">
    {!view.forgeUnlocked ? <p className="text-[10px] text-[#8f7a67]">La réserve de forge sera visible après la construction de la Forge.</p> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {view.materials.map((material) => <div key={material.id} title={material.description} className="rounded-lg border border-[#3e2b1f] bg-[#110a06] p-2"><span className="block truncate text-[9px] font-bold uppercase text-[#a89078]">{material.name}</span><strong className="mt-1 block font-mono text-sm text-[#dfdbc7]">{material.count}</strong></div>)}
    </div>}
  </StoragePanelFrame>;
}
