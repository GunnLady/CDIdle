import { ChevronDown, RotateCcw } from "lucide-react";
import type { BattleLogEntry } from "../types";

export interface ActivityLogPanelProps {
  title: string;
  subtitle: string;
  testId: string;
  entries: BattleLogEntry[];
  emptyMessage: string;
  onClear?: () => void;
}

export default function ActivityLogPanel(props: ActivityLogPanelProps) {
  return <details open data-testid={props.testId} className="group rounded-xl border-2 border-[#5c402b] bg-[#18110b] p-4 shadow-xl">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 border-b border-[#5c402b]/40 pb-2 [&::-webkit-details-marker]:hidden">
      <div><h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#d4af37]">{props.title}</h3><p className="mt-1 text-[10px] text-[#a89078]">{props.subtitle}</p></div>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[#ae8650] transition-transform group-open:rotate-180" />
    </summary>
    <div className="pt-3">
      {props.onClear && <div className="mb-3 flex justify-end"><button type="button" onClick={props.onClear} className="flex min-h-11 items-center gap-2 rounded border border-[#5c402b] px-3 text-[9px] text-[#dfc3a7]"><RotateCcw className="h-3 w-3" />Effacer les notes</button></div>}
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {props.entries.map((entry) => <p key={entry.id} className="rounded border border-[#342317] bg-[#110b06] p-2 text-[10px] text-[#a89078]"><span className="mr-2 font-mono text-[#5c402b]">[{entry.timestamp}]</span>{entry.message}</p>)}
        {props.entries.length === 0 && <p className="p-4 text-center text-xs italic text-[#756353]">{props.emptyMessage}</p>}
      </div>
    </div>
  </details>;
}
