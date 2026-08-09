import { Compass } from "lucide-react";
import type { DungeonEncounterView } from "../../domain/dungeonPresentation";
import EmptySlot from "../../ui/components/EmptySlot";
import Panel from "../../ui/components/Panel";
import Tooltip from "../../ui/components/Tooltip";
import Button from "../../ui/primitives/Button";

const stateClass = {
  pending: "text-amber-400",
  playing: "text-amber-400",
  victory: "text-emerald-400",
  defeat: "text-red-400",
};

export default function CurrentEncounterPanel(props: {
  view: DungeonEncounterView | null;
  canMutate: boolean;
  activeHeroCount: number;
  isExploring: boolean;
  onExplore: () => void;
}) {
  const disabled = !props.canMutate || props.activeHeroCount === 0 || props.isExploring;
  const unavailableReason = !props.canMutate ? "Lecture seule" : props.activeHeroCount === 0 ? "Déployez au moins un héros" : undefined;
  const exploreAction = <Button type="button" variant="primary" block busy={props.isExploring} disabled={disabled && !props.isExploring} onClick={props.onExplore} className="min-h-12 uppercase tracking-widest">{props.isExploring ? "Exploration en cours…" : "Explorer la salle"}</Button>;
  return <Panel title="Rencontre actuelle" subtitle={props.view?.location ?? "Aucune rencontre engagée"} testId="dungeon-current-encounter" variant="strong" className="flex h-[675px] min-h-[675px] max-h-[675px] w-full flex-col overflow-hidden" contentClassName="flex min-h-0 flex-1 flex-col">
    <div className="flex min-h-0 flex-1 flex-col">
      {!props.view ? <EmptySlot className="flex-1 flex-col gap-3 py-8"><Compass className="h-8 w-8" /><p className="text-xs">L’escouade attend votre ordre.</p></EmptySlot> : <>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[#49311f] bg-[#110b06] p-3" aria-label={props.view.state === "pending" ? "Rencontre autoritaire active" : undefined}>
          <div><h4 className="font-serif text-sm font-bold text-[#e7d7bc]">{props.view.title}</h4><p className="mt-1 text-[10px] text-[#8f7a67]">{props.view.location}</p></div>
          <span className={`text-[9px] font-bold uppercase ${stateClass[props.view.state]}`}>{props.view.statusLabel}</span>
        </div>
        <div data-testid="dungeon-encounter-transcript" className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-[#3a281a] bg-[#0f0a07] p-3" aria-live="polite">
          {props.view.transcript.length === 0 ? <p className="text-[10px] italic text-[#8f7a67]">{props.view.state === "pending" ? "Le serveur prépare la résolution de la rencontre." : "La rencontre commence…"}</p> : [...props.view.transcript].reverse().map((event) => <p key={event.id} className={`text-[11px] leading-relaxed ${event.category === "combat-hero" ? "text-sky-300" : event.category === "combat-enemy" || event.category === "defeat" ? "text-rose-400" : event.category === "victory" || event.category === "loot" ? "text-emerald-400" : "text-[#c9b99a]"}`}>{event.message}</p>)}
          {props.view.result && <p className={`pt-2 text-[11px] font-bold ${stateClass[props.view.state]}`}>{props.view.result}</p>}
        </div>
      </>}
      {unavailableReason ? <Tooltip label="Pourquoi l’exploration est indisponible" content={unavailableReason} className="mt-3 w-full">{exploreAction}</Tooltip> : <div className="mt-3">{exploreAction}</div>}
    </div>
  </Panel>;
}
