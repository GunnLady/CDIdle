import { Lock } from "lucide-react";
import type { CityBuildingView } from "../../domain/cityPresentation";
import { CityIcon } from "./cityIcons";

export default function BuildingListPanel({ buildings, selectedId, onSelect }: { buildings: CityBuildingView[]; selectedId: string; onSelect: (id: string) => void }) {
  return <section data-testid="building-list-panel" className="order-2 xl:col-start-2 xl:row-start-1 bg-[#18110b] border border-[#45301f] rounded-xl p-5 shadow-lg space-y-4">
    <h3 className="text-xs font-bold tracking-widest text-[#caa050] uppercase font-serif border-b border-[#3c291a] pb-3">Bâtiments</h3>
    <div data-testid="building-list-scroll" className="space-y-2 xl:max-h-[42rem] xl:overflow-y-auto xl:pr-1">
      {buildings.map((building) => <button key={building.id} type="button" data-testid={`building-${building.id}`} onClick={() => onSelect(building.id)} aria-pressed={selectedId === building.id}
        className={`min-h-11 w-full rounded-xl border-2 p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] ${selectedId === building.id ? "bg-[#2d1f14] border-[#caa050]" : building.unlocked ? "bg-[#1c120a] border-[#5a3a1a] hover:border-[#caa050]/60" : "bg-[#100a06]/40 border-[#301c0f]/50 opacity-55"}`}>
        <span className="flex items-start justify-between gap-3"><span className="flex min-w-0 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#5a3a1a]/45 bg-slate-950/40"><CityIcon name={building.icon} /></span><span className="min-w-0"><span className="block truncate text-xs font-bold text-[#dfdbc7] font-serif">{building.name}</span><span className="block text-[9px] uppercase tracking-wider text-[#8f8376] font-mono">{building.categoryLabel}</span></span></span><span className="shrink-0 text-right text-[10px] font-bold text-[#caa050] font-serif">{building.level === 0 ? "Non bâti" : `Niv. ${building.level}/${building.maxLevel}`}</span></span>
        {!building.unlocked && <span className="mt-2 flex items-center gap-1.5 text-[9px] italic text-red-400 font-mono"><Lock className="h-3 w-3" />Requis : {building.prerequisite}</span>}
      </button>)}
    </div>
  </section>;
}
