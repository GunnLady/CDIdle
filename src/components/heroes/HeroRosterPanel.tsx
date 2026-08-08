import { UserPlus } from "lucide-react";
import type { HeroRosterEntryView } from "../../domain/heroPresentation";
import HeroPanelFrame from "./HeroPanelFrame";

interface HeroRosterPanelProps {
  roster: HeroRosterEntryView[];
  selectedHeroId: string | null;
  capacity: number;
  recruitCost: number;
  canRecruit: boolean;
  recruitmentBlockReason?: string;
  canMutate: boolean;
  onSelectHero: (heroId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
  onRecruitHero: () => void;
}

export default function HeroRosterPanel(props: HeroRosterPanelProps) {
  const recruitDisabled = !props.canMutate || !props.canRecruit;
  const recruitReason = !props.canMutate ? "Lecture seule" : props.recruitmentBlockReason;
  return <HeroPanelFrame title="Roster et recrutement" subtitle={`${props.roster.length}/${props.capacity} aventuriers`} testId="hero-roster-panel" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col" contentClassName="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
    <button type="button" disabled={recruitDisabled} title={recruitReason} onClick={props.onRecruitHero} className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#d4af37]/60 bg-gradient-to-b from-[#caa050] to-[#9b7132] px-3 text-xs font-bold text-[#110905] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:border-[#3a281a] disabled:bg-none disabled:bg-[#19110b] disabled:text-[#756353] disabled:opacity-70"><UserPlus className="h-4 w-4" />Recruter · {props.recruitCost} or</button>
    {recruitReason && <p className="mb-3 text-center text-[10px] text-[#a89078]">{recruitReason}</p>}
    {props.roster.length === 0 ? <p className="rounded-lg border border-dashed border-[#4a321f] p-5 text-center text-xs text-[#8f7a67]">Aucun aventurier recruté.</p> : <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1 xl:min-h-0 xl:max-h-none xl:flex-1">
      {props.roster.map((hero) => {
        const activityDisabled = !props.canMutate || (!hero.isActive && !hero.canDeploy);
        return <article key={hero.id} className={`flex items-stretch gap-2 rounded-lg border p-2 ${props.selectedHeroId === hero.id ? "border-[#caa050] bg-[#2b1c11]" : "border-[#3f2b1c] bg-[#130c08]"}`}>
          <button type="button" data-testid={`hero-roster-${hero.id}`} aria-pressed={props.selectedHeroId === hero.id} onClick={() => props.onSelectHero(hero.id)} className="min-h-11 min-w-0 flex-1 rounded px-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
            <span className="flex items-center justify-between gap-2"><strong className="truncate font-serif text-xs text-[#e7d7bc]">{hero.name}</strong><span className="text-[9px] text-[#caa050]">Niv. {hero.level}</span></span>
            <span className="mt-1 flex items-center justify-between gap-2 text-[9px] text-[#8f7a67]"><span className="truncate">{hero.race} · {hero.className}</span><span className="shrink-0">{hero.statusLabel}</span></span>
          </button>
          <button type="button" aria-label={`${hero.isActive ? "Retirer" : "Déployer"} ${hero.name}`} title={hero.deploymentBlockReason} disabled={activityDisabled} onClick={() => props.onToggleHeroActive(hero.id)} className={`min-h-11 min-w-16 rounded border px-2 text-[9px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:opacity-30 ${hero.isActive ? "border-[#6e4b2b] text-[#d9b78a]" : "border-[#8b6b2f] text-[#caa050]"}`}>{hero.isActive ? "Retirer" : "Déployer"}</button>
        </article>;
      })}
    </div>}
  </HeroPanelFrame>;
}
