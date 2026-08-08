import { Shield } from "lucide-react";
import type { HeroRosterEntryView } from "../../domain/heroPresentation";
import HeroPanelFrame from "./HeroPanelFrame";

interface DungeonPartyManagerProps {
  party: Array<HeroRosterEntryView | null>;
  floor: number;
  room: number;
  onSelectHero: (heroId: string) => void;
  onOpenDungeon: () => void;
}

export default function DungeonPartyManager(props: DungeonPartyManagerProps) {
  return <HeroPanelFrame title="Expédition" subtitle={`Étage ${props.floor} · Salle ${props.room}`} testId="dungeon-party-manager">
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {props.party.map((hero, index) => {
        if (!hero) return <div key={index} className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-[#4a321f] px-1 text-center text-[9px] text-[#756353]">Place libre</div>;
        return <button key={hero.id} type="button" aria-label={`${hero.name}, PV ${hero.currentHp} sur ${hero.maxHp}`} onClick={() => props.onSelectHero(hero.id)} className="min-h-16 min-w-0 rounded-lg border border-[#674923] bg-[#21150d] p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
          <strong className="block truncate font-serif text-[10px] text-[#f0dfbe]">{hero.name}</strong>
          <span className="mt-1 block truncate text-[8px] text-[#9f8872]">Niv. {hero.level}</span>
          <span className="mt-1 block truncate text-[8px] text-emerald-400">PV {hero.currentHp}/{hero.maxHp}</span>
          <span className="mt-1 block h-1 overflow-hidden rounded bg-[#3a2118]" aria-hidden="true"><span className="block h-full bg-emerald-600" style={{ width: `${hero.healthPercent}%` }} /></span>
        </button>;
      })}
    </div>

    <button type="button" onClick={props.onOpenDungeon} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#8c5a2b] px-3 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]"><Shield className="h-4 w-4" />Voir le Donjon</button>
  </HeroPanelFrame>;
}
