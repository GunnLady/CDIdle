import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import type { DungeonProgressView } from "../../domain/dungeonPresentation";
import DungeonPanelFrame from "./DungeonPanelFrame";

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
  return <DungeonPanelFrame title="Progression" subtitle={`Étage ${props.view.floor} · Salle ${props.view.room}/${props.view.roomCount}`} testId="dungeon-progression-panel">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" aria-label="Étage précédent" disabled={!props.canMutate || !props.view.canGoPrevious} onClick={() => props.onChangeFloor("prev")} className="min-h-11 rounded border border-[#5c402b] px-3 text-[#caa050] disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
      <div className="grid min-w-[15rem] flex-1 grid-flow-col gap-1 overflow-x-auto rounded-lg border border-[#5c402b]/30 bg-[#110b06] p-2" aria-label="Progression des salles">
        {props.view.rooms.map((room) => <span key={room.number} title={room.isBoss ? "Salle du boss" : `Salle ${room.number}`} className={`flex h-6 min-w-6 items-center justify-center rounded border text-[9px] font-mono ${room.state === "current" ? "border-red-500 bg-red-600 font-bold text-white" : room.state === "completed" ? "border-red-950/50 bg-[#421d1d]/30 text-[#bf6767]" : "border-[#2d1d12] bg-[#18110b] text-[#5c4b3f]"}`}>{room.isBoss ? "☠" : room.number}</span>)}
      </div>
      <button type="button" aria-label="Étage suivant" disabled={!props.canMutate || !props.view.canGoNext} onClick={() => props.onChangeFloor("next")} className="min-h-11 rounded border border-[#5c402b] px-3 text-[#caa050] disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
    </div>

    <div className="mt-3 flex flex-wrap gap-2 border-t border-[#5c402b]/30 pt-3">
      <button type="button" disabled={!props.canMutate || (!props.autoExplore && noParty)} title={!props.canMutate ? "Lecture seule" : noParty ? "Aucun héros actif" : undefined} onClick={props.onToggleAutoExplore} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded border px-3 text-[10px] font-bold uppercase ${props.autoExplore ? "border-[#d4af37] bg-[#8c5a2b] text-white" : "border-[#5c402b] bg-[#1c140f] text-[#c5ab8d]"} disabled:opacity-35`}>{props.autoExplore ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{props.autoExplore ? "Arrêter l’auto" : "Exploration auto"}</button>
      <button type="button" disabled={!props.canMutate} onClick={props.onRetreatParty} className="min-h-11 rounded border border-red-900/60 px-4 text-[10px] font-bold uppercase text-red-300 disabled:opacity-35">Repli au campement</button>
      <button type="button" disabled={!props.canMutate} onClick={props.onResetLevel} className={`flex min-h-11 items-center gap-2 rounded border px-3 text-[10px] font-bold uppercase disabled:opacity-35 ${props.resetConfirming ? "border-red-500 bg-red-950 text-red-200" : "border-[#5c402b] text-[#a89078]"}`}><RotateCcw className="h-3.5 w-3.5" />{props.resetConfirming ? "Confirmer le reset" : "Réinitialiser l’étage"}</button>
    </div>
  </DungeonPanelFrame>;
}
