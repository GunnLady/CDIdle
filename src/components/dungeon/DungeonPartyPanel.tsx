import type { DungeonPartyHeroView } from "../../domain/dungeonPresentation";
import Card from "../../ui/components/Card";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import Tooltip from "../../ui/components/Tooltip";
import Button from "../../ui/primitives/Button";

function HeroVitals({ hero }: { hero: DungeonPartyHeroView }) {
  return <>
    <div className="mt-2 flex justify-between text-[9px] text-emerald-400"><span>PV</span><span>{hero.currentHp}/{hero.maxHp}</span></div>
    <div className="mt-1 h-1 overflow-hidden rounded bg-[#3a2118]"><span className="block h-full bg-emerald-600" style={{ width: `${hero.healthPercent}%` }} /></div>
    <div className="mt-2 flex justify-between text-[9px] text-sky-400"><span>PM</span><span>{hero.currentMana}/{hero.maxMana}</span></div>
    <div className="mt-1 h-1 overflow-hidden rounded bg-[#3a2118]"><span className="block h-full bg-sky-600" style={{ width: `${hero.manaPercent}%` }} /></div>
    <div className="mt-2 flex justify-between text-[8px] text-amber-400"><span>XP</span><span>{hero.xp}/{hero.xpNeeded}</span></div>
    <div className="mt-1 h-1 overflow-hidden rounded bg-[#3a2118]"><span className="block h-full bg-amber-500" style={{ width: `${hero.xpPercent}%` }} /></div>
  </>;
}

export default function DungeonPartyPanel(props: {
  party: Array<DungeonPartyHeroView | null>;
  reserves: DungeonPartyHeroView[];
  selectedHeroId: string | null;
  canMutate: boolean;
  onSelectHero: (heroId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
}) {
  return <Panel title="Gestion du groupe" subtitle={`${props.party.filter(Boolean).length}/${props.party.length} héros engagés`} testId="dungeon-party-roster" variant="strong" className="h-full w-full" contentTestId="dungeon-party-scroll">
    <div className="grid grid-cols-2 gap-2">
      {props.party.map((hero, index) => hero ? <Card data-testid="dungeon-party-slot" key={hero.id} selected={props.selectedHeroId === hero.id} className="flex h-[18rem] flex-col p-2">
        <button type="button" aria-pressed={props.selectedHeroId === hero.id} onClick={() => props.onSelectHero(hero.id)} className="min-h-11 w-full flex-1 text-left focus-visible:outline-2 focus-visible:outline-[#caa050]"><span className="flex items-center justify-between gap-1"><strong className="block truncate font-serif text-[10px] text-[#f0dfbe]">{hero.name}</strong><span className="shrink-0 text-[8px] text-[#caa050]">Niv. {hero.level}</span></span><span className="block truncate text-[8px] text-[#9f8872]">{hero.race} · {hero.className}</span><HeroVitals hero={hero} /><span className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-[#9f8872]"><span title="Puissance garantie de l'attaque normale avant le jet de l'arme">ATK <strong className="text-[#dfdbc7]">{hero.attackPower}</strong></span><span title="Défense physique">DEF <strong className="text-[#dfdbc7]">{hero.physicalDefense}</strong></span><span title="DPS estimé de l'attaque normale par cycle, avant défense et résistances">DPS <strong className="text-[#dfdbc7]">{hero.estimatedDps}</strong></span><span title="Vitesse">VIT <strong className="text-[#dfdbc7]">{hero.speed}</strong></span><span title="Taux de coups critiques">CRT <strong className="text-[#dfdbc7]">{hero.criticalChance}%</strong></span><span title="Esquive">ESQ <strong className="text-[#dfdbc7]">{hero.dodgeChance}%</strong></span></span></button>
        <Button type="button" size="sm" variant="danger" block aria-label={`Retirer ${hero.name}`} disabled={!props.canMutate} onClick={() => props.onToggleHeroActive(hero.id)} className="mt-2">Retirer</Button>
      </Card> : <EmptySlot data-testid="dungeon-party-slot" key={index} className="h-[18rem] text-[9px]">Place libre</EmptySlot>)}
    </div>

    <div className="mt-4 border-t border-[#5c402b]/30 pt-3">
      <h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Liste des héros</h4>
      {props.reserves.length === 0 ? <EmptySlot className="text-[10px]">Aucun héros en réserve.</EmptySlot> : <div data-testid="dungeon-reserves-list" className="space-y-2">{props.reserves.map((hero) => {
        const unavailableReason = !props.canMutate ? "Lecture seule" : hero.deploymentBlockReason;
        const deployAction = <Button type="button" size="sm" variant="primary" aria-label={`Déployer ${hero.name}`} disabled={!props.canMutate || !hero.canDeploy} onClick={() => props.onToggleHeroActive(hero.id)} className="h-full">Déployer</Button>;
        return <Card key={hero.id} selected={props.selectedHeroId === hero.id} className="flex items-stretch gap-2 p-2">
        <button type="button" aria-pressed={props.selectedHeroId === hero.id} onClick={() => props.onSelectHero(hero.id)} className="min-h-11 min-w-0 flex-1 text-left"><strong className="block truncate font-serif text-[10px] text-[#e7d7bc]">{hero.name}</strong><span className="text-[8px] text-[#8f7a67]">PV {hero.currentHp}/{hero.maxHp} · PM {hero.currentMana}/{hero.maxMana}</span></button>
        {unavailableReason ? <Tooltip label={`Pourquoi ${hero.name} ne peut pas être déployé`} content={unavailableReason}>{deployAction}</Tooltip> : deployAction}
      </Card>;
      })}</div>}
    </div>
  </Panel>;
}
