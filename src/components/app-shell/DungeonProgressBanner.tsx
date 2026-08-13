import type { ActiveTab } from "../../domain/activeTabPreference";
import type { DungeonProgressBannerHeroView, DungeonProgressBannerView } from "../../domain/dungeonPresentation";
import emptyClassMedallion from "../../assets/images/ui/secondary-navigation-rail/dungeon-party-class-medallion-v1.png";
import classMedallionRing from "../../assets/images/ui/secondary-navigation-rail/dungeon-party-class-medallion-ring-v3.png";
import noviceClassPlaque from "../../assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-novice-v2.png";
import vitalBarFrame from "../../assets/images/ui/secondary-navigation-rail/dungeon-party-vital-bar-frame-v1.png";
import navigationButtonBackground from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-button-normal-v2.png";
import selectedNavigationButtonBackground from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-button-selected-v2.png";
import playIcon from "../../assets/images/ui/secondary-navigation-rail/dungeon-auto-play-v1.png";
import pauseIcon from "../../assets/images/ui/secondary-navigation-rail/dungeon-auto-pause-v1.png";
import Tooltip from "../../ui/components/Tooltip";

interface DungeonProgressBannerProps {
  view: DungeonProgressBannerView;
  onToggleAutoExplore: () => void;
}

export const shouldShowDungeonProgressBanner = (authenticated: boolean, _activeTab: ActiveTab) => authenticated;

function VitalBar(props: { label: string; value: number; max: number; percent: number; fillClassName: string; className?: string }) {
  return (
    <div role="progressbar" aria-label={props.label} aria-valuemin={0} aria-valuemax={props.max} aria-valuenow={props.value} className={`relative aspect-[7.75/1] w-full overflow-hidden ${props.className ?? ""}`}>
      <div className="absolute inset-[2px] overflow-hidden rounded-[2px] bg-[#120b07]">
        <div className={`h-full rounded-[2px] ${props.fillClassName}`} style={{ width: `${props.percent}%` }} />
      </div>
      <img src={vitalBarFrame} alt="" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      <span className="sr-only">{props.value}</span>
    </div>
  );
}

