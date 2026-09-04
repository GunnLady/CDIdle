import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import type { ItemBlueprint, Rarity, StoredForgeMaterialStack } from "../../types";
import { createForgeWorkspaceView } from "../../domain/forgePresentation";
import type { CityBuildingView } from "../../domain/cityPresentation";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";
import Checkbox from "../../ui/primitives/Checkbox";
import Select from "../../ui/primitives/Select";

interface ForgeWorkspaceProps {
  canMutate: boolean; materials: StoredForgeMaterialStack[]; blueprints: ItemBlueprint[];
  forgeLevel: number;
  building: CityBuildingView;
  pending?: { previewId: string; itemId: string; itemLevel?: number; offeredRarity: Rarity } | null;
  onUpgrade: (id: string) => void; onStart: (recipeId: string, levelBandMin?: number) => void; onFinalize: (previewId: string, acceptUpgrade: boolean, chosenModifierStat?: string) => void; onCancel: (previewId: string) => void;
}

export default function ForgeWorkspace(props: ForgeWorkspaceProps) {
  const [selectedId, setSelectedId] = useState("progression_sword");
  const [selectedLevelBandMin, setSelectedLevelBandMin] = useState(1);
  const [acceptUpgrade, setAcceptUpgrade] = useState(false);
  const [modifier, setModifier] = useState<string>();
  useEffect(() => { setAcceptUpgrade(false); setModifier(undefined); }, [props.pending?.previewId]);
  const view = useMemo(() => createForgeWorkspaceView({
    materials: props.materials,
    blueprints: props.blueprints,
    selectedRecipeId: selectedId,
    selectedLevelBandMin,
    forgeLevel: props.forgeLevel,
    pending: props.pending,
  }), [props.materials, props.blueprints, props.pending, props.forgeLevel, selectedId, selectedLevelBandMin]);

  return (
    <Panel
      title="Bâtiment sélectionné"
      subtitle="Forge rustique"
      testId="selected-building-panel"
      className="order-1"
      contentClassName="space-y-4"
    >
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#3e2b1f] bg-[#110a06] p-3">
            <div>
              <strong className="text-[#dfdbc7]">Forge {props.building.level}/{props.building.maxLevel}</strong>
              <p className="text-[10px] text-[#a89078]">Tranche ouverte : niveaux {view.progression.openedRangeLabel}</p>
              {view.progression.nextRangeLabel && <p className="text-[10px] text-[#a89078]">Prochaine : niveaux {view.progression.nextRangeLabel} · étage {view.progression.nextRequiredFloor}</p>}
              {!props.building.atMaxLevel && !props.building.upgradeUnlocked && <p className="text-[10px] text-[#a89078]">Requis : {props.building.prerequisite}</p>}
              {!props.building.atMaxLevel && <p className="text-[10px] text-[#a89078]">Coût : {props.building.costLabel}</p>}
            </div>
            {!props.building.atMaxLevel && props.building.upgradeUnlocked && <Button type="button" variant="secondary" disabled={!props.canMutate || !props.building.affordable} onClick={() => props.onUpgrade(props.building.id)}>Améliorer</Button>}
          </div>
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
              <p className="text-[10px] text-[#a89078]">Plage disponible : {view.selectedRecipe?.levelRangeLabel ?? '—'}</p>
              {view.selectedRecipe?.powerModelId === 'level-bands-v1' && (
                <Select
                  label="Tranche de niveau"
                  value={String(view.selectedLevelBandMin)}
                  onChange={(event) => setSelectedLevelBandMin(Number(event.target.value))}
                >
                  {view.selectedRecipe.availableLevelBands.map((start) => (
                    <option key={start} value={start}>Niveaux {start}–{start + 4}</option>
                  ))}
                </Select>
              )}
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
                onClick={() => view.selectedRecipe?.unlocked && props.onStart(
                  view.selectedRecipe.id,
                  view.selectedRecipe.powerModelId === 'level-bands-v1' ? view.selectedLevelBandMin : undefined,
                )}
              >
                ⚒️ Forger
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#1c140e] border border-[#caa050]/40">
                <strong className="text-[#dfdbc7]">{view.pending?.itemName}</strong>
                <p className="text-[10px] text-[#a89078]">Niveau d’objet : {view.pending?.itemLevel}</p>
                <p className="text-[10px] text-[#a89078]">Qualité : {view.pending?.rarityLabel}</p>
              </div>
              {view.pending?.upgradeAvailable && (
                <>
                  <Checkbox
                    label={`Accepter l’amélioration · ${view.pending.upgradeCostLabel}`}
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
