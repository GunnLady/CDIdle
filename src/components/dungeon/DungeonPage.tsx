import { useEffect, useMemo, useRef, useState } from "react";
import type { Hero, BattleLogEntry } from "../../types";
import type {
  CanonicalActiveDungeonEncounter,
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonProgress,
} from "../../../shared/contracts/authoritative";
import { createHeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import { createHeroSkillsView } from "../../domain/heroSkillPresentation";
import {
  createCurrentEncounterView,
  createDungeonHistoryView,
  createDungeonPartyView,
  createDungeonProgressView,
  createUndercityJourneyView,
} from "../../domain/dungeonPresentation";
import { createHeroRosterView, createSelectedHeroView, resolveSelectedHeroId } from "../../domain/heroPresentation";
import CurrentEncounterPanel from "./CurrentEncounterPanel";
import DungeonHistoryPanel from "./DungeonHistoryPanel";
import DungeonPartyWorkspace from "./DungeonPartyWorkspace";
import DungeonProgressControls from "./DungeonProgressControls";

export interface DungeonPageProps {
  heroes: Hero[];
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  autoExplore: boolean;
  dungeonProgress: CanonicalDungeonProgress;
  battleLogs: BattleLogEntry[];
  highestFloorReached: number;
  canMutate: boolean;
  onToggleAutoExplore: () => void;
  activeEncounter: CanonicalActiveDungeonEncounter | null;
  encounterHistory: CanonicalDungeonEncounterRecord[];
  encounterPlayback: { encounterId: string; visibleCount: number; complete: boolean } | null;
  isExploring: boolean;
  onExplore: () => void;
  onChangeFloor: (direction: "prev" | "next") => void;
  onRetreatParty: () => void;
  onClearBattleLogs: () => void;
  onResetLevel: () => void;
  onResume: () => void;
  onSelectFarmZone: (zoneId: string) => void;
  onToggleHeroActive: (heroId: string) => void;
}

export default function DungeonPage(props: DungeonPageProps) {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(() => resolveSelectedHeroId(props.heroes, null));
  const [resetConfirming, setResetConfirming] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedSelectedId = resolveSelectedHeroId(props.heroes, selectedHeroId);
  const selectedHero = props.heroes.find((hero) => hero.id === resolvedSelectedId) ?? null;
  const roster = useMemo(() => createHeroRosterView(props.heroes), [props.heroes]);
  const progress = useMemo(() => createDungeonProgressView(props.activeDungeonFloor, props.activeDungeonRoom, props.highestFloorReached), [props.activeDungeonFloor, props.activeDungeonRoom, props.highestFloorReached]);
  const journey = useMemo(() => createUndercityJourneyView(props.dungeonProgress, props.heroes), [props.dungeonProgress, props.heroes]);
  const party = useMemo(() => createDungeonPartyView(props.heroes, roster), [props.heroes, roster]);
  const encounter = useMemo(() => createCurrentEncounterView(props.activeEncounter, props.encounterHistory, props.encounterPlayback, props.heroes), [props.activeEncounter, props.encounterHistory, props.encounterPlayback, props.heroes]);
  const history = useMemo(() => createDungeonHistoryView(props.encounterHistory, props.battleLogs, props.heroes, props.encounterPlayback), [props.encounterHistory, props.battleLogs, props.heroes, props.encounterPlayback]);
  const selectedHeroView = useMemo(() => createSelectedHeroView(selectedHero), [selectedHero]);
  const equipment = useMemo(() => createHeroEquipmentView(selectedHero, []), [selectedHero]);
  const skills = useMemo(() => createHeroSkillsView(selectedHero), [selectedHero]);
  const activeHeroCount = party.party.filter(Boolean).length;

  useEffect(() => {
    if (resolvedSelectedId !== selectedHeroId) setSelectedHeroId(resolvedSelectedId);
  }, [resolvedSelectedId, selectedHeroId]);

  useEffect(() => () => {
    if (resetTimeout.current) clearTimeout(resetTimeout.current);
  }, []);

  const handleReset = () => {
    if (resetConfirming) {
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
      resetTimeout.current = null;
      setResetConfirming(false);
      props.onResetLevel();
      return;
    }
    setResetConfirming(true);
    resetTimeout.current = setTimeout(() => {
      setResetConfirming(false);
      resetTimeout.current = null;
    }, 4_000);
  };

  return <section aria-labelledby="dungeon-page-title" className="space-y-4 animate-fade-in motion-reduce:animate-none">
    <h2 id="dungeon-page-title" className="sr-only">Donjon</h2>
    <DungeonProgressControls view={progress} journey={journey} autoExplore={props.autoExplore} canMutate={props.canMutate} encounterActive={Boolean(props.activeEncounter)} activeHeroCount={activeHeroCount} resetConfirming={resetConfirming} onChangeFloor={props.onChangeFloor} onToggleAutoExplore={props.onToggleAutoExplore} onRetreatParty={props.onRetreatParty} onResetLevel={handleReset} onResume={props.onResume} onSelectFarmZone={props.onSelectFarmZone} />
    <div className="grid grid-cols-1 items-start gap-4">
      <CurrentEncounterPanel view={encounter} canMutate={props.canMutate && !journey.halted && !journey.awaitingFarmSelection} activeHeroCount={activeHeroCount} isExploring={props.isExploring} onExplore={props.onExplore} />
      <DungeonPartyWorkspace party={party.party} reserves={party.reserves} selectedHeroId={resolvedSelectedId} selectedHero={selectedHeroView} equipment={equipment} skills={skills} canMutate={props.canMutate && !props.activeEncounter} onSelectHero={setSelectedHeroId} onToggleHeroActive={props.onToggleHeroActive} />
    </div>
    <DungeonHistoryPanel view={history} onClearBattleLogs={props.onClearBattleLogs} />
  </section>;
}
