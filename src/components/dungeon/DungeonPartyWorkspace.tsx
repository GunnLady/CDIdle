import type { HeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import type { SelectedHeroView } from "../../domain/heroPresentation";
import type { HeroSkillsView } from "../../domain/heroSkillPresentation";
import type { DungeonPartyHeroView } from "../../domain/dungeonPresentation";
import DungeonHeroSheet from "./DungeonHeroSheet";
import DungeonPartyPanel from "./DungeonPartyPanel";

export default function DungeonPartyWorkspace(props: {
  party: Array<DungeonPartyHeroView | null>;
  reserves: DungeonPartyHeroView[];
  selectedHeroId: string | null;
  selectedHero: SelectedHeroView | null;
  equipment: HeroEquipmentView | null;
  skills: HeroSkillsView | null;
  canMutate: boolean;
  onSelectHero: (heroId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
}) {
  return <div data-testid="dungeon-party-panel" className="grid items-start gap-4 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(32rem,1.1fr)] xl:items-stretch">
    <DungeonPartyPanel party={props.party} reserves={props.reserves} selectedHeroId={props.selectedHeroId} canMutate={props.canMutate} onSelectHero={props.onSelectHero} onToggleHeroActive={props.onToggleHeroActive} />
    <DungeonHeroSheet hero={props.selectedHero} equipment={props.equipment} skills={props.skills} />
  </div>;
}
