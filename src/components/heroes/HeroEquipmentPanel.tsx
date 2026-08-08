import { useCallback, useRef, useState } from "react";
import type { EquipmentSlot, HeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import EquipmentDecisionPanel from "./EquipmentDecisionPanel";
import EquipmentItemDetails from "./EquipmentItemDetails";
import HeroPanelFrame from "./HeroPanelFrame";

export default function HeroEquipmentPanel(props: {
  view: HeroEquipmentView | null;
  canMutate: boolean;
  onUnequipItem?: (heroId: string, slot: EquipmentSlot) => void;
  onEquipItem?: (heroId: string, instanceId: string) => void;
  onOpenStorage?: () => void;
}) {
  const [activeSlot, setActiveSlot] = useState<EquipmentSlot | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const selectedSlot = props.view?.slots.find((slot) => slot.key === activeSlot);
  const closeDecision = useCallback(() => {
    setActiveSlot(null);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  return <>
    <HeroPanelFrame title="Équipement" subtitle={props.view?.heroName} testId="hero-equipment-panel">
      {!props.view ? <p className="text-center text-xs text-[#8f7a67]">Aucun héros sélectionné.</p> : <div className="space-y-2">
        {props.view.slots.map((slot) => <article key={slot.key} className="rounded-lg border border-[#3a281a] bg-[#120b07] p-3">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><span className="text-[9px] uppercase tracking-wider text-[#8f7a67]">{slot.icon} {slot.label}</span>{slot.blocked ? <p className="mt-1 text-[10px] text-red-400">{slot.blockReason}</p> : slot.item ? <div className="mt-1"><EquipmentItemDetails item={slot.item} /></div> : <p className="mt-1 text-[10px] italic text-[#756353]">Emplacement vide</p>}</div>
              {!slot.blocked && <div className="flex shrink-0 flex-col gap-1">{slot.item && props.onUnequipItem && <button type="button" disabled={!props.canMutate} onClick={() => props.onUnequipItem?.(props.view!.heroId, slot.key)} className="min-h-11 rounded border border-red-900/50 px-2 text-[9px] text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:opacity-35">Retirer</button>}<button type="button" disabled={!props.canMutate || !props.onEquipItem} onClick={(event) => { returnFocusRef.current = event.currentTarget; setActiveSlot(slot.key); }} className="min-h-11 rounded border border-[#6e4b2b] px-2 text-[9px] text-[#caa050] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:opacity-35">{slot.item ? "Changer" : "Équiper"}</button></div>}
            </div>
          </article>)}
        {props.onOpenStorage && <button type="button" onClick={props.onOpenStorage} className="min-h-11 w-full rounded-lg border border-[#5c402b] text-[10px] text-[#caa050] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">Ouvrir le Coffre</button>}
      </div>}
    </HeroPanelFrame>

    {props.view && activeSlot && selectedSlot && <EquipmentDecisionPanel heroName={props.view.heroName} slot={selectedSlot} canMutate={props.canMutate} onClose={closeDecision} onEquip={(instanceId) => { props.onEquipItem?.(props.view!.heroId, instanceId); closeDecision(); }} />}
  </>;
}
