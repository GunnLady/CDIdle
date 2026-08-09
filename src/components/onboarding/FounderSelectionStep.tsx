import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import type { Hero } from "../../types";
import {
  createFounderCandidateView,
  createStartingFounderChoices,
  STARTING_FOUNDER_COUNT,
  toggleStartingFounder,
  type StartingFounderChoice,
} from "../../domain/onboardingPresentation";
import EntryScreenFrame from "./EntryScreenFrame";
import FounderCandidateCard from "./FounderCandidateCard";
import OnboardingAccessNotice from "./OnboardingAccessNotice";

export default function FounderSelectionStep(props: {
  cityName: string;
  candidates: Hero[];
  canMutate: boolean;
  blockReason?: string;
  controlTransferPending?: boolean;
  onRequestControl?: () => void;
  onConfirm: (founders: StartingFounderChoice[]) => Promise<boolean>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validIds = new Set(props.candidates.map((hero) => hero.id));
    setSelectedIds((current) => current.filter((id) => validIds.has(id)));
    setEditedNames((current) => Object.fromEntries(props.candidates.map((hero) => [hero.id, current[hero.id] ?? hero.name])));
  }, [props.candidates]);

  const views = useMemo(() => props.candidates.map((hero) => (
    createFounderCandidateView(hero, editedNames[hero.id] ?? hero.name)
  )), [editedNames, props.candidates]);
  const choices = createStartingFounderChoices(props.candidates, selectedIds, editedNames);
  const invalidName = choices.some((choice) => !choice.name);
  const ready = selectedIds.length === STARTING_FOUNDER_COUNT && !invalidName;

  const confirm = async () => {
    if (!ready) {
      setError(`Sélectionnez exactement ${STARTING_FOUNDER_COUNT} novices et donnez-leur un nom.`);
      return;
    }
    if (!props.canMutate) return;
    setPending(true);
    setError(null);
    try {
      if (!await props.onConfirm(choices)) {
        setError("Impossible de fonder la cité et d’établir l’escouade. Veuillez réessayer.");
      }
    } catch {
      setError("Impossible de fonder la cité et d’établir l’escouade. Veuillez réessayer.");
    } finally {
      setPending(false);
    }
  };

  return <EntryScreenFrame testId="founder-selection-step" wide>
    <div className="text-center">
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8c5a2b]">Fondation · 2/2</span>
      <div className="mx-auto my-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#d4af37] bg-gradient-to-br from-[#ae8650] via-[#86592e] to-[#462d16]"><Sparkles className="h-7 w-7 text-[#fdf9f2]" /></div>
      <h1 className="font-serif text-xl font-extrabold uppercase tracking-wider text-[#d4af37] sm:text-2xl">Choisissez vos Fondateurs</h1>
      <p className="mx-auto mt-2 max-w-2xl font-serif text-xs leading-relaxed text-[#a89078]">Sélectionnez exactement deux novices pour établir la première escouade de <strong className="text-[#fdf9f2]">{props.cityName}</strong>.</p>
    </div>
    <div className="mx-auto mt-4 max-w-lg"><OnboardingAccessNotice error={error} message={!props.canMutate ? props.blockReason : undefined} controlTransferPending={props.controlTransferPending} onRequestControl={props.onRequestControl} /></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {views.map((candidate) => <div key={candidate.id}><FounderCandidateCard candidate={candidate} selected={selectedIds.includes(candidate.id)} onToggle={() => { setSelectedIds((current) => toggleStartingFounder(current, candidate.id)); setError(null); }} onRename={(name) => setEditedNames((current) => ({ ...current, [candidate.id]: name }))} /></div>)}
    </div>
    <div className="mx-auto mt-6 w-full max-w-sm">
      <button type="button" onClick={() => { void confirm(); }} disabled={!props.canMutate || pending || !ready} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#d4af37] bg-gradient-to-r from-[#8c5a2b] to-[#b3844a] px-4 py-3 text-sm font-bold text-[#fbf7f0] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Création du fief…" : <><span>Fonder la Cité et commencer</span><ChevronRight className="h-4 w-4" /></>}</button>
      <p className="mt-3 text-center font-mono text-[10px] text-stone-500">Sélectionné : {selectedIds.length} / {STARTING_FOUNDER_COUNT}</p>
    </div>
  </EntryScreenFrame>;
}
