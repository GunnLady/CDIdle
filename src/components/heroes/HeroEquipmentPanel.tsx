import { useCallback, useRef, useState } from "react";
import type { EquipmentSlot, HeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import Alert from "../../ui/components/Alert";
import Card from "../../ui/components/Card";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import EquipmentDecisionPanel from "./EquipmentDecisionPanel";
import EquipmentItemDetails from "./EquipmentItemDetails";

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
    <Panel title="Équipement" subtitle={props.view?.heroName} testId="hero-equipment-panel">
      {!props.view ? <Alert variant="info" className="text-center">Aucun héros sélectionné.</Alert> : <div className="space-y-2">
        {props.view.slots.map((slot) => <Card key={slot.key}>
            <div className="flex items-center justify-between gap-2"><div className="min-w-0"><span className="text-[9px] uppercase tracking-wider text-[#8f7a67]">{slot.icon} {slot.label}</span>{slot.blocked ? <p className="mt-1 text-[10px] text-red-400">{slot.blockReason}</p> : slot.item ? <div className="mt-1"><EquipmentItemDetails item={slot.item} /></div> : <p className="mt-1 text-[10px] italic text-[#756353]">Emplacement vide</p>}</div>
              {!slot.blocked && <div className="flex shrink-0 self-stretch flex-col justify-center gap-1"><Button type="button" size="sm" disabled={!props.canMutate || !props.onEquipItem} onClick={(event) => { returnFocusRef.current = event.currentTarget; setActiveSlot(slot.key); }}>{slot.item ? "Changer" : "Équiper"}</Button>{slot.item && props.onUnequipItem && <Button type="button" size="sm" variant="danger" disabled={!props.canMutate} onClick={() => props.onUnequipItem?.(props.view!.heroId, slot.key)}>Retirer</Button>}</div>}
            </div>
          </Card>)}
        {props.onOpenStorage && <Button type="button" block onClick={props.onOpenStorage}>Ouvrir le Coffre</Button>}
      </div>}
    </Panel>

    {props.view && activeSlot && selectedSlot && <EquipmentDecisionPanel heroName={props.view.heroName} slot={selectedSlot} canMutate={props.canMutate} onClose={closeDecision} onEquip={(instanceId) => { props.onEquipItem?.(props.view!.heroId, instanceId); closeDecision(); }} />}
  </>;
}
