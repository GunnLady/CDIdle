import { useEffect, useMemo, useState } from "react";
import type { BattleLogEntry, CitizenAllocation, ItemBlueprint, Resources, StoredForgeMaterialStack } from "../../types";
import type { BasicForgeUpgradeProc } from "../../utils/gameCalculations";
import { createCityDashboardView, createCityHistoryView } from "../../domain/cityPresentation";
import AssignmentPanel from "./AssignmentPanel";
import BuildingListPanel from "./BuildingListPanel";
import ForgeWorkspace from "./ForgeWorkspace";
import SelectedBuildingPanel from "./SelectedBuildingPanel";
import CityHistoryPanel from "./CityHistoryPanel";

interface CityDashboardProps {
  resources: Resources; buildings: Record<string, number>; citizens: CitizenAllocation; totalCitizensCount: number;
  citizenGrowthProgress: number; highestFloorReached: number; canMutate: boolean;
  forgeMaterials: StoredForgeMaterialStack[]; itemBlueprints: ItemBlueprint[];
  battleLogs?: BattleLogEntry[]; onClearCityLogs?: () => void;
  pendingForge?: { previewId: string; itemId: string; upgradeProc?: BasicForgeUpgradeProc } | null;
  onUpgradeBuilding: (id: string) => void; onAllocateCitizen: (role: keyof Omit<CitizenAllocation, "unassigned">, amount: number) => void;
  onStartForge: (recipeId: string) => void; onFinalizeForge: (previewId: string, acceptUpgrade: boolean, chosenModifierStat?: string) => void; onCancelForge: (previewId: string) => void;
}

export default function CityDashboard(props: CityDashboardProps) {
  const view = useMemo(() => createCityDashboardView({ resources: props.resources, buildings: props.buildings, citizens: props.citizens, totalCitizens: props.totalCitizensCount, citizenGrowthProgress: props.citizenGrowthProgress, highestFloorReached: props.highestFloorReached }), [props.resources, props.buildings, props.citizens, props.totalCitizensCount, props.citizenGrowthProgress, props.highestFloorReached]);
  const history = useMemo(() => createCityHistoryView(props.battleLogs ?? []), [props.battleLogs]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("habitation");
  useEffect(() => { if (props.pendingForge) setSelectedBuildingId("forge"); }, [props.pendingForge]);
  const selected = view.buildings.find((building) => building.id === selectedBuildingId) ?? view.buildings[0];
  useEffect(() => { if (selected && selected.id !== selectedBuildingId) setSelectedBuildingId(selected.id); }, [selected, selectedBuildingId]);
  if (!selected) return null;
  return <section aria-labelledby="city-page-title" className="space-y-6 animate-fade-in motion-reduce:animate-none">
    <h2 id="city-page-title" className="sr-only">Cité</h2>
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start xl:items-stretch">
      {selected.id === "forge" && selected.level > 0 ? <ForgeWorkspace canMutate={props.canMutate} materials={props.forgeMaterials} blueprints={props.itemBlueprints} pending={props.pendingForge} onStart={props.onStartForge} onFinalize={props.onFinalizeForge} onCancel={props.onCancelForge} /> : <SelectedBuildingPanel building={selected} canMutate={props.canMutate} onUpgrade={props.onUpgradeBuilding} />}
      <BuildingListPanel buildings={view.buildings} selectedId={selected.id} onSelect={setSelectedBuildingId} />
      <AssignmentPanel view={view} canMutate={props.canMutate} onAllocate={props.onAllocateCitizen} />
    </div>
    <CityHistoryPanel view={history} onClear={props.onClearCityLogs} />
  </section>;
}
