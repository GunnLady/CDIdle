import { Lock } from "lucide-react";
import type { CityBuildingView } from "../../domain/cityPresentation";
import habitationCardImage from "../../assets/images/ui/buildings/building-card-habitation-v1.jpg";
import farmCardImage from "../../assets/images/ui/buildings/building-card-ferme-v1.jpg";
import woodcutterCardImage from "../../assets/images/ui/buildings/building-card-scierie-v1.jpg";
import quarryCardImage from "../../assets/images/ui/buildings/building-card-carriere-v1.jpg";
import mineCardImage from "../../assets/images/ui/buildings/building-card-mine-v1.jpg";
import chiefHouseCardImage from "../../assets/images/ui/buildings/building-card-maison-chef-v1.jpg";
import campCardImage from "../../assets/images/ui/buildings/building-card-guilde-v1.jpg";
import churchCardImage from "../../assets/images/ui/buildings/building-card-temple-v1.jpg";
import barracksCardImage from "../../assets/images/ui/buildings/building-card-caserne-v1.jpg";
import huntingPostCardImage from "../../assets/images/ui/buildings/building-card-poste-chasse-v1.jpg";
import arcaneWorkshopCardImage from "../../assets/images/ui/buildings/building-card-academie-v1.jpg";
import druidCircleCardImage from "../../assets/images/ui/buildings/building-card-cercle-v1.jpg";
import hideoutCardImage from "../../assets/images/ui/buildings/building-card-lair-v1.jpg";
import forgeCardImage from "../../assets/images/ui/buildings/building-card-forge-v1.jpg";
import Panel from "../../ui/components/Panel";
import { CityIcon } from "./cityIcons";

const buildingCardImages: Partial<Record<CityBuildingView["id"], string>> = {
  habitation: habitationCardImage,
  ferme: farmCardImage,
  scierie: woodcutterCardImage,
  carriere: quarryCardImage,
  mine: mineCardImage,
  maison_chef: chiefHouseCardImage,
  guilde: campCardImage,
  temple: churchCardImage,
  caserne: barracksCardImage,
  poste_chasse: huntingPostCardImage,
  academie: arcaneWorkshopCardImage,
  cercle: druidCircleCardImage,
  lair: hideoutCardImage,
  forge: forgeCardImage,
};

export default function BuildingListPanel({ buildings, selectedId, onSelect }: { buildings: CityBuildingView[]; selectedId: string; onSelect: (id: string) => void }) {
  return <Panel title="Bâtiments" testId="building-list-panel" className="order-2 xl:col-start-2 xl:row-start-1">
    <div data-testid="building-list-scroll" className="space-y-2 xl:max-h-[42rem] xl:overflow-y-auto xl:pr-1">
      {buildings.map((building) => {
        const cardImage = buildingCardImages[building.id];
        const state = selectedId === building.id ? "selected" : building.unlocked ? "available" : "locked";

        if (cardImage) return <button key={building.id} type="button" data-testid={`building-${building.id}`} data-building-state={state} onClick={() => onSelect(building.id)} aria-pressed={selectedId === building.id}
          className={`group relative h-[156px] w-full overflow-hidden bg-transparent text-left shadow-[0_8px_18px_rgba(0,0,0,0.42)] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d58d] ${state === "selected" ? "brightness-110" : state === "locked" ? "grayscale opacity-55" : "hover:-translate-y-px"}`}>
          <span className="pointer-events-none absolute inset-0 overflow-hidden [clip-path:polygon(16px_0,calc(100%_-_16px)_0,100%_16px,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,16px_100%,0_calc(100%_-_16px),0_16px)]">
            <img src={cardImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#111419]/20 to-[#090b0f]/80" />
            <span className="absolute inset-0 bg-[#d7ad68]/0 transition-colors duration-150 group-hover:bg-[#d7ad68]/[0.06]" />
          </span>
          <span className="ui-building-card-frame pointer-events-none absolute inset-0 z-20" />
          <span className="relative z-10 ml-auto flex h-full w-[54%] min-w-0 flex-col justify-center px-4 py-4">
            <span className="flex items-start justify-between gap-2"><span className="min-w-0"><span className="block truncate font-serif text-sm font-bold text-[#f0dfbe] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{building.name}</span><span className="block font-mono text-[8px] uppercase tracking-wider text-[#bca27e]">{building.categoryLabel}</span></span><span className="shrink-0 font-serif text-[9px] font-bold text-[#e0bd58]">{building.level === 0 ? "Non bâti" : `Niv. ${building.level}/${building.maxLevel}`}</span></span>
            <span className="mt-3 line-clamp-3 text-[10px] leading-relaxed text-[#c8b9a4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{building.description}</span>
            {!building.unlocked && <span className="mt-2 flex items-center gap-1.5 font-mono text-[9px] italic text-red-300"><Lock className="h-3 w-3" />Requis : {building.prerequisite}</span>}
          </span>
        </button>;

        return <button key={building.id} type="button" data-testid={`building-${building.id}`} data-building-state={state} onClick={() => onSelect(building.id)} aria-pressed={selectedId === building.id}
          className={`min-h-[88px] w-full rounded-xl border-2 p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] ${state === "selected" ? "bg-[#2d1f14] border-[#caa050]" : state === "available" ? "bg-[#1c120a] border-[#5a3a1a] hover:border-[#caa050]/60" : "bg-[#100a06]/40 border-[#301c0f]/50 opacity-55"}`}>
          <span className="flex items-start justify-between gap-3"><span className="flex min-w-0 items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#5a3a1a]/45 bg-slate-950/40"><CityIcon name={building.icon} className="h-6 w-6 text-[#caa050]" /></span><span className="min-w-0"><span className="block truncate font-serif text-sm font-bold text-[#dfdbc7]">{building.name}</span><span className="block font-mono text-[9px] uppercase tracking-wider text-[#8f8376]">{building.categoryLabel}</span><span className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#a39383]">{building.description}</span></span></span><span className="shrink-0 pt-0.5 text-right font-serif text-[10px] font-bold text-[#caa050]">{building.level === 0 ? "Non bâti" : `Niv. ${building.level}/${building.maxLevel}`}</span></span>
          {!building.unlocked && <span className="mt-2 flex items-center gap-1.5 font-mono text-[9px] italic text-red-400"><Lock className="h-3 w-3" />Requis : {building.prerequisite}</span>}
        </button>;
      })}
    </div>
  </Panel>;
}
