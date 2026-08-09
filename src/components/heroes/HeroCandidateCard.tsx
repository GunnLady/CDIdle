import { Check, Edit2 } from "lucide-react";
import type { HeroCandidateSummaryView } from "../../domain/heroCandidatePresentation";
import Card from "../../ui/components/Card";
import HeroPortrait from "../HeroPortrait";

export default function HeroCandidateCard(props: {
  candidate: HeroCandidateSummaryView;
  nameLabel: string;
  selected?: boolean;
  selectable?: boolean;
  onToggle?: () => void;
  onRename: (name: string) => void;
}) {
  const candidate = props.candidate;
  const selected = Boolean(props.selected);
  const selectionLabel = `${selected ? "Désélectionner" : "Sélectionner"} ${candidate.name}`;
  return <Card selected={selected} className={`relative flex min-h-64 flex-col justify-between rounded-2xl border-2 p-4 transition ${props.selectable ? "cursor-pointer hover:border-ui-accent" : ""}`}>
    {props.selectable && <>
      <button type="button" aria-label={selectionLabel} aria-pressed={selected} onClick={props.onToggle} className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]" />
      <span aria-hidden="true" className={`pointer-events-none absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-md border ${selected ? "border-[#d4af37] bg-[#d4af37] text-[#120b07]" : "border-[#45301f] bg-[#0b0704] text-transparent"}`}><Check className="h-4 w-4" /></span>
    </>}
    <div className={`${props.selectable ? "pointer-events-none" : ""} relative z-10`}>
      <div className={`mb-3 flex items-center gap-1.5 ${props.selectable ? "pr-9" : ""}`}><span className="rounded-md border border-[#5c402b]/55 bg-[#2a170a] px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase text-[#caa050]">{candidate.race}</span><span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${candidate.genderTone === "blue" ? "border-blue-900/40 bg-blue-950/40 text-blue-300" : "border-pink-900/40 bg-pink-950/40 text-pink-300"}`}>{candidate.genderSymbol}</span>{candidate.isElite && <span className="rounded border border-amber-700 bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">Élite</span>}</div>
      <div className="mb-3 flex justify-center"><HeroPortrait hero={candidate.portrait} size="xl" noBorder noBg noPadding /></div>
      <label className="pointer-events-auto relative mb-4 block"><span className="sr-only">{props.nameLabel}</span><input type="text" maxLength={20} value={candidate.name} onChange={(event) => props.onRename(event.target.value)} className="w-full border-b border-[#45301f] bg-transparent py-1 pr-6 text-center font-serif text-sm font-bold text-[#fbf7f0] outline-none focus:border-[#d4af37]" /><Edit2 className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-[#ae8650]" /></label>
      <div className="grid grid-cols-2 rounded-xl border border-[#45301f]/30 bg-[#0b0704]/60 p-2 font-mono text-xs">
        <div className="text-center"><span className="block text-[8px] font-bold uppercase text-stone-500">Meilleur</span><strong className="text-[11px] text-emerald-400">▲ {candidate.bestStat.label} ({candidate.bestStat.value})</strong></div>
        <div className="border-l border-[#302216]/40 text-center"><span className="block text-[8px] font-bold uppercase text-stone-500">Faible</span><strong className="text-[11px] text-rose-400">▼ {candidate.weakestStat.label} ({candidate.weakestStat.value})</strong></div>
      </div>
    </div>
    <div className={`${props.selectable ? "pointer-events-none" : ""} relative z-10 mt-4 flex items-center justify-around border-t border-[#302216]/30 pt-3 font-mono text-[10px]`}><span className="text-emerald-400">PV <strong className="text-[#dfdbc7]">{candidate.maxHp}</strong></span><span className="text-sky-400">PM <strong className="text-[#dfdbc7]">{candidate.maxMana}</strong></span></div>
  </Card>;
}
