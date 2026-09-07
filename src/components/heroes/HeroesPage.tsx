import { useEffect, useMemo, useState } from "react";
import type { Hero, HeroEquipment, Resources, StoredItemInstance } from "../../types";
import type { ActiveTab } from "../../domain/activeTabPreference";
import { createHeroesPageView, createSelectedHeroView, resolveSelectedHeroId } from "../../domain/heroPresentation";
import { createHeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import { createHeroSkillsView } from "../../domain/heroSkillPresentation";
import HeroEquipmentPanel from "./HeroEquipmentPanel";
import HeroRosterPanel from "./HeroRosterPanel";
import HeroSkillsPanel from "./HeroSkillsPanel";
import SelectedHeroPanel from "./SelectedHeroPanel";

export interface HeroesPageProps {
  heroes: Hero[];
  resources: Resources;
  buildings: Record<string, number>;
  storedItems?: StoredItemInstance[];
  canMutate: boolean;
  canChangeComposition?: boolean;
  onDismissHero: (heroId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
  onRecruitHero: () => void;
  onUnequipItem?: (heroId: string, slot: keyof HeroEquipment) => void;
  onGoToTab?: (tab: ActiveTab) => void;
}

export default function HeroesPage(props: HeroesPageProps) {
  const canChangeComposition = props.canChangeComposition ?? props.canMutate;
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
    <div className="grid grid-cols-1 items-start gap-4 xl:min-h-[48rem] xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,2.2fr)] xl:items-stretch">
      <div data-testid="heroes-left-column" className="space-y-4 xl:flex xl:min-h-0 xl:flex-col xl:space-y-0 xl:gap-4">
        <HeroRosterPanel roster={view.roster} selectedHeroId={resolvedSelectedId} capacity={view.capacity} recruitCost={view.recruitCost} canRecruit={view.canRecruit} recruitmentBlockReason={view.recruitmentBlockReason} canMutate={props.canMutate} canChangeComposition={canChangeComposition} onSelectHero={setSelectedHeroId} onToggleHeroActive={props.onToggleHeroActive} onRecruitHero={props.onRecruitHero} />
      </div>
      <div data-testid="hero-presentation-workspace" className="ui-hero-presentation-panel ui-hero-presentation-workspace min-w-0 p-4 sm:p-6 xl:min-h-0">
        <div className="grid min-w-0 items-stretch gap-5 xl:min-h-full xl:grid-cols-[minmax(20rem,1fr)_minmax(22rem,1.1fr)]">
          <SelectedHeroPanel view={selectedHeroView} canMutate={canChangeComposition} onDismissHero={props.onDismissHero} />
          <div data-testid="heroes-right-column" className="space-y-4 xl:flex xl:min-h-0 xl:flex-col xl:space-y-0 xl:gap-4">
            <HeroEquipmentPanel view={equipmentView} canMutate={props.canMutate} onUnequipItem={props.onUnequipItem} onOpenStorage={() => props.onGoToTab?.("storage")} />
            <HeroSkillsPanel view={skillsView} />
          </div>
        </div>
      </div>
    </div>
  </section>;
}
