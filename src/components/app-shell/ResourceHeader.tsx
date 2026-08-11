import type { ReactNode } from "react";
import type { ResourceRates, Resources } from "../../types";
import { CrestBadge, FoodIconDetail, GoldIconDetail, OreIconDetail, StoneIconDetail, WoodIconDetail, formatResourceValue } from "../IconDetails";
import accountButton from "../../assets/images/ui/account-button-v2.png";
import headerMenuCenter from "../../assets/images/ui/header-menu-bar-v2-center.png";
import headerMenuOrnamentLeft from "../../assets/images/ui/header-menu-ornament-left-v1.png";
import headerMenuOrnamentRight from "../../assets/images/ui/header-menu-ornament-right-v3.png";
import mobileHeaderPanel from "../../assets/images/ui/mobile-header-panel-v1.png";
import resourceFood from "../../assets/images/ui/resource-food-v1.png";
import resourceGold from "../../assets/images/ui/resource-gold-v1.png";
import resourceOre from "../../assets/images/ui/resource-ore-v1.png";
import resourceStone from "../../assets/images/ui/resource-stone-v1.png";
import resourceWood from "../../assets/images/ui/resource-wood-v1.png";

interface ResourceHeaderProps {
  cityName: string;
  authenticated: boolean;
  resources: Resources;
  rates: ResourceRates;
  accountActive: boolean;
  onOpenAccount: () => void;
}

function ResourceValue({ label, icon, artSrc, artClassName = "h-11 w-11", value, rate, color }: { label: string; icon: ReactNode; artSrc: string; artClassName?: string; value: number; rate?: number; color: string }) {
  return <div className="flex min-w-0 select-text items-center gap-1.5 px-1 sm:gap-2 xl:gap-1" aria-label={`${label} : ${formatResourceValue(value)}${rate === undefined ? "" : `, plus ${rate.toFixed(0)} par seconde`}`}>
    <span className="xl:hidden">{icon}</span>
    <span className="hidden h-11 w-11 shrink-0 items-center justify-center xl:flex">
      <img src={artSrc} alt="" aria-hidden="true" className={`${artClassName} object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.75)]`} />
    </span>
    <div className="flex min-w-0 flex-col justify-center leading-none">
    <span className={`font-serif text-sm font-black tracking-wider drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.9)] sm:text-base ${color}`}>{formatResourceValue(value)}</span>
    {rate !== undefined && <span className="mt-0.5 font-mono text-[9px] font-semibold text-[#b8a996] sm:text-[10px]">+{rate.toFixed(0)}/s</span>}
  </div></div>;
}

function ResourceSeparator() {
  return <span aria-hidden="true" className="-mr-1 hidden h-2 w-2 shrink-0 rotate-45 rounded-[1px] border border-[#363331] bg-[#706d68] shadow-[inset_1px_1px_1px_rgba(224,220,211,0.72),inset_-1px_-1px_1px_rgba(30,27,25,0.9),0_1px_1px_rgba(0,0,0,0.85)] xl:block" />;
}

