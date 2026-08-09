import { UserPlus } from "lucide-react";
import type { HeroRosterEntryView } from "../../domain/heroPresentation";
import Alert from "../../ui/components/Alert";
import Card from "../../ui/components/Card";
import Panel from "../../ui/components/Panel";
import Tooltip from "../../ui/components/Tooltip";
import Button from "../../ui/primitives/Button";

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
  return <Panel title="Roster et recrutement" subtitle={`${props.roster.length}/${props.capacity} aventuriers`} testId="hero-roster-panel" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col" contentClassName="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
    <Button type="button" variant="primary" block disabled={recruitDisabled} title={recruitReason} onClick={props.onRecruitHero} className="mb-3"><UserPlus className="h-4 w-4" />Recruter · {props.recruitCost} or</Button>
    {recruitReason && <Alert variant="locked" className="mb-3 text-center text-xs">{recruitReason}</Alert>}
    {props.roster.length === 0 ? <Alert variant="info" className="text-center">Aucun aventurier recruté.</Alert> : <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1 xl:min-h-0 xl:max-h-none xl:flex-1">
      {props.roster.map((hero) => {
        const activityDisabled = !props.canMutate || (!hero.isActive && !hero.canDeploy);
        const activityUnavailableReason = !props.canMutate ? "Lecture seule" : !hero.isActive ? hero.deploymentBlockReason : undefined;
        const activityAction = <Button type="button" size="sm" variant={hero.isActive ? "secondary" : "primary"} aria-label={`${hero.isActive ? "Retirer" : "Déployer"} ${hero.name}`} disabled={activityDisabled} onClick={() => props.onToggleHeroActive(hero.id)} className="h-full min-w-16 px-2 text-xs">{hero.isActive ? "Retirer" : "Déployer"}</Button>;
        return <Card key={hero.id} selected={props.selectedHeroId === hero.id} className="flex items-stretch gap-2 p-2">
          <button type="button" data-testid={`hero-roster-${hero.id}`} aria-pressed={props.selectedHeroId === hero.id} onClick={() => props.onSelectHero(hero.id)} className="min-h-11 min-w-0 flex-1 rounded px-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
            <span className="flex items-center justify-between gap-2"><strong className="truncate font-serif text-xs text-[#e7d7bc]">{hero.name}</strong><span className="text-[9px] text-[#caa050]">Niv. {hero.level}</span></span>
            <span className="mt-1 flex items-center justify-between gap-2 text-[9px] text-[#8f7a67]"><span className="truncate">{hero.race} · {hero.className}</span><span className="shrink-0">{hero.statusLabel}</span></span>
          </button>
          {activityUnavailableReason ? <Tooltip label={`Pourquoi ${hero.name} ne peut pas être déployé`} content={activityUnavailableReason}>{activityAction}</Tooltip> : activityAction}
        </Card>;
      })}
    </div>}
  </Panel>;
}
