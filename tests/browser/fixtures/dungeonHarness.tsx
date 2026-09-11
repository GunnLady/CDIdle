import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { CanonicalDungeonEncounterRecord } from "../../../shared/contracts/authoritative";
import DungeonPage from "../../../src/components/dungeon/DungeonPage";
import DungeonCombatScene from "../../../src/components/dungeon/DungeonCombatScene";
import { createDungeonCombatSceneView } from "../../../src/domain/dungeonCombatScene";
import { createEncounterSceneProjection } from "../../../src/domain/encounterSceneProjection";
import type { Hero } from "../../../src/types";
import { makeHero } from "../../fixtures/game";
import { createUndercityProgress } from "../../../shared/domain/undercity-progression";
import "../../../src/index.css";

const harnessParams = new URLSearchParams(window.location.search);
const readOnly = harnessParams.get("readonly") === "1";
const requestedStep = Number(harnessParams.get("step") ?? 2);
const visibleCount = Number.isInteger(requestedStep) ? Math.max(0, Math.min(6, requestedStep)) : 2;
const playbackComplete = harnessParams.get("complete") === "1";
const combatSceneOnly = harnessParams.get("combat-scene") === "1";

const encounterRecord = {
  encounterId: "encounter-harness",
  kind: "fight",
  floor: 3,
  room: 3,
  outcome: "victory",
  roundCount: 2,
  enemy: { id: "rat-pack", name: "Meute des cryptes", hp: 0, maxHp: 48 },
  enemies: [
    { id: "rat-a", name: "Rat des canaux", hp: 0, maxHp: 16, role: "ordinary" },
    { id: "rat-b", name: "Rat galeux", hp: 0, maxHp: 16, role: "protector" },
    { id: "rat-c", name: "Rat pestiféré", hp: 0, maxHp: 16, role: "support" },
  ],
  initialActors: {
    v: 1,
    h: [
      ["ariane", "Guerrier_Female_1", 20, 20, 7, 10, 0],
      ["mage-history", "Mage_Male_2", 18, 18, 12, 12, 0],
      ["archer-history", "Archer_Female_7", 19, 19, 5, 8, 0],
      ["acolyte-history", "Acolyte_Male_1", 22, 22, 10, 10, 0],
    ],
    b: "rat-pack",
    e: [["a", 16, 16], ["b", 16, 16], ["c", 16, 16]],
  },
  transcript: [
    { sequence: 0, type: "encounter.started", message: "La meute encercle l’escouade." },
    { sequence: 1, type: "hero.hit", round: 1, heroId: "ariane", heroName: "Ariane", monsterId: "rat-a", damage: 6, enemyHp: 10, enemyMaxHp: 16, message: "Ariane frappe le rat des canaux." },
    { sequence: 2, type: "enemy.dodged", round: 1, heroId: "archer-history", heroName: "Céleste", monsterId: "rat-b", monsterName: "Rat galeux", message: "Céleste esquive l’attaque." },
    { sequence: 3, type: "hero.hit.critical", round: 1, heroId: "ariane", heroName: "Ariane", monsterId: "rat-a", damage: 20, enemyHp: 0, enemyMaxHp: 16, message: "Ariane porte un coup critique." },
    { sequence: 4, type: "hero.defeated", round: 2, heroId: "mage-history", heroName: "Milo", monsterId: "rat-c", monsterName: "Rat pestiféré", damage: 18, heroHpBefore: 18, heroHp: 0, heroMaxHp: 18, message: "Le rat pestiféré met Milo KO." },
    { sequence: 5, type: "encounter.victory", message: "La meute est vaincue." },
  ],
  rewards: { gold: 8, loot: [] },
} satisfies CanonicalDungeonEncounterRecord;

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

  if (combatSceneOnly) {
    const scene = createEncounterSceneProjection(
      encounterRecord,
      new Map([
        ["ariane", "Ariane"],
        ["mage-history", "Milo"],
        ["archer-history", "Céleste"],
        ["acolyte-history", "Abel"],
      ]),
      { visibleCount, complete: playbackComplete },
    );
    const view = createDungeonCombatSceneView(scene, [
      { id: "rat-a", role: "Combattant" },
      { id: "rat-b", role: "Protecteur" },
      { id: "rat-c", role: "Soutien" },
    ]);
    return <main className="mx-auto w-full max-w-[1200px] p-6">
      <DungeonCombatScene view={view} />
      <button type="button" className="mt-4 min-h-12 w-full rounded border border-amber-700 bg-amber-950 px-4 text-amber-100">Explorer la salle</button>
    </main>;
  }

  return <main className="mx-auto w-full max-w-[1440px] p-3 sm:p-6">
    <output data-testid="mutation-count" className="sr-only">{mutationCount}</output>
    <DungeonPage
      heroes={heroes}
      activeDungeonFloor={3}
      activeDungeonRoom={4}
      autoExplore={false}
      dungeonProgress={createUndercityProgress(["ariane", "borin", "celia"], 2)}
      battleLogs={[{ id: "colony", timestamp: "10:00", message: "Récolte terminée", type: "info", category: "colony" }]}
      highestFloorReached={4}
      canMutate={!readOnly}
      onToggleAutoExplore={recordMutation}
      activeEncounter={null}
      encounterHistory={[encounterRecord]}
      encounterPlayback={{ encounterId: "encounter-harness", visibleCount, complete: playbackComplete }}
      isExploring={false}
      onExplore={recordMutation}
      onChangeFloor={recordMutation}
      onRetreatParty={recordMutation}
      onClearBattleLogs={recordMutation}
      onResetLevel={recordMutation}
      onResume={recordMutation}
      onSelectFarmZone={recordMutation}
      pendingClassTransitions={[]}
      onCheckpointDecision={recordMutation}
      onToggleHeroActive={toggleHero}
    />
  </main>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
