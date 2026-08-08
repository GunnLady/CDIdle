import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import type { ResourceRates, Resources } from "../../types";
import { CrestBadge, FoodIconDetail, GoldIconDetail, OreIconDetail, StoneIconDetail, WoodIconDetail, formatResourceValue } from "../IconDetails";

interface ResourceHeaderProps {
  cityName: string;
  authenticated: boolean;
  resources: Resources;
  rates: ResourceRates;
  accountActive: boolean;
  onOpenAccount: () => void;
}

function ResourceValue({ label, icon, value, rate, color }: { label: string; icon: ReactNode; value: number; rate?: number; color: string }) {
  return <div className="flex select-text items-center gap-2 px-1" aria-label={`${label} : ${formatResourceValue(value)}${rate === undefined ? "" : `, plus ${rate.toFixed(0)} par seconde`}`}>{icon}<div className="flex flex-col justify-center leading-none">
    <span className={`font-serif font-black text-sm sm:text-base tracking-wider drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.9)] ${color}`}>{formatResourceValue(value)}</span>
    {rate !== undefined && <span className="text-[10px] font-mono text-[#8f8376] font-semibold mt-0.5">+{rate.toFixed(0)}/s</span>}
  </div></div>;
}

export default function ResourceHeader({ cityName, authenticated, resources, rates, accountActive, onOpenAccount }: ResourceHeaderProps) {
  return <header className="relative bg-[#1d120a] border-b-[3px] border-[#5a3a1a] shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0 sticky top-0 z-40 select-none overflow-hidden py-3 px-4">
    <div className="absolute inset-x-0 top-0 h-[2px] bg-[#3a2211] opacity-60" /><div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#110904]" />
    <div data-testid="resource-header-content" className="max-w-[1440px] mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] animate-fade-in motion-reduce:animate-none">
      <div className="col-start-1 row-start-1 flex items-center gap-3"><CrestBadge /><h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wide text-[#caa050] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">{cityName || "Colonie"}</h1></div>
      {authenticated && cityName && <div className="col-span-2 row-start-2 flex flex-wrap items-center justify-center gap-2 rounded-lg border border-[#442c19]/50 bg-[#140b07]/80 p-2 shadow-inner sm:gap-4 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:justify-self-center lg:flex-nowrap">
        <ResourceValue label="Or" icon={<GoldIconDetail />} value={resources.gold} color="text-[#fbbf24]" /><div className="hidden sm:block w-px h-6 bg-[#3a2211]" />
        <ResourceValue label="Nourriture" icon={<FoodIconDetail />} value={resources.food} rate={rates.food} color="text-[#59ba59]" /><div className="hidden sm:block w-px h-6 bg-[#3a2211]" />
        <ResourceValue label="Bois" icon={<WoodIconDetail />} value={resources.wood} rate={rates.wood} color="text-[#d26d36]" /><div className="hidden sm:block w-px h-6 bg-[#3a2211]" />
        <ResourceValue label="Pierre" icon={<StoneIconDetail />} value={resources.stone} rate={rates.stone} color="text-[#cdcdcd]" /><div className="hidden sm:block w-px h-6 bg-[#3a2211]" />
        <ResourceValue label="Minerai" icon={<OreIconDetail />} value={resources.ore} rate={rates.ore} color="text-[#9653ec]" />
      </div>}
      <button
        type="button"
        aria-label="Ouvrir le compte"
        aria-current={accountActive ? "page" : undefined}
        onClick={onOpenAccount}
        className={`col-start-2 row-start-1 flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] lg:col-start-3 ${accountActive ? "border-[#d4af37] bg-[#45301f] text-[#fbf7f0]" : "border-[#5c402b] bg-[#140b07] text-[#caa050] hover:border-[#caa050] hover:text-[#fbf7f0]"}`}
      >
        <UserRound className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Compte</span>
      </button>
    </div>
  </header>;
}