export default function ResourceHeader({ cityName, authenticated, resources, rates, accountActive, onOpenAccount }: ResourceHeaderProps) {
  return <header className="relative z-40 shrink-0 select-none overflow-hidden">
    <div data-testid="resource-header-frame" className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-[1440px] -translate-x-1/2" aria-hidden="true">
      <img data-testid="resource-header-mobile-panel" src={mobileHeaderPanel} alt="" className="absolute inset-0 h-full w-full object-fill sm:hidden" />
      <img data-testid="resource-header-ornament-left" src={headerMenuOrnamentLeft} alt="" className="absolute inset-y-0 left-0 z-10 hidden h-full w-auto object-contain lg:block" />
      <div data-testid="resource-header-wood-rail" className="absolute inset-y-0 inset-x-0 hidden sm:block lg:left-[6.65rem] lg:right-[2.3rem]">
        <img src={headerMenuCenter} alt="" className="absolute inset-0 h-full w-full object-fill" />
      </div>
      <img data-testid="resource-header-ornament-right" src={headerMenuOrnamentRight} alt="" className="absolute right-[5px] top-[calc(50%+5px)] z-10 hidden h-[94%] w-auto -translate-y-1/2 object-contain lg:block" />
    </div>
    <div data-testid="resource-header-content" className="relative z-10 mx-auto grid min-h-[8.5rem] max-w-[1440px] animate-fade-in grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-7 py-3 motion-reduce:animate-none sm:min-h-[8rem] sm:px-5 lg:min-h-[7.25rem] lg:grid-cols-[minmax(12rem,1fr)_auto_minmax(7rem,1fr)] lg:gap-4 lg:py-4 lg:pl-[15rem] lg:pr-[7rem] xl:grid-cols-[minmax(0,1fr)_minmax(18rem,auto)]">
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3 xl:col-start-2 xl:mr-[89px] xl:justify-self-end">
        <div data-testid="resource-header-mobile-crest" className="hidden shrink-0 sm:block lg:hidden"><CrestBadge /></div>
        <div className="min-w-0">
          <h1 className="font-city relative truncate bg-[linear-gradient(180deg,#efc66f_0%,#d8a13a_52%,#b87b28_100%)] bg-clip-text text-[1.35rem] uppercase leading-none tracking-[0.025em] text-transparent drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] sm:-left-[35px] sm:top-[7px] sm:text-[1.2rem] xl:-left-[3px] xl:overflow-visible xl:text-clip xl:text-[1.65rem]">{cityName || "Colonie"}</h1>
        </div>
      </div>
      {authenticated && cityName && <div data-testid="resource-strip" className="col-span-2 row-start-2 flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 py-2 sm:gap-x-3 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:justify-self-center lg:flex-nowrap lg:px-3 xl:col-start-1 xl:-translate-x-10 xl:translate-y-[5px] xl:justify-self-start xl:gap-x-1 xl:px-0">
        <ResourceValue label="Or" icon={<GoldIconDetail />} artSrc={resourceGold} value={resources.gold} color="text-[#fbbf24]" /><ResourceSeparator />
        <ResourceValue label="Nourriture" icon={<FoodIconDetail />} artSrc={resourceFood} artClassName="h-10 w-10" value={resources.food} rate={rates.food} color="text-[#59ba59]" /><ResourceSeparator />
        <ResourceValue label="Bois" icon={<WoodIconDetail />} artSrc={resourceWood} artClassName="h-10 w-10" value={resources.wood} rate={rates.wood} color="text-[#d26d36]" /><ResourceSeparator />
        <ResourceValue label="Pierre" icon={<StoneIconDetail />} artSrc={resourceStone} artClassName="h-10 w-10" value={resources.stone} rate={rates.stone} color="text-[#cdcdcd]" /><ResourceSeparator />
        <ResourceValue label="Minerai" icon={<OreIconDetail />} artSrc={resourceOre} value={resources.ore} rate={rates.ore} color="text-[#9653ec]" />
      </div>}
      <button
        type="button"
        aria-label="Ouvrir le compte"
        aria-current={accountActive ? "page" : undefined}
        onClick={onOpenAccount}
        className={`group col-start-2 row-start-1 flex h-11 w-11 items-center justify-center justify-self-end bg-transparent p-0 transition-[filter,opacity] duration-200 hover:[filter:brightness(1.08)_drop-shadow(0_0_2px_rgba(255,169,32,1))_drop-shadow(0_0_5px_rgba(247,201,67,0.95))_drop-shadow(0_0_10px_rgba(45,126,65,0.58))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7bd5a] active:opacity-85 lg:relative lg:top-[5px] lg:col-start-3 lg:h-[41px] lg:w-[41px] lg:-translate-x-10 xl:col-start-2 ${accountActive ? "drop-shadow-[0_0_4px_rgba(231,189,90,0.75)]" : "drop-shadow-[0_2px_2px_rgba(0,0,0,0.75)]"}`}
      >
        <img src={accountButton} alt="" aria-hidden="true" className="h-full w-full object-contain" />
      </button>
    </div>
  </header>;
}
