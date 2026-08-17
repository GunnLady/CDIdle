import { Lock } from "lucide-react";
import type { CityBuildingView } from "../../domain/cityPresentation";
import { getResourceLabel } from "../../domain/resourcePresentation";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import { formatResourceValue } from "../IconDetails";
import { buildingCardImages, buildingDetailImages } from "./buildingCardImages";
import { CityIcon } from "./cityIcons";

export default function SelectedBuildingPanel({ building, canMutate, onUpgrade }: { building: CityBuildingView; canMutate: boolean; onUpgrade: (id: string) => void }) {
  const costs = Object.entries(building.cost).filter(([, value]) => value > 0);
  const cardImage = buildingDetailImages[building.id] ?? buildingCardImages[building.id];
  return <Panel title="Bâtiment sélectionné" testId="selected-building-panel" className="order-1" contentClassName="space-y-4">
    {cardImage ? <div data-selected-building-illustration className="relative min-h-52 overflow-hidden shadow-[0_8px_18px_rgba(0,0,0,0.42)] sm:min-h-60 xl:aspect-[4/1] xl:min-h-0">
      <span className="pointer-events-none absolute inset-0 overflow-hidden bg-[#090b0f] [clip-path:polygon(16px_0,calc(100%_-_16px)_0,100%_16px,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,16px_100%,0_calc(100%_-_16px),0_16px)]">
        <img src={cardImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#111419]/15 to-[#090b0f]/90" />
      </span>
      <span className="ui-building-card-frame pointer-events-none absolute inset-0 z-20" />
      <div className="ui-building-card-copy relative z-10 ml-auto flex min-h-52 w-[48%] min-w-0 flex-col justify-center px-6 py-5 text-center sm:min-h-60 xl:min-h-0 xl:h-full">
        <h4 className="whitespace-normal break-words font-serif text-xl font-bold leading-tight text-[#f0dfbe] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{building.name}</h4>
        <p className="mt-2 font-serif text-xs font-bold text-[#e0bd58]">{building.level === 0 ? "Non bâti" : `Niveau ${building.level}/${building.maxLevel}`}</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#bca27e]">{building.categoryLabel}</p>
      </div>
    </div> : <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#5c402b]/60 bg-[#100a06] p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#5a3a1a] bg-[#20150d]"><CityIcon name={building.icon} /></div>
      <div><h4 className="font-serif text-base font-bold text-[#dfdbc7]">{building.name}</h4><p className="font-mono text-[10px] uppercase tracking-wider text-[#8f8376]">{building.level === 0 ? "Non bâti" : `Niveau ${building.level}/${building.maxLevel}`}</p></div>
    </div>}
    <div className="space-y-3">
      <div className={`flex flex-col gap-3 ${building.unlocked && !building.atMaxLevel ? "sm:flex-row sm:items-stretch" : ""}`}>
        <div className="ui-building-cost-vellum min-w-0 px-5 py-2 sm:flex-1">
          <p data-building-description className="text-[11px] leading-relaxed text-[#3f3529]">{building.description}</p>
          {building.unlocked && !building.atMaxLevel && <div className="mt-2 border-t border-[#766044]/45 pt-1.5">
            <span className="mb-1 block font-mono text-[8.5px] font-bold uppercase tracking-widest text-[#57432d]">Coût {building.level === 0 ? "de construction" : "d'amélioration"} :</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px]">{costs.map(([resource, value]) => <span key={resource} className="font-bold uppercase text-[#263b45]">{getResourceLabel(resource)} {formatResourceValue(value)}</span>)}</div>
          </div>}
        </div>
        {building.unlocked && !building.atMaxLevel && <Button type="button" variant="primary" block onClick={() => onUpgrade(building.id)} disabled={!canMutate || !building.affordable} className="ui-building-upgrade-button sm:min-h-14 sm:w-48 sm:self-end">{building.level === 0 ? "Bâtir" : "Améliorer"}</Button>}
      </div>
      {!building.unlocked ? <Alert variant="locked" className="flex items-start gap-2 font-mono text-xs"><Lock className="h-4 w-4 shrink-0" /><span>Requis : {building.prerequisite}</span></Alert>
        : building.atMaxLevel ? <Alert variant="success" className="text-center font-serif text-xs font-extrabold uppercase tracking-wider">👑 Bâtiment au niveau maximum</Alert>
        : null}
    </div>
  </Panel>;
}
