import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import type { DungeonProgressView } from "../../domain/dungeonPresentation";
import Panel from "../../ui/components/Panel";
import Tooltip from "../../ui/components/Tooltip";
import RoomProgress from "../../ui/patterns/RoomProgress";
import Button from "../../ui/primitives/Button";
import IconButton from "../../ui/primitives/IconButton";

export default function DungeonProgressControls(props: {
  view: DungeonProgressView;
  autoExplore: boolean;
  canMutate: boolean;
  activeHeroCount: number;
  resetConfirming: boolean;
  onChangeFloor: (direction: "prev" | "next") => void;
  onToggleAutoExplore: () => void;
  onRetreatParty: () => void;
  onResetLevel: () => void;
}) {
  const noParty = props.activeHeroCount === 0;
  const autoDisabled = !props.canMutate || (!props.autoExplore && noParty);
  const autoUnavailableReason = !props.canMutate ? "Lecture seule" : !props.autoExplore && noParty ? "Aucun héros actif" : undefined;
  const autoAction = <Button type="button" variant={props.autoExplore ? "primary" : "secondary"} disabled={autoDisabled} onClick={props.onToggleAutoExplore} className="w-full whitespace-nowrap uppercase">{props.autoExplore ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{props.autoExplore ? "Arrêter l’auto" : "Exploration auto"}</Button>;
  return <Panel title="Progression" subtitle={`Étage ${props.view.floor} · Salle ${props.view.room}/${props.view.roomCount}`} testId="dungeon-progression-panel" variant="strong">
    <div className="flex flex-wrap items-center gap-2">
      <IconButton type="button" label="Étage précédent" disabled={!props.canMutate || !props.view.canGoPrevious} onClick={() => props.onChangeFloor("prev")}><ArrowLeft className="h-4 w-4" /></IconButton>
      <div className="min-w-[15rem] flex-1 overflow-x-auto rounded-ui-control border border-ui-border-subtle bg-ui-surface p-2"><RoomProgress label="Progression des salles" steps={props.view.rooms.map((room) => ({ id: String(room.number), label: String(room.number), state: room.state, boss: room.isBoss }))} /></div>
      <IconButton type="button" label="Étage suivant" disabled={!props.canMutate || !props.view.canGoNext} onClick={() => props.onChangeFloor("next")}><ArrowRight className="h-4 w-4" /></IconButton>
    </div>

    <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[#5c402b]/30 pt-3 sm:grid-cols-3">
      {autoUnavailableReason ? <Tooltip label="Pourquoi l’exploration automatique est indisponible" content={autoUnavailableReason} className="w-full min-w-0">{autoAction}</Tooltip> : <div className="w-full min-w-0">{autoAction}</div>}
      <Button type="button" variant="danger" block disabled={!props.canMutate} onClick={props.onRetreatParty} className="whitespace-nowrap uppercase">Repli au campement</Button>
      <Button type="button" variant={props.resetConfirming ? "danger" : "secondary"} block disabled={!props.canMutate} onClick={props.onResetLevel} className="whitespace-nowrap uppercase"><RotateCcw className="h-3.5 w-3.5" />{props.resetConfirming ? "Confirmer le reset" : "Réinitialiser l’étage"}</Button>
    </div>
  </Panel>;
}
