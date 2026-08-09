import { Lock } from "lucide-react";
import type { CityBuildingView } from "../../domain/cityPresentation";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import { formatResourceValue } from "../IconDetails";
import { CityIcon } from "./cityIcons";

export default function SelectedBuildingPanel({ building, canMutate, onUpgrade }: { building: CityBuildingView; canMutate: boolean; onUpgrade: (id: string) => void }) {
  const costs = Object.entries(building.cost).filter(([, value]) => value > 0);
  return <Panel title="Bâtiment sélectionné" testId="selected-building-panel" className="order-1 xl:col-start-1 xl:row-start-1" contentClassName="space-y-4">
    <div className="min-h-48 rounded-xl border border-dashed border-[#5c402b]/60 bg-[#100a06] flex flex-col items-center justify-center gap-3 text-center p-6">
      <div className="w-16 h-16 rounded-xl bg-[#20150d] border border-[#5a3a1a] flex items-center justify-center"><CityIcon name={building.icon} /></div>
      <div><h4 className="text-base font-bold text-[#dfdbc7] font-serif">{building.name}</h4><p className="text-[10px] text-[#8f8376] uppercase tracking-wider font-mono">{building.level === 0 ? "Non bâti" : `Niveau ${building.level}/${building.maxLevel}`}</p></div>
    </div>
    <p className="text-[11px] text-[#a89078] leading-relaxed">{building.description}</p>
    {!building.unlocked ? <Alert variant="locked" className="flex items-start gap-2 font-mono text-xs"><Lock className="h-4 w-4 shrink-0" /><span>Requis : {building.prerequisite}</span></Alert>
      : building.atMaxLevel ? <Alert variant="success" className="text-center font-serif text-xs font-extrabold uppercase tracking-wider">👑 Bâtiment au niveau maximum</Alert>
      : <div className="space-y-3"><div className="bg-black/35 p-3 rounded-lg border border-[#442c19]/30"><span className="text-[8.5px] uppercase tracking-widest text-[#8c5a2b] font-bold font-mono block mb-2">Coût {building.level === 0 ? "de construction" : "d'amélioration"} :</span><div className="flex flex-wrap gap-3 font-mono text-[10px]">{costs.map(([resource, value]) => <span key={resource} className="text-[#caa050] font-bold">{resource} {formatResourceValue(value)}</span>)}</div></div>
        <Button type="button" variant="primary" block onClick={() => onUpgrade(building.id)} disabled={!canMutate || !building.affordable}>{building.level === 0 ? "Bâtir" : "Améliorer"}</Button></div>}
  </Panel>;
}
