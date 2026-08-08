import { Lock } from "lucide-react";
import type { CityBuildingView } from "../../domain/cityPresentation";
import { formatResourceValue } from "../IconDetails";
import { CityIcon } from "./cityIcons";

export default function SelectedBuildingPanel({ building, canMutate, onUpgrade }: { building: CityBuildingView; canMutate: boolean; onUpgrade: (id: string) => void }) {
  const costs = Object.entries(building.cost).filter(([, value]) => value > 0);
  return <section data-testid="selected-building-panel" className="order-1 xl:col-start-1 xl:row-start-1 bg-[#18110b] border border-[#45301f] rounded-xl p-5 shadow-lg space-y-4">
    <h3 className="text-xs font-bold tracking-widest text-[#caa050] uppercase font-serif border-b border-[#3c291a] pb-3">Bâtiment sélectionné</h3>
    <div className="min-h-48 rounded-xl border border-dashed border-[#5c402b]/60 bg-[#100a06] flex flex-col items-center justify-center gap-3 text-center p-6">
      <div className="w-16 h-16 rounded-xl bg-[#20150d] border border-[#5a3a1a] flex items-center justify-center"><CityIcon name={building.icon} /></div>
      <div><h4 className="text-base font-bold text-[#dfdbc7] font-serif">{building.name}</h4><p className="text-[10px] text-[#8f8376] uppercase tracking-wider font-mono">{building.level === 0 ? "Non bâti" : `Niveau ${building.level}/${building.maxLevel}`}</p></div>
    </div>
    <p className="text-[11px] text-[#a89078] leading-relaxed">{building.description}</p>
    {!building.unlocked ? <div className="flex items-start gap-2 text-[10px] text-red-400 font-mono p-3 rounded-lg border border-red-900/50 bg-red-950/20"><Lock className="w-4 h-4 shrink-0" /><span>Requis : {building.prerequisite}</span></div>
      : building.atMaxLevel ? <div className="text-center text-[10px] text-emerald-500 font-serif uppercase tracking-wider font-extrabold py-3 border border-emerald-900/40 rounded-lg bg-emerald-950/10">👑 Bâtiment au niveau maximum</div>
      : <div className="space-y-3"><div className="bg-black/35 p-3 rounded-lg border border-[#442c19]/30"><span className="text-[8.5px] uppercase tracking-widest text-[#8c5a2b] font-bold font-mono block mb-2">Coût {building.level === 0 ? "de construction" : "d'amélioration"} :</span><div className="flex flex-wrap gap-3 font-mono text-[10px]">{costs.map(([resource, value]) => <span key={resource} className="text-[#caa050] font-bold">{resource} {formatResourceValue(value)}</span>)}</div></div>
        <button type="button" onClick={() => onUpgrade(building.id)} disabled={!canMutate || !building.affordable} className="min-h-11 w-full py-2.5 rounded-lg text-xs font-bold font-serif uppercase tracking-wider border transition bg-[#caa050] text-[#110905] border-[#ebd7a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:bg-[#18110b] disabled:border-[#302014] disabled:text-[#5c4b3f]/70 disabled:cursor-not-allowed">{building.level === 0 ? "Bâtir" : "Améliorer"}</button></div>}
  </section>;
}
