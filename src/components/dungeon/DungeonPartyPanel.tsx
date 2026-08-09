import type { HeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import type { SelectedHeroView } from "../../domain/heroPresentation";
import type { DungeonPartyHeroView } from "../../domain/dungeonPresentation";
import EquipmentItemDetails from "../heroes/EquipmentItemDetails";
import DungeonPanelFrame from "./DungeonPanelFrame";

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
  selectedHero: SelectedHeroView | null;
  equipment: HeroEquipmentView | null;
  canMutate: boolean;
  onSelectHero: (heroId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
}) {
  return <DungeonPanelFrame title="Gestion du groupe" subtitle={`${props.party.filter(Boolean).length}/${props.party.length} héros engagés`} testId="dungeon-party-panel" className="xl:flex xl:h-full xl:min-h-0 xl:flex-col" contentClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1" contentTestId="dungeon-party-scroll">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {props.party.map((hero, index) => hero ? <article data-testid="dungeon-party-slot" key={hero.id} className={`flex min-h-[17rem] flex-col rounded-lg border p-2 ${props.selectedHeroId === hero.id ? "border-[#caa050] bg-[#2b1c11]" : "border-[#49311f] bg-[#110b06]"}`}>
        <button type="button" aria-pressed={props.selectedHeroId === hero.id} onClick={() => props.onSelectHero(hero.id)} className="min-h-11 w-full flex-1 text-left focus-visible:outline-2 focus-visible:outline-[#caa050]"><span className="flex items-center justify-between gap-1"><strong className="block truncate font-serif text-[10px] text-[#f0dfbe]">{hero.name}</strong><span className="shrink-0 text-[8px] text-[#caa050]">Niv. {hero.level}</span></span><span className="block truncate text-[8px] text-[#9f8872]">{hero.race} · {hero.className}</span><HeroVitals hero={hero} /><span className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-[#9f8872]"><span title="Puissance garantie de l'attaque normale avant le jet de l'arme">ATK <strong className="text-[#dfdbc7]">{hero.attackPower}</strong></span><span title="Défense physique">DEF <strong className="text-[#dfdbc7]">{hero.physicalDefense}</strong></span><span title="DPS estimé de l'attaque normale par cycle, avant défense et résistances">DPS <strong className="text-[#dfdbc7]">{hero.estimatedDps}</strong></span><span title="Vitesse">VIT <strong className="text-[#dfdbc7]">{hero.speed}</strong></span><span title="Taux de coups critiques">CRT <strong className="text-[#dfdbc7]">{hero.criticalChance}%</strong></span><span title="Esquive">ESQ <strong className="text-[#dfdbc7]">{hero.dodgeChance}%</strong></span></span></button>
        <button type="button" aria-label={`Retirer ${hero.name}`} disabled={!props.canMutate} onClick={() => props.onToggleHeroActive(hero.id)} className="mt-2 min-h-11 w-full rounded border border-red-900/50 text-[9px] text-red-300 disabled:opacity-35">Retirer</button>
      </article> : <div data-testid="dungeon-party-slot" key={index} className="flex min-h-[17rem] items-center justify-center rounded-lg border border-dashed border-[#4a321f] text-[9px] text-[#756353]">Place libre</div>)}
    </div>

    <div className="mt-4 border-t border-[#5c402b]/30 pt-3">
      <h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ae8650]">Réservistes</h4>
      {props.reserves.length === 0 ? <p className="text-[10px] italic text-[#756353]">Aucun héros en réserve.</p> : <div data-testid="dungeon-reserves-list" className="space-y-2">{props.reserves.map((hero) => <article key={hero.id} className={`flex items-stretch gap-2 rounded-lg border p-2 ${props.selectedHeroId === hero.id ? "border-[#caa050] bg-[#2b1c11]" : "border-[#3f2b1c] bg-[#130c08]"}`}>
        <button type="button" aria-pressed={props.selectedHeroId === hero.id} onClick={() => props.onSelectHero(hero.id)} className="min-h-11 min-w-0 flex-1 text-left"><strong className="block truncate font-serif text-[10px] text-[#e7d7bc]">{hero.name}</strong><span className="text-[8px] text-[#8f7a67]">PV {hero.currentHp}/{hero.maxHp} · PM {hero.currentMana}/{hero.maxMana}</span></button>
        <button type="button" aria-label={`Déployer ${hero.name}`} title={hero.deploymentBlockReason} disabled={!props.canMutate || !hero.canDeploy} onClick={() => props.onToggleHeroActive(hero.id)} className="min-h-11 rounded border border-[#8b6b2f] px-2 text-[9px] font-bold text-[#caa050] disabled:opacity-30">Déployer</button>
      </article>)}</div>}
    </div>

    {props.selectedHero && <details className="mt-4 rounded-lg border border-[#49311f] bg-[#110b06] p-3">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between font-serif text-[10px] font-bold text-[#e7d7bc]"><span>{props.selectedHero.name}</span><span className="text-[9px] text-[#caa050]">Fiche & équipement</span></summary>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[9px]"><span className="rounded bg-[#1c1109] p-2 text-emerald-400">PV {props.selectedHero.currentHp}/{props.selectedHero.maxHp}</span><span className="rounded bg-[#1c1109] p-2 text-sky-400">PM {props.selectedHero.currentMana}/{props.selectedHero.maxMana}</span>{props.selectedHero.combatStats.slice(0, 4).map((stat) => <span key={stat.label} className="rounded bg-[#1c1109] p-2 text-[#9f8872]">{stat.label}<strong className="block text-[#dfdbc7]">{stat.value}</strong></span>)}</div>
      {props.equipment && <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{props.equipment.slots.map((slot) => <div key={slot.key} className="rounded border border-[#342317] p-2"><span className="text-[8px] uppercase tracking-wider text-[#8f7a67]">{slot.icon} {slot.label}</span>{slot.item ? <div className="mt-1"><EquipmentItemDetails item={slot.item} /></div> : <p className="mt-1 text-[9px] italic text-[#756353]">Emplacement vide</p>}</div>)}</div>}
    </details>}
  </DungeonPanelFrame>;
}
