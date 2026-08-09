import type { RealmSummaryView } from "../../domain/accountPresentation";
import { formatResourceValue } from "../IconDetails";
import AccountPanelFrame from "./AccountPanelFrame";

export default function RealmSummaryPanel({ view }: { view: RealmSummaryView }) {
  return <AccountPanelFrame title="Résumé du royaume" subtitle="Population, progression et réserves" testId="realm-summary-panel" className="xl:h-full">
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">{view.metrics.map((metric) => <div key={metric.id} className="rounded-lg border border-[#3a2211]/60 bg-[#110a06] p-3"><span className="block text-[9px] uppercase text-[#8f8376]">{metric.label}</span><strong className="mt-1 block font-serif text-base text-[#dfdbc7]">{metric.value}</strong></div>)}</div>
    <div className="grid grid-cols-2 gap-2 border-t border-[#3c291a] pt-4 sm:grid-cols-5">{view.resources.map((resource) => <div key={resource.id} className="rounded-lg border border-[#3a2211]/50 bg-[#150d08]/80 p-2"><span className="block text-[9px] text-[#8f8376]">{resource.label}</span><strong className="mt-1 block font-mono text-xs text-[#dfdbc7]">{formatResourceValue(resource.value)}</strong></div>)}</div>
  </AccountPanelFrame>;
}
