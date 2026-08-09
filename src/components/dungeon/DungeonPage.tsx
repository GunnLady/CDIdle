import { useEffect, useMemo, useRef, useState } from "react";
import type { Hero, BattleLogEntry } from "../../types";
import type {
  CanonicalActiveDungeonEncounter,
  CanonicalDungeonEncounterRecord,
} from "../../../shared/contracts/authoritative";
import { createHeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import {
  createCurrentEncounterView,
  createDungeonHistoryView,
  createDungeonPartyView,
  createDungeonProgressView,
} from "../../domain/dungeonPresentation";
import { createHeroRosterView, createSelectedHeroView, resolveSelectedHeroId } from "../../domain/heroPresentation";
import CurrentEncounterPanel from "./CurrentEncounterPanel";
import DungeonHistoryPanel from "./DungeonHistoryPanel";
import DungeonPartyPanel from "./DungeonPartyPanel";
import DungeonProgressControls from "./DungeonProgressControls";

export interface DungeonPageProps {
  heroes: Hero[];
  activeDungeonFloor: number;
  activeDungeonRoom: number;
  autoExplore: boolean;
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
  const party = useMemo(() => createDungeonPartyView(props.heroes, roster), [props.heroes, roster]);
  const encounter = useMemo(() => createCurrentEncounterView(props.activeEncounter, props.encounterHistory, props.encounterPlayback, props.heroes), [props.activeEncounter, props.encounterHistory, props.encounterPlayback, props.heroes]);
  const history = useMemo(() => createDungeonHistoryView(props.encounterHistory, props.battleLogs, props.heroes, props.encounterPlayback), [props.encounterHistory, props.battleLogs, props.heroes, props.encounterPlayback]);
  const selectedHeroView = useMemo(() => createSelectedHeroView(selectedHero), [selectedHero]);
  const equipment = useMemo(() => createHeroEquipmentView(selectedHero, []), [selectedHero]);
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
    <DungeonProgressControls view={progress} autoExplore={props.autoExplore} canMutate={props.canMutate} activeHeroCount={activeHeroCount} resetConfirming={resetConfirming} onChangeFloor={props.onChangeFloor} onToggleAutoExplore={props.onToggleAutoExplore} onRetreatParty={props.onRetreatParty} onResetLevel={handleReset} />
    <div className="grid grid-cols-1 items-start gap-4 xl:h-[55em] xl:grid-cols-[minmax(28rem,0.85fr)_minmax(36rem,1.15fr)] xl:items-stretch">
      <CurrentEncounterPanel view={encounter} canMutate={props.canMutate} activeHeroCount={activeHeroCount} isExploring={props.isExploring} onExplore={props.onExplore} />
      <DungeonPartyPanel party={party.party} reserves={party.reserves} selectedHeroId={resolvedSelectedId} selectedHero={selectedHeroView} equipment={equipment} canMutate={props.canMutate} onSelectHero={setSelectedHeroId} onToggleHeroActive={props.onToggleHeroActive} />
    </div>
    <DungeonHistoryPanel view={history} onClearBattleLogs={props.onClearBattleLogs} />
  </section>;
}
