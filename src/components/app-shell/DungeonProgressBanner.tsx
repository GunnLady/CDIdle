import { Activity, Pause, Play, Shield, Swords } from "lucide-react";
import type { ActiveTab } from "../../domain/activeTabPreference";
import type { DungeonProgressBannerHeroView, DungeonProgressBannerView } from "../../domain/dungeonPresentation";

interface DungeonProgressBannerProps {
  view: DungeonProgressBannerView;
  onNavigate: (tab: ActiveTab) => void;
  onToggleAutoExplore: () => void;
}

export const shouldShowDungeonProgressBanner = (authenticated: boolean, activeTab: ActiveTab) =>
  authenticated && activeTab !== "dungeon";

function PartySlots({ party }: { party: Array<DungeonProgressBannerHeroView | null> }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {party.map((hero, index) => {
        if (!hero) return <div key={index} className="rounded border border-dashed border-[#5c402b]/50 px-2 py-1.5 text-[10px] text-[#776657]">Place libre</div>;
        return (
          <div key={hero.id} className="min-w-0 rounded border border-[#49301e] bg-[#120b07] px-2 py-1.5">
            <strong className="block truncate text-[10px] text-[#dfdbc7]">{hero.name}</strong>
            <div className="mt-0.5 flex justify-between gap-1 text-[8px] font-mono">
              <span className={hero.currentHp > 0 ? "text-emerald-400" : "text-red-400"}>PV {hero.currentHp}/{hero.maxHp}</span>
              <span className="text-sky-400">PM {hero.currentMana}/{hero.maxMana}</span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1" aria-hidden="true">
              <div className="h-1 overflow-hidden rounded bg-[#3a2118]"><div className="h-full bg-emerald-600" style={{ width: `${hero.healthPercent}%` }} /></div>
              <div className="h-1 overflow-hidden rounded bg-[#17243d]"><div className="h-full bg-sky-500" style={{ width: `${hero.manaPercent}%` }} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DungeonProgressBanner(props: DungeonProgressBannerProps) {
  const hasActiveHeroes = props.view.party.some(Boolean);

  return (
    <aside aria-label="Progression du groupe dans le donjon" className="h-full rounded-xl border border-[#5c402b] bg-[#18100a] p-3 shadow-lg xl:rounded-none xl:border-0 xl:bg-transparent xl:py-0 xl:pr-0 xl:shadow-none">
      <div className="flex flex-wrap items-center gap-3">
        <Swords className="h-5 w-5 text-[#caa050]" aria-hidden="true" />
        <div className="min-w-[9rem]">
          <strong className="block text-xs font-serif text-[#dfdbc7]">Étage {props.view.progress.floor} · Salle {props.view.progress.room}/{props.view.progress.roomCount}</strong>
          <span className="flex items-center gap-1 text-[10px] text-[#a89078]"><Activity className="h-3 w-3" aria-hidden="true" />{props.view.status} · Auto {props.view.autoExplore ? "actif" : "arrêté"}</span>
        </div>
        <div className="hidden min-w-0 flex-1 md:block"><PartySlots party={props.view.party} /></div>
        <div className="ml-auto flex gap-2">
          {!hasActiveHeroes ? (
            <button type="button" onClick={() => props.onNavigate("heroes")} className="min-h-11 rounded-lg border border-[#6e4b2b] px-3 py-2 text-xs font-bold text-[#caa050] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">Préparer le groupe</button>
          ) : props.view.canToggleAutoExplore ? (
            <button type="button" onClick={props.onToggleAutoExplore} className="min-h-11 rounded-lg border border-[#6e4b2b] px-3 py-2 text-xs text-[#dfdbc7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
              {props.view.autoExplore ? <><Pause className="mr-1 inline h-3 w-3" />Pause</> : <><Play className="mr-1 inline h-3 w-3" />Reprendre</>}
            </button>
          ) : null}
          <button type="button" onClick={() => props.onNavigate("dungeon")} className="min-h-11 rounded-lg bg-[#8c5a2b] px-3 py-2 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]"><Shield className="mr-1 inline h-3 w-3" />Voir le Donjon</button>
        </div>
      </div>
      <details className="mt-2 md:hidden"><summary className="flex min-h-11 cursor-pointer items-center rounded text-[10px] text-[#a89078] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">Voir le groupe</summary><div className="mt-2"><PartySlots party={props.view.party} /></div></details>
    </aside>
  );
}
