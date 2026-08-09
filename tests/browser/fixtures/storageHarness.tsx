import { useState } from "react";
import { createRoot } from "react-dom/client";
import StoragePage from "../../../src/components/storage/StoragePage";
import { makeHero } from "../../fixtures/game";
import "../../../src/index.css";

const readOnly = new URLSearchParams(window.location.search).get("readonly") === "1";
const storedItems = [
  { instanceId: "sword", itemId: "starter_sword", rarity: "common" as const },
  { instanceId: "dagger", itemId: "quick_dagger", rarity: "uncommon" as const },
  { instanceId: "axe", itemId: "woodcutter_axe", rarity: "rare" as const },
  { instanceId: "shield", itemId: "wooden_shield", rarity: "common" as const },
  { instanceId: "clothes", itemId: "traveler_clothes", rarity: "common" as const },
  { instanceId: "leather", itemId: "simple_leather_armor", rarity: "uncommon" as const },
  { instanceId: "robe", itemId: "novice_mystic_robe", rarity: "rare" as const },
  { instanceId: "lute", itemId: "basic_lute", rarity: "epic" as const },
];

function Harness() {
  const [mutationCount, setMutationCount] = useState(0);
  const recordMutation = () => setMutationCount((count) => count + 1);
  const heroes = [
    makeHero({ id: "ariane", name: "Ariane", level: 20 }),
    makeHero({ id: "borin", name: "Borin", level: 1, isActive: false }),
  ];
  return <main className="mx-auto w-full max-w-[1440px] p-3 sm:p-6">
    <output data-testid="mutation-count" className="sr-only">{mutationCount}</output>
    <StoragePage storedItems={storedItems} heroes={heroes} isForgeUnlocked forgeMaterials={[]} canMutate={!readOnly} onEquipItem={recordMutation} onScrapItem={recordMutation} />
  </main>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
