import { useEffect, useRef } from "react";
import type { Hero } from "../../types";
import { createRecruitmentOfferView } from "../../domain/recruitmentPresentation";

export interface RecruitmentOfferDialogProps {
  candidate: Hero;
  editedName: string;
  heroCount: number;
  pending: boolean;
  readOnly: boolean;
  blockReason?: string;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RecruitmentOfferDialog({
  candidate,
  editedName,
  heroCount,
  pending,
  readOnly,
  blockReason,
  onNameChange,
  onConfirm,
  onCancel,
}: RecruitmentOfferDialogProps) {
  const offer = createRecruitmentOfferView(candidate, heroCount, editedName);
  const commandsDisabled = pending || readOnly;
  const confirmDisabled = commandsDisabled || editedName.trim().length === 0;
  const dialogRef = useRef<HTMLElement>(null);
  const cancelRef = useRef(onCancel);
  const commandsDisabledRef = useRef(commandsDisabled);

  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    commandsDisabledRef.current = commandsDisabled;
  }, [commandsDisabled]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>(focusableSelector)];
    (focusable()[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (commandsDisabledRef.current) return;
        event.preventDefault();
        cancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (controls.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  return <div className="fixed inset-0 z-50 flex select-none items-center justify-center overflow-y-auto bg-black/85 p-4 font-sans backdrop-blur-xs">
    <section
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recruitment-offer-title"
      aria-describedby="recruitment-offer-description"
      className="relative max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border-2 border-[#d4af37] bg-[#160f0a] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.95)] focus:outline-none"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#926430]/5 blur-2xl" />

      <header className="mb-5 text-center">
        <div aria-hidden="true" className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#d4af37] bg-gradient-to-br from-[#ae8650] via-[#86592e] to-[#462d16] text-xl shadow-md">🤝</div>
        <h3 id="recruitment-offer-title" className="line-clamp-1 font-serif text-lg font-bold uppercase tracking-wider text-[#d4af37]">Nouveau Pacte de Recrutement</h3>
        <p id="recruitment-offer-description" className="mt-0.5 font-serif text-[11px] text-[#a89078]">Ajustez le prénom de ce candidat avant de sceller le contrat d'embauche.</p>
      </header>

      <label className="mb-4 block">
        <span className="mb-1.5 block font-mono text-[9px] font-extrabold uppercase tracking-widest text-[#8c5a2b]">Prénom de l'aventurier</span>
        <input
          type="text"
          value={editedName}
          onChange={(event) => onNameChange(event.target.value)}
          className="w-full rounded-xl border-2 border-[#45301f] bg-[#0f0a06] px-3.5 py-2 font-serif text-sm font-bold text-[#fbf7f0] focus:border-[#d4af37] focus:outline-none"
          maxLength={20}
        />
      </label>

      <dl className="mb-5 space-y-3 rounded-2xl border border-[#45301f] bg-[#0b0704] p-4 font-mono text-xs text-[#a89078]">
        <div className="flex items-center justify-between border-b border-[#302216]/40 pb-2"><dt className="text-[9px] font-bold uppercase tracking-wider text-[#8c5a2b]">Sexe / Genre :</dt><dd className="font-extrabold text-[#dfdbc7]">{offer.genderText}</dd></div>
        <div className="flex items-center justify-between border-b border-[#302216]/40 pb-2"><dt className="text-[9px] font-bold uppercase tracking-wider text-[#8c5a2b]">Meilleur Attribut :</dt><dd className="font-extrabold text-emerald-400">{offer.bestStat.label} ({offer.bestStat.value})</dd></div>
        <div className="flex items-center justify-between border-b border-[#302216]/40 pb-2"><dt className="text-[9px] font-bold uppercase tracking-wider text-[#8c5a2b]">Attribut Faible :</dt><dd className="font-extrabold text-red-400">{offer.weakestStat.label} ({offer.weakestStat.value})</dd></div>
        <div className="grid grid-cols-2 gap-4 pt-1 text-center">
          <div className="rounded-xl border border-[#3e2c1c] bg-[#1a110a] py-2"><dt className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-[#a89078]">PV Max</dt><dd className="text-xs font-bold text-emerald-400">{offer.maxHp} HP</dd></div>
          <div className="rounded-xl border border-[#3e2c1c] bg-[#1a110a] py-2"><dt className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-[#a89078]">PM Max</dt><dd className="text-xs font-bold text-sky-400">{offer.maxMana} PM</dd></div>
        </div>
      </dl>

      {readOnly && blockReason && <p role="status" className="mb-3 text-center text-xs text-amber-300">{blockReason}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={commandsDisabled} className="flex-1 cursor-pointer rounded-xl border border-[#5c402b]/70 bg-[#231710] px-4 py-2.5 text-center font-serif text-xs font-bold text-[#a89078] transition hover:bg-[#342217] disabled:cursor-not-allowed disabled:opacity-50">Décliner l'Offre</button>
        <button type="button" onClick={onConfirm} disabled={confirmDisabled} className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-[#d4af37] bg-[#8c5a2b] px-4 py-2.5 text-center font-serif text-xs font-bold text-[#fdf9f2] shadow-[0_4px_12px_rgba(140,90,43,0.3)] transition hover:bg-[#b0773f] disabled:cursor-not-allowed disabled:opacity-70">
          {pending ? "CONFIRMATION…" : `SCELLER (🪙 ${offer.cost.toLocaleString("fr-FR")})`}
        </button>
      </div>
    </section>
  </div>;
}
