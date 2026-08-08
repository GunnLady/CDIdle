import { useState } from "react";
import { createRoot } from "react-dom/client";
import HeroesPage from "../../../src/components/heroes/HeroesPage";
import { makeHero } from "../../fixtures/game";
import "../../../src/index.css";

const readOnly = new URLSearchParams(window.location.search).get("readonly") === "1";

function Harness() {
  const [mutationCount, setMutationCount] = useState(0);
  const recordMutation = () => setMutationCount((count) => count + 1);
  const heroes = [
    makeHero({ id: "ariane", name: "Ariane", isActive: true, activeSkills: ["heavy_blow"], passiveSkills: ["survival_instinct"] }),
    makeHero({ id: "borin", name: "Borin", isActive: false, status: "resting", currentHp: 16 }),
    makeHero({ id: "celia", name: "Célia", isActive: false, status: "resting", currentHp: 0 }),
  ];

  return <main className="mx-auto w-full max-w-[1440px] p-3 sm:p-6">
    <output data-testid="mutation-count" className="sr-only">{mutationCount}</output>
    <HeroesPage
      heroes={heroes}
      resources={{ gold: 1_000, food: 100, wood: 100, stone: 100, ore: 100 }}
      buildings={{ guilde: 2 }}
      storedItems={[{ instanceId: "stored-sword", itemId: "starter_sword", rarity: "common" }]}
      activeDungeonFloor={3}
      activeDungeonRoom={4}
      canMutate={!readOnly}
      onDismissHero={recordMutation}
      onToggleHeroActive={recordMutation}
      onRecruitHero={recordMutation}
      onUnequipItem={recordMutation}
      onEquipItem={recordMutation}
    />
  </main>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
