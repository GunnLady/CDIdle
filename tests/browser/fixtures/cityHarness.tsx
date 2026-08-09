import { useState } from "react";
import { createRoot } from "react-dom/client";
import CityDashboard from "../../../src/components/city/CityDashboard";
import "../../../src/index.css";

const params = new URLSearchParams(window.location.search);
const readOnly = params.get("readonly") === "1";
const forgeLevel = params.get("forge") === "0" ? 0 : 1;

function Harness() {
  const [mutationCount, setMutationCount] = useState(0);
  const recordMutation = () => setMutationCount((count) => count + 1);

  return <main className="mx-auto w-full max-w-[1440px] p-3 sm:p-6">
    <output data-testid="mutation-count" className="sr-only">{mutationCount}</output>
    <CityDashboard
      resources={{ gold: 100_000, food: 100_000, wood: 100_000, stone: 100_000, ore: 100_000 }}
      buildings={{
        habitation: 1, ferme: 1, scierie: 1, carriere: 1, mine: 1, maison_chef: 1, guilde: 1,
        caserne: 1, temple: 1, academie: 1, cercle: 1, lair: 1, poste_chasse: 1, forge: forgeLevel,
      }}
      citizens={{ farmers: 0, woodcutters: 0, quarrymen: 0, miners: 0, unassigned: 3 }}
      totalCitizensCount={3}
      citizenGrowthProgress={50}
      highestFloorReached={3}
      canMutate={!readOnly}
      forgeMaterials={[
        { materialId: "metal_scrap", rarity: "common", count: 6 },
        { materialId: "refined_metal", rarity: "uncommon", count: 2 },
      ]}
      itemBlueprints={[{ itemId: "starter_sword", unlocked: true }]}
      battleLogs={[
        { id: "colony", timestamp: "10:00", message: "La scierie produit du bois.", type: "info", category: "colony" },
        { id: "dungeon", timestamp: "10:01", message: "Le groupe terrasse un squelette.", type: "victory", category: "dungeon" },
      ]}
      onClearCityLogs={recordMutation}
      onUpgradeBuilding={recordMutation}
      onAllocateCitizen={recordMutation}
      onStartForge={recordMutation}
      onFinalizeForge={recordMutation}
      onCancelForge={recordMutation}
    />
  </main>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
