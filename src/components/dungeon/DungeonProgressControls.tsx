import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import type { DungeonProgressView, UndercityJourneyView } from "../../domain/dungeonPresentation";
import Panel from "../../ui/components/Panel";
import Tooltip from "../../ui/components/Tooltip";
import RoomProgress from "../../ui/patterns/RoomProgress";
import Button from "../../ui/primitives/Button";
import IconButton from "../../ui/primitives/IconButton";

export default function DungeonProgressControls(props: {
  view: DungeonProgressView;
  journey: UndercityJourneyView;
  autoExplore: boolean;
  canMutate: boolean;
  encounterActive: boolean;
  activeHeroCount: number;
  resetConfirming: boolean;
  onChangeFloor: (direction: "prev" | "next") => void;
  onToggleAutoExplore: () => void;
  onRetreatParty: () => void;
  onResetLevel: () => void;
  onResume: () => void;
  onSelectFarmZone: (zoneId: string) => void;
}) {
  const noParty = props.activeHeroCount === 0;
  const progressionUnavailable = props.journey.awaitingFarmSelection;
  const navigationDisabled = props.encounterActive || props.journey.halted || progressionUnavailable || props.journey.mode === "farm";
  const autoDisabled = !props.canMutate || props.journey.halted || progressionUnavailable || (!props.autoExplore && noParty);
  const autoUnavailableReason = !props.canMutate ? "Lecture seule" : props.journey.halted ? "Reprenez l’expédition" : progressionUnavailable ? "Choisissez une zone à farmer" : !props.autoExplore && noParty ? "Aucun héros actif" : undefined;
  const autoAction = <Button type="button" variant={props.autoExplore ? "primary" : "secondary"} disabled={autoDisabled} onClick={props.onToggleAutoExplore} className="w-full whitespace-nowrap uppercase">{props.autoExplore ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{props.autoExplore ? "Arrêter l’auto" : "Exploration auto"}</Button>;
  return <Panel title="Progression" subtitle={`Étage ${props.view.floor} · Salle ${props.view.room}/${props.view.roomCount}`} testId="dungeon-progression-panel" variant="strong">
    <div className="flex flex-wrap items-center gap-2">
      <IconButton type="button" label="Étage précédent" disabled={!props.canMutate || navigationDisabled || !props.view.canGoPrevious} onClick={() => props.onChangeFloor("prev")}><ArrowLeft className="h-4 w-4" /></IconButton>
      <div className="min-w-[15rem] flex-1 overflow-x-auto rounded-ui-control border border-ui-border-subtle bg-ui-surface p-2"><RoomProgress label="Progression des salles" steps={props.view.rooms.map((room) => ({ id: String(room.number), label: String(room.number), state: room.state, boss: room.isBoss }))} /></div>
      <IconButton type="button" label="Étage suivant" disabled={!props.canMutate || navigationDisabled || props.view.floor >= props.journey.maxSelectableFloor || !props.view.canGoNext} onClick={() => props.onChangeFloor("next")}><ArrowRight className="h-4 w-4" /></IconButton>
    </div>

    <div className="mt-3 grid gap-3 border-t border-[#5c402b]/30 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="rounded-ui-control border border-ui-border-subtle bg-ui-surface p-3 text-xs text-ui-text-muted">
        <p>Jalon commun : <strong className="text-ui-text">étage {props.journey.commonCheckpoint}</strong></p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {props.journey.members.map((member) => <span key={member.heroId}>{member.name} : {member.completedFloor}/50</span>)}
        </div>
        {props.journey.halted && <div className="mt-3 flex items-center justify-between gap-3 rounded-ui-control border border-amber-700/50 bg-amber-950/30 p-2"><span>Expédition arrêtée après {props.journey.haltReason === "wipe" ? "un wipe" : "un repli"}.</span><Button type="button" variant="primary" disabled={!props.canMutate || noParty} onClick={props.onResume}>Reprendre</Button></div>}
      </div>
      {props.journey.farmZones.length > 0 && <div className="rounded-ui-control border border-ui-border-subtle bg-ui-surface p-3"><p className="mb-2 text-xs font-bold uppercase text-ui-text-muted">Zone à farmer</p><div className="flex flex-wrap gap-2">{props.journey.farmZones.map((zone) => <Button key={zone.id} type="button" variant={zone.selected ? "primary" : "secondary"} disabled={!props.canMutate || props.encounterActive} onClick={() => props.onSelectFarmZone(zone.id)}>{zone.name}</Button>)}</div></div>}
    </div>
    <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[#5c402b]/30 pt-3 sm:grid-cols-3">
      {autoUnavailableReason ? <Tooltip label="Pourquoi l’exploration automatique est indisponible" content={autoUnavailableReason} className="w-full min-w-0">{autoAction}</Tooltip> : <div className="w-full min-w-0">{autoAction}</div>}
      <Button type="button" variant="danger" block disabled={!props.canMutate} onClick={props.onRetreatParty} className="whitespace-nowrap uppercase">Repli au campement</Button>
      <Button type="button" variant={props.resetConfirming ? "danger" : "secondary"} block disabled={!props.canMutate || navigationDisabled} onClick={props.onResetLevel} className="whitespace-nowrap uppercase"><RotateCcw className="h-3.5 w-3.5" />{props.resetConfirming ? "Confirmer le reset" : "Réinitialiser l’étage"}</Button>
    </div>
  </Panel>;
}
