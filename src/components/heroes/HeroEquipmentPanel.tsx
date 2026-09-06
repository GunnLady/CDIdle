import type { EquipmentSlot, HeroEquipmentView } from "../../domain/heroEquipmentPresentation";
import Alert from "../../ui/components/Alert";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import EquipmentItemDetails from "./EquipmentItemDetails";
import HeroDetailFrame from "./HeroDetailFrame";

export default function HeroEquipmentPanel(props: {
  view: HeroEquipmentView | null;
  canMutate: boolean;
  onUnequipItem?: (heroId: string, slot: EquipmentSlot) => void;
  onOpenStorage?: () => void;
}) {
  return <Panel title="Équipement" subtitle={props.view?.heroName} testId="hero-equipment-panel" typography="large">
    {!props.view ? <Alert variant="info" className="text-center">Aucun héros sélectionné.</Alert> : <div className="space-y-2">
      {props.view.slots.map((slot) => <div key={slot.key}>
        <HeroDetailFrame>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-[#8f7a67]">{slot.icon} {slot.label}</span>
              {slot.blocked ? <p className="mt-1 text-[11px] text-red-400">{slot.blockReason}</p> : slot.item ? <div className="mt-1"><EquipmentItemDetails item={slot.item} /></div> : <p className="mt-1 text-[11px] italic text-[#756353]">Emplacement vide</p>}
            </div>
            {slot.item && props.onUnequipItem && <Button type="button" size="xs" variant="danger" disabled={!props.canMutate} onClick={() => props.onUnequipItem?.(props.view!.heroId, slot.key)}>Retirer</Button>}
          </div>
        </HeroDetailFrame>
      </div>)}
      {props.onOpenStorage && <div className="flex justify-end pt-2"><Button type="button" variant="primary" onClick={props.onOpenStorage}>Gérer dans le Coffre</Button></div>}
    </div>}
  </Panel>;
}
