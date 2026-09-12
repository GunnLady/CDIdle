import { useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonInitialEnemyActor,
  CanonicalDungeonInitialActors,
} from "../../../shared/contracts/authoritative";
import {
  UNDERCITY_ZONES,
  type UndercityEncounterBlueprint,
} from "../../../shared/domain/undercity";
import DungeonPage from "../../../src/components/dungeon/DungeonPage";
import DungeonCombatScene from "../../../src/components/dungeon/DungeonCombatScene";
import { createDungeonCombatSceneView } from "../../../src/domain/dungeonCombatScene";
import { createDungeonNonCombatSceneView } from "../../../src/domain/dungeonNonCombatScene";
import {
  createEncounterSceneProjection,
  createEncounterSceneTimeline,
  projectEncounterScene,
} from "../../../src/domain/encounterSceneProjection";
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
const requestedBlueprintId = harnessParams.get("blueprint");
const requestedKingPhaseTwo = harnessParams.get("king-phase") === "2";
const requestedNonCombatScene = harnessParams.get("non-combat-scene");
const nonCombatScene = requestedNonCombatScene === "treasure" || requestedNonCombatScene === "rest"
  ? requestedNonCombatScene
  : null;

const initialParty = {
  v: 1 as const,
  h: [
    ["ariane", "Guerrier_Female_1", 40, 100, 5, 20, 0],
    ["mage-history", "Mage_Male_2", 0, 80, 0, 20, 1],
    ["archer-history", "Archer_Female_7", 95, 100, 19, 20, 0],
    ["acolyte-history", "Acolyte_Male_1", 70, 90, 12, 18, 0],
  ],
  e: [],
} satisfies CanonicalDungeonInitialActors;

const historicalHeroNames = new Map([
  ["ariane", "Ariane"],
  ["mage-history", "Milo"],
  ["archer-history", "Céleste"],
  ["acolyte-history", "Abel"],
]);

const requestedBlueprint = UNDERCITY_ZONES.flatMap((zone) => (
  [...zone.encounters, zone.elite, zone.boss].map((blueprint) => ({ zone, blueprint }))
)).find(({ blueprint }) => blueprint.id === requestedBlueprintId) ?? null;

function createUndercityEncounterRecord(
  blueprint: UndercityEncounterBlueprint,
  bossBlueprintId: string,
  kingPhaseTwo = false,
): CanonicalDungeonEncounterRecord {
  const memberHp = 24;
  const enemies = blueprint.members.map((member) => ({
    id: `${blueprint.id}-${member.key}`,
    name: member.name,
    hp: kingPhaseTwo && member.role === "guard" ? 0 : memberHp,
    maxHp: memberHp,
    isBoss: blueprint.id === bossBlueprintId,
    role: member.role,
  }));
  return {
    encounterId: `undercity-${blueprint.id}-harness`,
    dungeonId: "undercity",
    kind: "fight",
    floor: 3,
    room: 3,
    outcome: "victory",
    roundCount: 1,
    enemy: {
      id: blueprint.id,
      name: blueprint.name,
      hp: enemies.length * memberHp,
      maxHp: enemies.length * memberHp,
      isBoss: blueprint.id === bossBlueprintId,
    },
    enemies,
    initialActors: {
      ...initialParty,
      b: blueprint.id,
      e: blueprint.members.map((member): CanonicalDungeonInitialEnemyActor => [
        member.key,
        kingPhaseTwo && member.role === "guard" ? 0 : memberHp,
        memberHp,
      ]),
    },
    transcript: kingPhaseTwo ? [
      { sequence: 0, type: "encounter.started", message: `${blueprint.name} apparaît.` },
      {
        sequence: 1,
        type: "enemy.intent",
        round: 2,
        monsterId: `${blueprint.id}-c`,
        monsterName: "Roi des Rats",
        intent: "Assaut monstrueux",
      },
      {
        sequence: 2,
        type: "enemy.hit",
        category: "combat-enemy",
        message: "La corruption du Roi éclate.",
        round: 2,
        monsterId: `${blueprint.id}-c`,
        monsterName: "Roi des Rats",
        targetHeroId: "ariane",
        damage: 1,
        heroHpBefore: 40,
        heroHp: 39,
        heroMaxHp: 100,
      },
    ] : [{ sequence: 0, type: "encounter.started", message: `${blueprint.name} apparaît.` }],
    rewards: { gold: 0, loot: [] },
  };
}

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

