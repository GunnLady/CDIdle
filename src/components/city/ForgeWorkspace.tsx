import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import type { ItemBlueprint, StoredForgeMaterialStack } from "../../types";
import type { BasicForgeUpgradeProc } from "../../utils/gameCalculations";
import { createForgeWorkspaceView } from "../../domain/forgePresentation";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import Checkbox from "../../ui/primitives/Checkbox";
import Select from "../../ui/primitives/Select";

interface ForgeWorkspaceProps {
  canMutate: boolean; materials: StoredForgeMaterialStack[]; blueprints: ItemBlueprint[];
  pending?: { previewId: string; itemId: string; upgradeProc?: BasicForgeUpgradeProc } | null;
  onStart: (recipeId: string) => void; onFinalize: (previewId: string, acceptUpgrade: boolean, chosenModifierStat?: string) => void; onCancel: (previewId: string) => void;
}

export default function ForgeWorkspace(props: ForgeWorkspaceProps) {
  const [selectedId, setSelectedId] = useState("starter_sword");
  const [acceptUpgrade, setAcceptUpgrade] = useState(false);
  const [modifier, setModifier] = useState<string>();
  useEffect(() => { setAcceptUpgrade(false); setModifier(undefined); }, [props.pending?.previewId]);
  const view = useMemo(() => createForgeWorkspaceView({
    materials: props.materials,
    blueprints: props.blueprints,
    selectedRecipeId: selectedId,
    pending: props.pending,
  }), [props.materials, props.blueprints, props.pending, selectedId]);

  return (
    <Panel
      title="Bâtiment sélectionné"
      subtitle="Forge rustique"
      testId="selected-building-panel"
      className="order-1 xl:col-start-1 xl:row-start-1"
      contentClassName="space-y-4"
    >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-bold tracking-widest text-[#caa050] uppercase font-serif">Enclume &amp; fourneaux</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {view.materials.map((material) => (
              <div key={material.id} className="p-2 rounded-lg border border-[#3e2b1f] bg-[#110a06]">
                <span className="block text-[10px] uppercase text-[#a89078]">{material.name}</span>
                <strong className="text-[#dfdbc7]">{material.count}</strong>
              </div>
            ))}
          </div>
          {!props.pending ? (
            <div className="space-y-3">
              <Select
                label="Plan d’artisanat"
                value={view.selectedRecipe?.id ?? ""}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {view.recipes.map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.unlocked}>
                    {item.name}{item.unlocked ? "" : " · verrouillé"}
                  </option>
                ))}
              </Select>
              <p className="text-[10px] text-[#a89078]">Qualité de départ : {view.selectedRecipe?.rarityLabel ?? "—"}</p>
              <p className="text-xs text-[#a89078]">{view.selectedRecipe?.description}</p>
              {view.selectedRecipe && view.selectedRecipe.weaponDetails.length > 0 && <div className="text-[10px] font-mono space-y-1">
                {view.selectedRecipe.weaponDetails.map((detail) => <p key={detail}>{detail}</p>)}
              </div>}
              {view.selectedRecipe && view.selectedRecipe.modifierLines.length > 0 && (
                <div className="text-[10px] font-mono text-[#caa050]">
                  {view.selectedRecipe.modifierLines.map((line) => <p key={line}>{line}</p>)}
                </div>
              )}
              <div className="text-[10px] font-mono text-[#a89078]">Coût : {view.baseCostLabel}</div>
              <Button
                type="button"
                variant="primary"
                block
                disabled={!props.canMutate || !view.baseAffordable || !view.selectedRecipe?.unlocked}
                onClick={() => view.selectedRecipe?.unlocked && props.onStart(view.selectedRecipe.id)}
              >
                ⚒️ Forger
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#1c140e] border border-[#caa050]/40">
                <strong className="text-[#dfdbc7]">{view.pending?.itemName}</strong>
                <p className="text-[10px] text-[#a89078]">Qualité : {view.pending?.rarityLabel}</p>
              </div>
              {view.pending && view.pending.upgradeProc !== "none" && (
                <>
                  <Checkbox
                    label="Accepter l’amélioration"
                    checked={acceptUpgrade}
                    disabled={!props.canMutate || !view.pending.upgradeAffordable}
                    onChange={(event) => {
                      setAcceptUpgrade(event.target.checked);
                      if (event.target.checked) setModifier((value) => value ?? view.pending?.modifierOptions[0]?.stat);
                    }}
                  />
                  {acceptUpgrade && (
                    <Select
                      label="Modificateur d’infusion"
                      value={modifier ?? ""}
                      onChange={(event) => setModifier(event.target.value)}
                    >
                      {view.pending.modifierOptions.map((entry) => <option key={entry.stat} value={entry.stat}>{entry.label}</option>)}
                    </Select>
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="danger" block disabled={!props.canMutate} onClick={() => view.pending && props.onCancel(view.pending.previewId)}>Abandonner</Button>
                <Button type="button" variant="primary" block disabled={!props.canMutate || (acceptUpgrade && !modifier)} onClick={() => view.pending && props.onFinalize(view.pending.previewId, acceptUpgrade, acceptUpgrade ? modifier : undefined)}>Finaliser</Button>
              </div>
            </div>
          )}
    </Panel>
  );
}
