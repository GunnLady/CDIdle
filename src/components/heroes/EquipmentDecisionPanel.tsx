import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { EquipmentSlotView } from "../../domain/heroEquipmentPresentation";
import EquipmentChangeSummary from "./EquipmentChangeSummary";

export default function EquipmentDecisionPanel(props: {
  heroName: string;
  slot: EquipmentSlotView;
  canMutate: boolean;
  onEquip: (instanceId: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const { onClose } = props;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}>
    <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="equipment-dialog-title" className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-[#8b632d] bg-[#17100b] shadow-2xl focus:outline-none">
      <header className="flex items-center justify-between border-b border-[#3a281a] p-4"><div><h3 id="equipment-dialog-title" className="font-serif text-sm font-bold text-[#eadabc]">Équiper {props.heroName}</h3><p className="text-[10px] text-[#caa050]">{props.slot.icon} {props.slot.label}</p></div><button type="button" aria-label="Fermer la sélection d’équipement" onClick={props.onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]"><X className="h-5 w-5" /></button></header>
      <div className="max-h-[65vh] space-y-3 overflow-y-auto p-4">
        {props.slot.candidates.length === 0 ? <p className="rounded-lg border border-dashed border-[#4a321f] p-8 text-center text-xs text-[#8f7a67]">Aucun objet compatible dans le Coffre.</p> : props.slot.candidates.map((candidate) => <article key={candidate.instanceId} className="rounded-lg border border-[#3a281a] bg-[#120b07] p-3">
          <EquipmentChangeSummary currentItem={props.slot.item} candidate={candidate} />
          <button type="button" disabled={!props.canMutate || candidate.levelBlocked} title={candidate.levelBlocked ? `Niveau ${candidate.requiredLevel} requis` : undefined} onClick={() => props.onEquip(candidate.instanceId)} className="mt-3 min-h-11 w-full rounded-lg bg-[#8c5a2b] px-3 text-[10px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:bg-[#2b1d13] disabled:text-[#756353]">{candidate.levelBlocked ? "Niveau insuffisant" : candidate.displacedItems.length > 0 ? "Remplacer" : "Équiper"}</button>
        </article>)}
      </div>
    </section>
  </div>;
}
