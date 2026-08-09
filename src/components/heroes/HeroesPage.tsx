import { useEffect, useMemo, useState } from "react";
import type { Hero, HeroEquipment, Resources, StoredItemInstance } from "../../types";
import type { ActiveTab } from "../../domain/activeTabPreference";
import { createHeroesPageView, createSelectedHeroView, resolveSelectedHeroId } from "../../domain/heroPresentation";
import { createHeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import { createHeroSkillsView } from "../../domain/heroSkillPresentation";
import DungeonPartyManager from "./DungeonPartyManager";
import HeroEquipmentPanel from "./HeroEquipmentPanel";
import HeroRosterPanel from "./HeroRosterPanel";
import HeroSkillsPanel from "./HeroSkillsPanel";
import SelectedHeroPanel from "./SelectedHeroPanel";

export interface HeroesPageProps {
  heroes: Hero[];
  resources: Resources;
  buildings: Record<string, number>;
  storedItems?: StoredItemInstance[];
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  canMutate: boolean;
  onDismissHero: (heroId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
  onRecruitHero: () => void;
  onUnequipItem?: (heroId: string, slot: keyof HeroEquipment) => void;
  onEquipItem?: (heroId: string, instanceId: string) => void;
  onGoToTab?: (tab: ActiveTab) => void;
}

export default function HeroesPage(props: HeroesPageProps) {
  const view = useMemo(() => createHeroesPageView(props.heroes, props.resources, props.buildings), [props.heroes, props.resources, props.buildings]);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(() => resolveSelectedHeroId(props.heroes, null));
  const resolvedSelectedId = resolveSelectedHeroId(props.heroes, selectedHeroId);
  const selectedHero = props.heroes.find((hero) => hero.id === resolvedSelectedId) ?? null;
  const selectedHeroView = useMemo(() => createSelectedHeroView(selectedHero), [selectedHero]);
  const equipmentView = useMemo(() => createHeroEquipmentView(selectedHero, props.storedItems ?? []), [selectedHero, props.storedItems]);
  const skillsView = useMemo(() => createHeroSkillsView(selectedHero), [selectedHero]);

  useEffect(() => {
    if (resolvedSelectedId !== selectedHeroId) setSelectedHeroId(resolvedSelectedId);
  }, [resolvedSelectedId, selectedHeroId]);

  return <section aria-labelledby="heroes-page-title" className="space-y-5 animate-fade-in motion-reduce:animate-none">
    <h2 id="heroes-page-title" className="sr-only">Aventuriers</h2>
    <div className="grid grid-cols-1 items-start gap-4 xl:min-h-[48rem] xl:grid-cols-[minmax(18rem,0.85fr)_minmax(24rem,1.15fr)_minmax(22rem,1fr)] xl:items-stretch">
      <div data-testid="heroes-left-column" className="space-y-4 xl:flex xl:min-h-0 xl:flex-col xl:space-y-0 xl:gap-4">
        <DungeonPartyManager party={view.party} selectedHeroId={resolvedSelectedId} floor={props.activeDungeonFloor} room={props.activeDungeonRoom} onSelectHero={setSelectedHeroId} onOpenDungeon={() => props.onGoToTab?.("dungeon")} />
        <HeroRosterPanel roster={view.roster} selectedHeroId={resolvedSelectedId} capacity={view.capacity} recruitCost={view.recruitCost} canRecruit={view.canRecruit} recruitmentBlockReason={view.recruitmentBlockReason} canMutate={props.canMutate} onSelectHero={setSelectedHeroId} onToggleHeroActive={props.onToggleHeroActive} onRecruitHero={props.onRecruitHero} />
      </div>
      <SelectedHeroPanel view={selectedHeroView} canMutate={props.canMutate} onDismissHero={props.onDismissHero} />
      <div data-testid="heroes-right-column" className="space-y-4 xl:flex xl:min-h-0 xl:flex-col xl:space-y-0 xl:gap-4">
        <HeroEquipmentPanel view={equipmentView} canMutate={props.canMutate} onUnequipItem={props.onUnequipItem} onEquipItem={props.onEquipItem} onOpenStorage={() => props.onGoToTab?.("storage")} />
        <HeroSkillsPanel view={skillsView} />
      </div>
    </div>
  </section>;
}
