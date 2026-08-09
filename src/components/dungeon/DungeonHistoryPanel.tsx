import { ChevronDown, RotateCcw } from "lucide-react";
import type { DungeonHistoryView } from "../../domain/dungeonPresentation";

export default function DungeonHistoryPanel(props: {
  view: DungeonHistoryView;
  onClearBattleLogs: () => void;
}) {
  return <details open data-testid="dungeon-history-panel" className="group rounded-xl border-2 border-[#5c402b] bg-[#18110b] p-4 shadow-xl">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 border-b border-[#5c402b]/40 pb-2 [&::-webkit-details-marker]:hidden">
      <div><h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#d4af37]">Historique</h3><p className="mt-1 text-[10px] text-[#a89078]">Rencontres canoniques et notes locales</p></div>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[#ae8650] transition-transform group-open:rotate-180" />
    </summary>
    <div className="pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex min-h-11 flex-1 items-center justify-center rounded bg-[#ae8650] px-3 text-[10px] font-bold uppercase text-[#0f0a07]">Donjon</span>
        <button type="button" onClick={props.onClearBattleLogs} title="Efface uniquement les notes locales" className="flex min-h-11 items-center gap-2 rounded border border-[#5c402b] px-3 text-[9px] text-[#dfc3a7]"><RotateCcw className="h-3 w-3" />Effacer les notes</button>
      </div>
      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {props.view.encounters.map((encounter) => <article key={encounter.encounterId} className={`rounded-lg border-l-4 bg-[#110b06] p-3 ${encounter.state === "victory" ? "border-emerald-800" : encounter.state === "defeat" ? "border-red-900" : "border-amber-700"}`}>
          <div className="flex justify-between gap-2"><div><h4 className="font-serif text-[11px] font-bold text-[#dfdbc7]">{encounter.title}</h4><p className="text-[9px] text-[#8f7a67]">{encounter.location}</p></div><span className="text-[9px] uppercase text-[#caa050]">{encounter.statusLabel}</span></div>
          <div className="mt-2 space-y-1">{encounter.transcript.length === 0 ? <p className="text-[10px] italic text-[#756353]">La rencontre commence…</p> : [...encounter.transcript].reverse().map((event) => <p key={event.id} className="text-[10px] text-[#bca98d]">{event.message}</p>)}</div>
          {encounter.result && <p className="mt-2 text-[10px] font-bold text-[#caa050]">{encounter.result}</p>}
        </article>)}
        {props.view.notes.map((note) => <p key={note.id} className="rounded border border-[#342317] bg-[#110b06] p-2 text-[10px] text-[#a89078]"><span className="mr-2 font-mono text-[#5c402b]">[{note.timestamp}]</span>{note.message}</p>)}
        {props.view.encounters.length === 0 && props.view.notes.length === 0 && <p className="p-4 text-center text-xs italic text-[#756353]">{props.view.emptyMessage}</p>}
      </div>
    </div>
  </details>;
}
