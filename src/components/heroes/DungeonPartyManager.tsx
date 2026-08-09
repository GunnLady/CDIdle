import { Shield } from "lucide-react";
import type { HeroRosterEntryView } from "../../domain/heroPresentation";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import SelectableCard from "../../ui/components/SelectableCard";
import Button from "../../ui/primitives/Button";

interface DungeonPartyManagerProps {
  party: Array<HeroRosterEntryView | null>;
  selectedHeroId: string | null;
  floor: number;
  room: number;
  onSelectHero: (heroId: string) => void;
  onOpenDungeon: () => void;
}

export default function DungeonPartyManager(props: DungeonPartyManagerProps) {
  return <Panel title="Expédition" subtitle={`Étage ${props.floor} · Salle ${props.room}`} testId="dungeon-party-manager">
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {props.party.map((hero, index) => {
        if (!hero) return <EmptySlot key={index} className="h-full min-h-[5.5rem] px-1 text-[9px]">Place libre</EmptySlot>;
        return <SelectableCard key={hero.id} selected={props.selectedHeroId === hero.id} aria-label={`${hero.name}, PV ${hero.currentHp} sur ${hero.maxHp}`} onClick={() => props.onSelectHero(hero.id)} className="h-full min-h-[5.5rem] min-w-0 p-2">
          <strong className="block truncate font-serif text-[10px] text-[#f0dfbe]">{hero.name}</strong>
          <span className="mt-1 block truncate text-[8px] text-[#9f8872]">Niv. {hero.level}</span>
          <span className="mt-1 block truncate text-[8px] text-emerald-400">PV {hero.currentHp}/{hero.maxHp}</span>
          <span className="mt-1 block h-1 overflow-hidden rounded bg-[#3a2118]" aria-hidden="true"><span className="block h-full bg-emerald-600" style={{ width: `${hero.healthPercent}%` }} /></span>
        </SelectableCard>;
      })}
    </div>

    <Button type="button" variant="primary" block onClick={props.onOpenDungeon} className="mt-4"><Shield className="h-4 w-4" />Voir le Donjon</Button>
  </Panel>;
}
