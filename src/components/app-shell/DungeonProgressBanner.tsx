import { Activity, Pause, Play, Shield, Swords } from "lucide-react";
import type { ActiveTab } from "../../domain/activeTabPreference";
import type { DungeonProgressBannerHeroView, DungeonProgressBannerView } from "../../domain/dungeonPresentation";
import Tooltip from "../../ui/components/Tooltip";
import Button from "../../ui/primitives/Button";

interface DungeonProgressBannerProps {
  view: DungeonProgressBannerView;
  onNavigate: (tab: ActiveTab) => void;
  onToggleAutoExplore: () => void;
}

export const shouldShowDungeonProgressBanner = (authenticated: boolean, activeTab: ActiveTab) =>
  authenticated && activeTab !== "dungeon";

function PartySlots({ party }: { party: Array<DungeonProgressBannerHeroView | null> }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 min-[1440px]:gap-1">
      {party.map((hero, index) => {
        if (!hero) return <div key={index} className="rounded border border-dashed border-[#5c402b]/50 px-2 py-1.5 text-[10px] text-[#776657] min-[1440px]:px-1 min-[1440px]:text-[9px]">Place libre</div>;
        return (
          <div key={hero.id} className="min-w-0 rounded border border-[#49301e] bg-[#120b07] px-2 py-1.5 min-[1440px]:px-1">
            <Tooltip label={`Afficher ${hero.name} - Lv ${hero.level}`} content={`${hero.name} - Lv ${hero.level}`} className="max-w-full min-w-0"><strong className="block min-w-0 truncate text-[10px] text-[#dfdbc7]">{hero.name} - Lv {hero.level}</strong></Tooltip>
            <div data-testid={`dungeon-banner-vitals-${hero.id}`} className="mt-1 grid grid-cols-1 gap-1 font-mono">
              <div role="progressbar" aria-label={`Points de vie de ${hero.name}`} aria-valuemin={0} aria-valuemax={hero.maxHp} aria-valuenow={hero.currentHp} className="relative h-4 overflow-hidden rounded bg-[#3a2118]"><div className={`absolute inset-y-0 left-0 ${hero.healthPercent <= 25 ? "bg-red-600" : "bg-emerald-600"}`} style={{ width: `${hero.healthPercent}%` }} /><span className="relative flex h-full items-center justify-center text-[8px] font-bold text-white">{hero.currentHp}</span></div>
              <div role="progressbar" aria-label={`Mana de ${hero.name}`} aria-valuemin={0} aria-valuemax={hero.maxMana} aria-valuenow={hero.currentMana} className="relative h-4 overflow-hidden rounded bg-[#17243d]"><div className="absolute inset-y-0 left-0 bg-sky-500" style={{ width: `${hero.manaPercent}%` }} /><span className="relative flex h-full items-center justify-center text-[8px] font-bold text-white">{hero.currentMana}</span></div>
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
    <aside aria-label="Progression du groupe dans le donjon" className="h-full rounded-xl border border-[#5c402b] bg-[#18100a] p-3 shadow-lg xl:rounded-none xl:border-0 xl:bg-transparent xl:py-0 xl:pr-0 xl:shadow-none min-[1440px]:px-3">
      <div className="flex flex-wrap items-center justify-center gap-3 text-center md:text-left xl:h-full min-[1440px]:flex-nowrap min-[1440px]:gap-2">
        <Swords className="h-5 w-5 text-[#caa050]" aria-hidden="true" />
        <div className="min-w-[9rem] min-[1440px]:min-w-[7.5rem]">
          <strong className="block text-xs font-serif text-[#dfdbc7]">Étage {props.view.progress.floor} · Salle {props.view.progress.room}/{props.view.progress.roomCount}</strong>
          <span className="flex items-center gap-1 text-[10px] text-[#a89078]"><Activity className="h-3 w-3" aria-hidden="true" />{props.view.status} · Auto {props.view.autoExplore ? "actif" : "arrêté"}</span>
        </div>
        <div className="hidden min-w-0 flex-1 md:block"><PartySlots party={props.view.party} /></div>
        <div className="flex w-full flex-nowrap items-center justify-center gap-2 md:w-auto min-[1440px]:gap-1">
          {!hasActiveHeroes ? (
            <Button type="button" size="sm" className="min-[1440px]:px-2 min-[1440px]:text-[10px] min-[1440px]:tracking-normal" aria-label="Préparer le groupe" onClick={() => props.onNavigate("heroes")}><span className="sm:hidden">Groupe</span><span className="hidden sm:inline">Préparer le groupe</span></Button>
          ) : props.view.canToggleAutoExplore ? (
            <Button type="button" size="sm" className="min-[1440px]:px-2 min-[1440px]:text-[10px] min-[1440px]:tracking-normal" onClick={props.onToggleAutoExplore}>
              {props.view.autoExplore ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Reprendre</>}
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="primary" className="min-[1440px]:px-2 min-[1440px]:text-[10px] min-[1440px]:tracking-normal" aria-label="Voir le Donjon" onClick={() => props.onNavigate("dungeon")}><Shield className="h-3 w-3" /><span className="sm:hidden">Donjon</span><span className="hidden sm:inline">Voir le Donjon</span></Button>
          {hasActiveHeroes && <details className="relative shrink-0 md:hidden">
            <summary aria-label="Voir le groupe" className="flex min-h-11 cursor-pointer list-none items-center rounded-ui-control border border-ui-border px-2 text-[10px] font-bold text-ui-text-muted focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)]"><span className="sm:hidden">Groupe</span><span className="hidden sm:inline">Voir le groupe</span></summary>
            <div className="absolute right-0 top-full z-[var(--ui-layer-status)] mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-ui-panel border border-ui-border bg-ui-panel p-2 shadow-ui-panel"><PartySlots party={props.view.party} /></div>
          </details>}
        </div>
      </div>
    </aside>
  );
}
