import { UserPlus } from "lucide-react";
import type { HeroRosterEntryView } from "../../domain/heroPresentation";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Tooltip from "../../ui/components/Tooltip";
import Button from "../../ui/primitives/Button";
import HeroDetailFrame from "./HeroDetailFrame";

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
  return <Panel title="Roster et recrutement" subtitle={`${props.roster.length}/${props.capacity} aventuriers`} testId="hero-roster-panel" typography="large" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col" contentClassName="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
    <Button type="button" variant="primary" disabled={recruitDisabled} title={recruitReason} onClick={props.onRecruitHero} className="mb-3 self-start"><UserPlus className="h-4 w-4" />Recruter · {props.recruitCost} or</Button>
    {recruitReason && <Alert variant="locked" className="mb-3 text-center text-[13px]">{recruitReason}</Alert>}
    {props.roster.length === 0 ? <Alert variant="info" className="text-center">Aucun aventurier recruté.</Alert> : <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1 xl:min-h-0 xl:max-h-none xl:flex-1">
      {props.roster.map((hero) => {
        const activityDisabled = !props.canMutate || (!hero.isActive && !hero.canDeploy);
        const activityUnavailableReason = !props.canMutate ? "Lecture seule" : !hero.isActive ? hero.deploymentBlockReason : undefined;
        const selected = props.selectedHeroId === hero.id;
        const activityAction = <Button type="button" size="xs" variant={hero.isActive ? "secondary" : "primary"} aria-label={`${hero.isActive ? "Retirer" : "Déployer"} ${hero.name}`} disabled={activityDisabled} onClick={() => props.onToggleHeroActive(hero.id)}>{hero.isActive ? "Retirer" : "Déployer"}</Button>;
        return <article key={hero.id} data-selected={selected || undefined}><HeroDetailFrame compact className={selected ? "shadow-[inset_0_0_18px_rgba(202,160,80,0.18)]" : undefined}>
          <div className="flex items-center gap-2">
            <button type="button" data-testid={`hero-roster-${hero.id}`} aria-pressed={selected} onClick={() => props.onSelectHero(hero.id)} className="min-h-9 min-w-0 flex-1 rounded px-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
              <span className="flex items-center justify-between gap-3"><strong className="truncate font-serif text-[13px] text-[#e7d7bc]">{hero.name}</strong><span className="shrink-0 text-right text-xs font-bold text-[#caa050]">Niveau {hero.level}</span></span>
              <span className="mt-1 flex items-center justify-between gap-3 text-[11px]"><span className="truncate text-[#9f8872]">{hero.race} · {hero.className}</span><span className="shrink-0 text-right text-[#dfdbc7]">{hero.statusLabel}</span></span>
              <span className="mt-2 grid grid-cols-2 border-t border-[#63451f]/50 pt-2 text-[11px]"><span className="grid grid-cols-[2rem_minmax(0,1fr)] items-center pr-3 text-[#9f8872]"><span>PV</span><strong className="text-right font-mono text-xs text-emerald-400">{hero.currentHp}/{hero.maxHp}</strong></span><span className="grid grid-cols-[2rem_minmax(0,1fr)] items-center border-l border-[#63451f]/50 pl-3 text-[#9f8872]"><span>PM</span><strong className="text-right font-mono text-xs text-sky-400">{hero.currentMana}/{hero.maxMana}</strong></span></span>
            </button>
            {activityUnavailableReason ? <Tooltip label={`Pourquoi ${hero.name} ne peut pas être déployé`} content={activityUnavailableReason}>{activityAction}</Tooltip> : activityAction}
          </div>
        </HeroDetailFrame></article>;
      })}
    </div>}
  </Panel>;
}