function PartySlots({ party }: { party: Array<DungeonProgressBannerHeroView | null> }) {
  return (
    <div data-testid="dungeon-party-slots" className="grid grid-cols-2 gap-2 lg:grid-cols-4 min-[1440px]:relative min-[1440px]:h-full min-[1440px]:grid-cols-4 min-[1440px]:items-stretch min-[1440px]:gap-1">
      {party.map((hero, index) => {
        if (!hero) return <div key={index} className="relative flex min-w-0 flex-col items-center justify-center px-1 min-[1440px]:h-full min-[1440px]:justify-start">
          <img src={emptyClassMedallion} alt="" className="aspect-square h-12 w-12 max-w-none shrink-0 object-contain min-[1440px]:absolute min-[1440px]:left-1/2 min-[1440px]:top-[15px] min-[1440px]:z-20 min-[1440px]:h-[72px] min-[1440px]:w-[72px] min-[1440px]:-translate-x-1/2" aria-hidden="true" />
        </div>;
        return (
          <div key={hero.id} className="relative flex min-w-0 flex-col items-center justify-center px-1 min-[1440px]:h-full min-[1440px]:justify-start">
            {hero.classType === "Novice" && <img src={noviceClassPlaque} alt="" className="aspect-square h-12 w-12 max-w-none shrink-0 object-contain min-[1440px]:absolute min-[1440px]:left-1/2 min-[1440px]:top-[15px] min-[1440px]:z-10 min-[1440px]:h-[72px] min-[1440px]:w-[72px] min-[1440px]:-translate-x-1/2" aria-hidden="true" />}
            <img src={classMedallionRing} alt="" className="aspect-square h-12 w-12 max-w-none shrink-0 object-contain min-[1440px]:absolute min-[1440px]:left-1/2 min-[1440px]:top-[15px] min-[1440px]:z-20 min-[1440px]:h-[72px] min-[1440px]:w-[72px] min-[1440px]:-translate-x-1/2" aria-hidden="true" />
            <Tooltip label={`Afficher ${hero.name} - Lv ${hero.level}`} content={`${hero.name} - Lv ${hero.level}`} className="mt-0.5 max-w-full min-w-0 min-[1440px]:absolute min-[1440px]:inset-x-0 min-[1440px]:top-[4px] min-[1440px]:z-10 min-[1440px]:mt-0 min-[1440px]:flex min-[1440px]:w-full min-[1440px]:-translate-x-px min-[1440px]:justify-center"><strong className="block min-w-0 truncate text-center text-[9px] leading-none text-[#dfdbc7] min-[1440px]:w-full min-[1440px]:text-[10px]">{hero.name} - Lv {hero.level}</strong></Tooltip>
            <div data-testid={`dungeon-banner-vitals-${hero.id}`} className="mt-1 grid w-full grid-cols-1 gap-0 font-mono min-[1440px]:absolute min-[1440px]:left-1 min-[1440px]:top-[82px] min-[1440px]:mt-0 min-[1440px]:w-[calc(100%-10px)]">
              <VitalBar label={`Points de vie de ${hero.name}`} value={hero.currentHp} max={hero.maxHp} percent={hero.healthPercent} fillClassName={hero.healthPercent <= 25 ? "bg-[#960011]" : "bg-[#009605]"} />
              <VitalBar label={`Mana de ${hero.name}`} value={hero.currentMana} max={hero.maxMana} percent={hero.manaPercent} fillClassName="bg-[#001e96]" className="-top-px" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DungeonProgressBanner(props: DungeonProgressBannerProps) {
  const hasActiveHeroes = props.view.party.some(Boolean);
  const actionIsPause = !hasActiveHeroes || props.view.autoExplore;
  const actionLabel = actionIsPause ? "Pause" : "Reprendre";
  const actionUnavailableReason = !hasActiveHeroes
    ? "Aucun groupe actif"
    : props.view.status === "Combat en cours" || props.view.status === "Rencontre en attente"
      ? "Action indisponible pendant une rencontre"
      : !props.view.canToggleAutoExplore
        ? "Contrôle du jeu indisponible"
        : null;

  return (
    <aside aria-label="Progression du groupe dans le donjon" className="h-full rounded-xl border border-[#5c402b] bg-[#18100a] p-3 shadow-lg xl:rounded-none xl:border-0 xl:bg-transparent xl:py-0 xl:pr-0 xl:shadow-none min-[1440px]:px-3">
      <div className="flex flex-wrap items-center justify-center gap-3 text-center md:text-left xl:h-full min-[1440px]:grid min-[1440px]:grid-cols-[128px_minmax(0,1fr)_44px] min-[1440px]:gap-1">
        <div className="min-w-[9rem] text-left leading-tight min-[1440px]:min-w-0 min-[1440px]:translate-x-[15px]">
          <strong className="block font-serif text-xs uppercase tracking-wide text-[#caa050] min-[1440px]:text-[14px]">Étage {props.view.progress.floor}</strong>
          <span className="block text-[10px] text-[#dfdbc7] min-[1440px]:text-xs">Salle {props.view.progress.room} / {props.view.progress.roomCount}</span>
          <span className="mt-1 block text-[10px] text-[#a89078] min-[1440px]:text-xs">{props.view.status}</span>
          <span className={`block text-[10px] min-[1440px]:text-xs ${props.view.autoExplore ? "text-[#a98bd4]" : "text-[#776657]"}`}>Auto-run {props.view.autoExplore ? "actif" : "arrêté"}</span>
        </div>
        <div className="hidden min-w-0 md:block min-[1440px]:h-full min-[1440px]:-translate-x-[10px]"><PartySlots party={props.view.party} /></div>
        <div className="flex w-full flex-nowrap items-center justify-center md:w-auto min-[1440px]:h-full min-[1440px]:w-11 min-[1440px]:translate-x-[48px]">
          <button
            type="button"
            aria-label={actionLabel}
            title={actionUnavailableReason ?? actionLabel}
            disabled={actionUnavailableReason !== null}
            onClick={props.onToggleAutoExplore}
            className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden text-[#e9d8ab] transition-[filter,transform] focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] active:translate-y-px disabled:cursor-not-allowed disabled:grayscale disabled:opacity-50 min-[1440px]:h-[105px] min-[1440px]:w-[124px]"
          >
            <img src={actionIsPause ? navigationButtonBackground : selectedNavigationButtonBackground} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
            <img
              src={actionIsPause ? pauseIcon : playIcon}
              alt=""
              aria-hidden="true"
              className={`relative z-10 h-7 w-7 object-contain min-[1440px]:h-[52px] min-[1440px]:w-[52px] ${actionIsPause ? "grayscale brightness-110" : ""}`}
            />
          </button>
          {hasActiveHeroes && <details className="relative shrink-0 md:hidden">
            <summary aria-label="Voir le groupe" className="flex min-h-11 cursor-pointer list-none items-center rounded-ui-control border border-ui-border px-2 text-[10px] font-bold text-ui-text-muted focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)]"><span className="sm:hidden">Groupe</span><span className="hidden sm:inline">Voir le groupe</span></summary>
            <div className="absolute right-0 top-full z-[var(--ui-layer-status)] mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-ui-panel border border-ui-border bg-ui-panel p-2 shadow-ui-panel"><PartySlots party={props.view.party} /></div>
          </details>}
        </div>
      </div>
    </aside>
  );
}
