import { useState } from "react";
import { createRoot } from "react-dom/client";
import DungeonPage from "../../../src/components/dungeon/DungeonPage";
import type { Hero } from "../../../src/types";
import { makeHero } from "../../fixtures/game";
import "../../../src/index.css";

const readOnly = new URLSearchParams(window.location.search).get("readonly") === "1";

function Harness() {
  const [mutationCount, setMutationCount] = useState(0);
  const [heroes, setHeroes] = useState<Hero[]>([
    makeHero({ id: "ariane", name: "Ariane", isActive: true, currentMana: 7 }),
    makeHero({ id: "borin", name: "Borin", isActive: false, currentHp: 16 }),
    makeHero({ id: "celia", name: "Célia", isActive: false, currentHp: 0 }),
  ]);
  const recordMutation = () => setMutationCount((count) => count + 1);
  const toggleHero = (heroId: string) => {
    recordMutation();
    setHeroes((current) => current.map((hero) => hero.id === heroId ? { ...hero, isActive: !hero.isActive } : hero));
  };

  return <main className="mx-auto w-full max-w-[1440px] p-3 sm:p-6">
    <output data-testid="mutation-count" className="sr-only">{mutationCount}</output>
    <DungeonPage
      heroes={heroes}
      activeDungeonFloor={3}
      activeDungeonRoom={4}
      autoExplore={false}
      battleLogs={[{ id: "colony", timestamp: "10:00", message: "Récolte terminée", type: "info", category: "colony" }]}
      highestFloorReached={4}
      canMutate={!readOnly}
      onToggleAutoExplore={recordMutation}
      activeEncounter={null}
      encounterHistory={[{
        encounterId: "encounter-harness",
        kind: "fight",
        floor: 3,
        room: 3,
        outcome: "victory",
        roundCount: 2,
        enemy: { name: "Rat des cryptes", hp: 0, maxHp: 18 },
        transcript: [{ sequence: 0, type: "hero.hit", message: "Ariane terrasse le rat." }],
        rewards: { gold: 8, loot: [] },
      }]}
      encounterPlayback={null}
      isExploring={false}
      onExplore={recordMutation}
      onChangeFloor={recordMutation}
      onRetreatParty={recordMutation}
      onClearBattleLogs={recordMutation}
      onResetLevel={recordMutation}
      onToggleHeroActive={toggleHero}
    />
  </main>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