const treasureRecord = {
  encounterId: "treasure-harness",
  dungeonId: "undercity",
  kind: "treasure",
  floor: 3,
  room: 4,
  outcome: "victory",
  roundCount: 0,
  enemy: null,
  initialActors: initialParty,
  transcript: [
    { sequence: 0, type: "encounter.started" },
    { sequence: 1, type: "treasure.opened", treasureOutcome: "item" },
    { sequence: 2, type: "reward.gold", gold: 17 },
    { sequence: 3, type: "reward.material", materialId: "metal_scrap", name: "Débris métalliques", rarity: "common", count: 2 },
  ],
  rewards: {
    gold: 17,
    loot: [{ type: "material", materialId: "metal_scrap", name: "Débris métalliques", rarity: "common", count: 2 }],
  },
} satisfies CanonicalDungeonEncounterRecord;

const restRecord = {
  encounterId: "rest-harness",
  dungeonId: "undercity",
  kind: "rest",
  floor: 3,
  room: 5,
  outcome: "victory",
  roundCount: 0,
  enemy: null,
  initialActors: {
    ...initialParty,
    h: [
      ["ariane", "Guerrier_Female_1", 40, 100, 5, 20, 0],
      ["mage-history", "Mage_Male_2", 0, 80, 0, 20, 1],
      ["archer-history", "Archer_Female_7", 95, 100, 19, 20, 0],
      ["acolyte-history", "Acolyte_Male_1", 0, 90, 2, 18, 1],
    ],
  },
  transcript: [
    { sequence: 0, type: "rest.started" },
    {
      sequence: 1,
      type: "party.restored",
      heroes: [
        { heroId: "ariane", hpBefore: 40, hpAfter: 60, manaBefore: 5, manaAfter: 9, revived: false },
        { heroId: "mage-history", hpBefore: 0, hpAfter: 16, manaBefore: 0, manaAfter: 4, revived: true },
        { heroId: "archer-history", hpBefore: 95, hpAfter: 100, manaBefore: 19, manaAfter: 20, revived: false },
        { heroId: "acolyte-history", hpBefore: 0, hpAfter: 18, manaBefore: 2, manaAfter: 6, revived: true },
      ],
    },
  ],
  rewards: { gold: 0, loot: [] },
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
    const selectedRecord = requestedBlueprint
      ? createUndercityEncounterRecord(
          requestedBlueprint.blueprint,
          requestedBlueprint.zone.boss.id,
          requestedKingPhaseTwo && requestedBlueprint.blueprint.id === "rat-king",
        )
      : encounterRecord;
    const scene = createEncounterSceneProjection(
      selectedRecord,
      new Map([
        ["ariane", "Ariane"],
        ["mage-history", "Milo"],
        ["archer-history", "Céleste"],
        ["acolyte-history", "Abel"],
      ]),
      { visibleCount, complete: playbackComplete },
    );
    const view = createDungeonCombatSceneView(
      scene,
      selectedRecord.enemies?.map((enemy) => ({ id: enemy.id, role: enemy.role })) ?? [],
    );
    return <main className="mx-auto w-full max-w-[1200px] p-6">
      <DungeonCombatScene view={view} />
      <button type="button" className="mt-4 min-h-12 w-full rounded border border-amber-700 bg-amber-950 px-4 text-amber-100">Explorer la salle</button>
    </main>;
  }

  if (nonCombatScene) {
    const record = nonCombatScene === "treasure" ? treasureRecord : restRecord;
    const timeline = createEncounterSceneTimeline(record, historicalHeroNames);
    const scene = projectEncounterScene(timeline);
    const view = createDungeonNonCombatSceneView(record, timeline, scene);
    if (!view) throw new Error(`Scène non-combat inconnue : ${nonCombatScene}`);
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
