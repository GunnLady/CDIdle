import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  CanonicalDungeonEncounterRecord,
  CanonicalDungeonInitialEnemyActor,
  CanonicalDungeonInitialHeroActor,
  CanonicalDungeonInitialActors,
} from "../../../shared/contracts/authoritative";
import {
  UNDERCITY_ZONES,
  type UndercityEncounterBlueprint,
} from "../../../shared/domain/undercity";
import DungeonPage from "../../../src/components/dungeon/DungeonPage";
import DungeonCombatScene from "../../../src/components/dungeon/DungeonCombatScene";
import CurrentEncounterPanel from "../../../src/components/dungeon/CurrentEncounterPanel";
import { createDungeonCombatSceneView } from "../../../src/domain/dungeonCombatScene";
import {
  DUNGEON_CHALLENGE_KINDS,
  isDungeonChallengeKind,
} from "../../../src/domain/dungeonChallengeScene";
import { createDungeonNonCombatSceneView } from "../../../src/domain/dungeonNonCombatScene";
import { createEncounterView } from "../../../src/domain/dungeonPresentation";
import { useEncounterPlayback } from "../../../src/hooks/useEncounterPlayback";
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
const requestedWarriorCinemaPage = Number(harnessParams.get("warrior-cinema"));
const warriorCinema = Number.isInteger(requestedWarriorCinemaPage)
  && requestedWarriorCinemaPage >= 1
  && requestedWarriorCinemaPage <= 5;
const requestedRogueCinemaPage = Number(harnessParams.get("rogue-cinema"));
const rogueCinema = Number.isInteger(requestedRogueCinemaPage)
  && requestedRogueCinemaPage >= 1
  && requestedRogueCinemaPage <= 5;
const requestedArcherCinemaPage = Number(harnessParams.get("archer-cinema"));
const archerCinema = Number.isInteger(requestedArcherCinemaPage)
  && requestedArcherCinemaPage >= 1
  && requestedArcherCinemaPage <= 5;
const readOnly = harnessParams.get("readonly") === "1";
const requestedStep = Number(harnessParams.get("step") ?? 2);
const visibleCount = Number.isInteger(requestedStep) ? Math.max(0, Math.min(12, requestedStep)) : 2;
const playbackComplete = harnessParams.get("complete") === "1";
const combatSceneOnly = harnessParams.get("combat-scene") === "1" || warriorCinema || rogueCinema || archerCinema;
const integratedCombat = harnessParams.get("integrated") === "1" || warriorCinema || rogueCinema || archerCinema;
const advancedCombat = harnessParams.get("advanced-combat") === "1";
const visualScenario = harnessParams.get("scenario") === "1";
const continuousContactPilot = harnessParams.get("contact-pilot") === "1";
const noviceReview = harnessParams.get("novice-review") === "1";
const warriorReview = harnessParams.get("warrior-review") === "1" || warriorCinema;
const rogueReview = rogueCinema;
const archerReview = archerCinema;
const requestedReviewPage = Number(
  harnessParams.get("review-page")
    ?? (warriorCinema
      ? requestedWarriorCinemaPage
      : rogueCinema
        ? requestedRogueCinemaPage
        : archerCinema
          ? requestedArcherCinemaPage
          : 1),
);
const reviewPage = Number.isInteger(requestedReviewPage)
  ? Math.max(1, Math.min(5, requestedReviewPage))
  : 1;
const animationsEnabled = !warriorCinema && !rogueCinema && !archerCinema && harnessParams.get("animations") !== "0";
const requestedBlueprintId = harnessParams.get("blueprint");
const requestedKingPhaseTwo = harnessParams.get("king-phase") === "2";
const requestedNonCombatScene = harnessParams.get("non-combat-scene");
const requestedChallengeValue = harnessParams.get("challenge") ?? "";
const requestedChallenge = isDungeonChallengeKind(requestedChallengeValue)
  ? requestedChallengeValue
  : null;
const requestedChallengeOutcome = harnessParams.get("outcome") === "defeat" ? "defeat" : "victory";
const nonCombatScene = requestedNonCombatScene === "treasure" || requestedNonCombatScene === "rest"
  ? requestedNonCombatScene
  : null;

const noviceReviewVisualKeys = [
  "Novice_Female_0",
  "Novice_Male_0",
  "Novice_Female_5",
  "Novice_Male_5",
] as const;

const warriorReviewFirstVariant = (reviewPage - 1) * 2;
const warriorReviewVisualKeys = [
  `Guerrier_Female_${warriorReviewFirstVariant}`,
  `Guerrier_Male_${warriorReviewFirstVariant}`,
  `Guerrier_Female_${warriorReviewFirstVariant + 1}`,
  `Guerrier_Male_${warriorReviewFirstVariant + 1}`,
] as const;

const rogueReviewFirstVariant = (reviewPage - 1) * 2;
const rogueReviewVisualKeys = [
  `Voleur_Female_${rogueReviewFirstVariant}`,
  `Voleur_Male_${rogueReviewFirstVariant}`,
  `Voleur_Female_${rogueReviewFirstVariant + 1}`,
  `Voleur_Male_${rogueReviewFirstVariant + 1}`,
] as const;

const archerReviewFirstVariant = (reviewPage - 1) * 2;
const archerReviewVisualKeys = [
  `Archer_Female_${archerReviewFirstVariant}`,
  `Archer_Male_${archerReviewFirstVariant}`,
  `Archer_Female_${archerReviewFirstVariant + 1}`,
  `Archer_Male_${archerReviewFirstVariant + 1}`,
] as const;

function withHeroReview(record: CanonicalDungeonEncounterRecord): CanonicalDungeonEncounterRecord {
  const reviewVisualKeys = archerReview
    ? archerReviewVisualKeys
    : rogueReview
    ? rogueReviewVisualKeys
    : warriorReview
    ? warriorReviewVisualKeys
    : noviceReview
      ? noviceReviewVisualKeys
      : null;
  if (!reviewVisualKeys || !record.initialActors) return record;
  return {
    ...record,
    initialActors: {
      ...record.initialActors,
      h: record.initialActors.h.map((actor, index): CanonicalDungeonInitialHeroActor => [
        actor[0],
        reviewVisualKeys[index % reviewVisualKeys.length]!,
        actor[2],
        actor[3],
        actor[4],
        actor[5],
        actor[6],
      ]),
    },
  };
}

const advancedCombatScenarioLabels = [
  "Mise en place",
  "Tir précis · Céleste → Rat des canaux",
  "Magie offensive · Milo → Rat galeux",
  "Soin allié · Abel → Ariane",
  "Soutien ennemi · Rat pestiféré → Rat galeux",
  "Multi-frappe · Ariane → Rat des canaux",
  "Attaque de zone · Rat des canaux",
  "Attaque de zone · Rat galeux",
  "Attaque de zone · Rat pestiféré",
  "Résultat du combat",
] as const;

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

const challengeInitialParty = {
  v: 1 as const,
  h: [
    ["ariane", "Guerrier_Female_1", 70, 100, 5, 20, 0],
    ["mage-history", "Mage_Male_2", 52, 80, 12, 20, 0],
    ["archer-history", "Archer_Female_7", 55, 100, 19, 20, 0],
    ["acolyte-history", "Acolyte_Male_1", 70, 90, 12, 18, 0],
  ],
  e: [],
} satisfies CanonicalDungeonInitialActors;

const historicalHeroNames = new Map([
  ["ariane", "Ariane"],
  ["pugilist-history", "Ariane"],
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

const contactPilotRecord = withHeroReview(encounterRecord);

const advancedCombatRecord = {
  encounterId: "advanced-combat-harness",
  dungeonId: "undercity",
  kind: "fight",
  floor: 3,
  room: 4,
  outcome: "defeat",
  roundCount: 3,
  enemy: { id: "rat-pack", name: "Meute des cryptes", hp: 106, maxHp: 150 },
  enemies: [
    { id: "rat-a", name: "Rat des canaux", hp: 23, maxHp: 50, role: "ordinary" },
    { id: "rat-b", name: "Rat galeux", hp: 39, maxHp: 50, role: "protector" },
    { id: "rat-c", name: "Rat pestifere", hp: 44, maxHp: 50, role: "support" },
  ],
  initialActors: {
    v: 1,
    h: [
      ["pugilist-history", "Pugiliste_Female_1", 40, 60, 14, 14, 0],
      ["mage-history", "Mage_Male_2", 52, 52, 12, 12, 0],
      ["archer-history", "Archer_Female_7", 55, 55, 8, 8, 0],
      ["acolyte-history", "Acolyte_Male_1", 58, 58, 10, 10, 0],
    ],
    b: "rat-pack",
    e: [["a", 50, 50], ["b", 50, 50], ["c", 50, 50]],
  },
  transcript: [
    { sequence: 0, type: "encounter.started", message: "La meute encercle l'escouade." },
    {
      sequence: 1,
      type: "hero.skill.damage",
      category: "combat-hero",
      round: 1,
      heroId: "archer-history",
      heroName: "Céleste",
      monsterId: "rat-a",
      monsterName: "Rat des canaux",
      skillId: "precise_shot",
      skillName: "Tir precis",
      damageType: "physical",
      damage: 6,
      enemyHp: 44,
      enemyMaxHp: 50,
      sourceMana: [8, 4, 8],
      message: "Celeste decoche un tir precis.",
    },
    {
      sequence: 2,
      type: "hero.skill.damage",
      category: "combat-hero",
      round: 1,
      heroId: "mage-history",
      heroName: "Milo",
      monsterId: "rat-b",
      monsterName: "Rat galeux",
      skillId: "fire_bolt",
      skillName: "Trait de feu",
      damageType: "fire",
      damage: 10,
      enemyHp: 40,
      enemyMaxHp: 50,
      sourceMana: [12, 6, 12],
      message: "Milo projette un trait de feu.",
    },
    {
      sequence: 3,
      type: "hero.skill.heal",
      category: "combat-hero",
      round: 1,
      heroId: "acolyte-history",
      heroName: "Abel",
      targetHeroId: "pugilist-history",
      targetHeroName: "Ariane",
      skillId: "minor_heal",
      skillName: "Soin mineur",
      healing: 8,
      heroHpBefore: 40,
      heroHp: 48,
      heroMaxHp: 60,
      sourceMana: [10, 6, 10],
      message: "Abel soigne Ariane.",
    },
    {
      sequence: 4,
      type: "enemy.support",
      category: "combat-enemy",
      round: 1,
      monsterId: "rat-c",
      monsterName: "Rat pestifere",
      targetMonsterId: "rat-b",
      targetMonsterName: "Rat galeux",
      healing: 5,
      enemyHp: 45,
      enemyMaxHp: 50,
      message: "Le rat pestifere soutient son allie.",
    },
    {
      sequence: 5,
      type: "hero.skill.damage",
      category: "combat-hero",
      round: 2,
      heroId: "pugilist-history",
      heroName: "Ariane",
      monsterId: "rat-a",
      monsterName: "Rat des canaux",
      skillId: "rapid_combo",
      skillName: "Combo rapide",
      damageType: "physical",
      damage: 15,
      hitCount: 3,
      hitResults: [
        { hit: 1, critical: false, damage: 4 },
        { hit: 2, critical: true, damage: 6 },
        { hit: 3, critical: false, damage: 5 },
      ],
      enemyHp: 29,
      enemyMaxHp: 50,
      sourceMana: [14, 8, 14],
      message: "Ariane enchaine trois impacts.",
    },
    {
      sequence: 6,
      type: "hero.skill.damage",
      category: "combat-hero",
      round: 3,
      heroId: "pugilist-history",
      heroName: "Ariane",
      monsterId: "rat-a",
      monsterName: "Rat des canaux",
      skillId: "cleaving_strike",
      skillName: "Frappe circulaire",
      damageType: "physical",
      hit: 1,
      hitCount: 1,
      critical: false,
      damage: 6,
      enemyHp: 23,
      enemyMaxHp: 50,
      sourceMana: [8, 2, 14],
      targets: ["e", 0, 1, 2],
      message: "La frappe circulaire touche le premier ennemi.",
    },
    {
      sequence: 7,
      type: "hero.skill.damage",
      category: "combat-hero",
      round: 3,
      heroId: "pugilist-history",
      heroName: "Ariane",
      monsterId: "rat-b",
      monsterName: "Rat galeux",
      skillId: "cleaving_strike",
      skillName: "Frappe circulaire",
      damageType: "physical",
      hit: 1,
      hitCount: 1,
      critical: false,
      damage: 6,
      enemyHp: 39,
      enemyMaxHp: 50,
      message: "La frappe circulaire touche le second ennemi.",
    },
    {
      sequence: 8,
      type: "hero.skill.damage",
      category: "combat-hero",
      round: 3,
      heroId: "pugilist-history",
      heroName: "Ariane",
      monsterId: "rat-c",
      monsterName: "Rat pestifere",
      skillId: "cleaving_strike",
      skillName: "Frappe circulaire",
      damageType: "physical",
      hit: 1,
      hitCount: 1,
      critical: false,
      damage: 6,
      enemyHp: 44,
      enemyMaxHp: 50,
      message: "La frappe circulaire touche le troisieme ennemi.",
    },
  ],
  rewards: { gold: 0, loot: [] },
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

function createChallengeRecord(
  kind: typeof DUNGEON_CHALLENGE_KINDS[number],
  outcome: "victory" | "defeat",
): CanonicalDungeonEncounterRecord {
  const success = outcome === "victory";
  const partyChanges = challengeInitialParty.h.map(([heroId, , currentHp, , currentMana]) => ({
    heroId,
    hpBefore: currentHp,
    hpAfter: Math.max(1, currentHp - 3),
    manaBefore: currentMana,
    manaAfter: currentMana,
  }));
  const manaRecovery = challengeInitialParty.h.map(([heroId, , currentHp, , currentMana, maximumMana]) => ({
    heroId,
    hpBefore: currentHp,
    hpAfter: currentHp,
    manaBefore: currentMana,
    manaAfter: Math.min(maximumMana, currentMana + 4),
  }));
  const resolvedChanges = kind === "enigma" || kind === "ritual" ? manaRecovery : [];
  const failedChanges = kind === "trap" || kind === "ambush" || kind === "obstacle"
    ? partyChanges
    : kind === "enigma" || kind === "ritual"
      ? [{
          heroId: "archer-history",
          hpBefore: 55,
          hpAfter: 55,
          manaBefore: 19,
          manaAfter: 17,
        }]
      : [];
  const gold = success && (kind === "enigma" || kind === "ambush" || kind === "negotiation") ? 12 : 0;
  return {
    encounterId: `challenge-${kind}-${outcome}-harness`,
    dungeonId: "undercity",
    kind,
    floor: 8,
    room: 4,
    outcome,
    roundCount: 0,
    enemy: null,
    initialActors: challengeInitialParty,
    transcript: [
      { sequence: 0, type: "encounter.started", message: `La salle impose l'épreuve ${kind}.` },
      {
        sequence: 1,
        type: "challenge.hero_selected",
        heroId: "archer-history",
        heroName: "Céleste",
        probabilityPercent: 72,
        message: "Céleste est la mieux préparée.",
      },
      {
        sequence: 2,
        type: "challenge.attempted",
        heroId: "archer-history",
        heroName: "Céleste",
        luckRoll: 4,
        score: 18,
        difficulty: 20,
        message: "Céleste tente l'épreuve.",
      },
      {
        sequence: 3,
        type: success ? "challenge.succeeded" : "challenge.failed",
        heroId: "archer-history",
        heroName: "Céleste",
        message: success ? "L'épreuve est réussie." : "L'épreuve échoue.",
      },
      success
        ? {
            sequence: 4,
            type: `challenge.${kind}.resolved`,
            heroId: "archer-history",
            heroName: "Céleste",
            goldGained: gold,
            heroChanges: resolvedChanges,
            message: "La voie est sécurisée.",
          }
        : {
            sequence: 4,
            type: `challenge.${kind}.consequence`,
            goldLost: kind === "negotiation" ? 7 : 0,
            heroChanges: failedChanges,
            message: "L'épreuve impose sa conséquence sans arrêter l'expédition.",
          },
      ...(gold > 0 ? [{ sequence: 5, type: "reward.gold", gold, message: `+${gold} or.` }] : []),
    ],
    rewards: { gold, loot: [] },
  };
}

function Harness() {
  const [mutationCount, setMutationCount] = useState(0);
  const [scenarioStep, setScenarioStep] = useState(1);
  const [scenarioReplay, setScenarioReplay] = useState(0);
  const [contactPilotReplay, setContactPilotReplay] = useState(0);
  const [contactPilotSeenCounts, setContactPilotSeenCounts] = useState<number[]>([]);
  const [harnessAnimationsEnabled, setHarnessAnimationsEnabled] = useState(animationsEnabled);
  const [heroes, setHeroes] = useState<Hero[]>([
    makeHero({ id: "ariane", name: "Ariane", isActive: true, currentMana: 7 }),
    makeHero({ id: "borin", name: "Borin", isActive: false, currentHp: 16 }),
    makeHero({ id: "celia", name: "Célia", isActive: false, currentHp: 0 }),
  ]);
  const {
    encounterPlayback: contactPilotPlayback,
    playEncounterTranscript: playContactPilot,
    resetEncounterPlayback: resetContactPilot,
  } = useEncounterPlayback("dungeon", "browser-contact-pilot");

  useEffect(() => {
    if (!continuousContactPilot) return undefined;
    void playContactPilot(contactPilotRecord, { revision: `cdi-113-${contactPilotReplay}` });
    return () => resetContactPilot("browser-contact-pilot");
  }, [contactPilotReplay, playContactPilot, resetContactPilot]);

  useEffect(() => {
    if (!continuousContactPilot || !contactPilotPlayback) return;
    setContactPilotSeenCounts((counts) => (
      counts.at(-1) === contactPilotPlayback.visibleCount
        ? counts
        : [...counts, contactPilotPlayback.visibleCount]
    ));
  }, [contactPilotPlayback]);
  const recordMutation = () => setMutationCount((count) => count + 1);
  const toggleHero = (heroId: string) => {
    recordMutation();
    setHeroes((current) => current.map((hero) => hero.id === heroId ? { ...hero, isActive: !hero.isActive } : hero));
  };

  if (combatSceneOnly) {
    if (requestedChallenge) {
      const record = withHeroReview(createChallengeRecord(requestedChallenge, requestedChallengeOutcome));
      const view = createEncounterView(record, historicalHeroNames, {
        visibleCount,
        complete: playbackComplete,
      });
      return <main className="mx-auto w-full max-w-[1200px] p-6">
        <CurrentEncounterPanel
          view={view}
          canMutate
          activeHeroCount={4}
          isExploring={false}
          animationsEnabled={animationsEnabled}
          animationsRunning={animationsEnabled}
          onExplore={() => undefined}
          onToggleAnimations={() => undefined}
        />
      </main>;
    }
    const selectedRecord = continuousContactPilot ? contactPilotRecord : withHeroReview(advancedCombat
      ? advancedCombatRecord
      : requestedBlueprint
      ? createUndercityEncounterRecord(
          requestedBlueprint.blueprint,
          requestedBlueprint.zone.boss.id,
          requestedKingPhaseTwo && requestedBlueprint.blueprint.id === "rat-king",
        )
      : encounterRecord);
    if (integratedCombat) {
      const scenarioActive = advancedCombat && visualScenario;
      const activeScenarioStep = scenarioActive ? scenarioStep : visibleCount;
      const encounterView = createEncounterView(
        selectedRecord,
        historicalHeroNames,
        continuousContactPilot
          ? contactPilotPlayback ?? { visibleCount: 0, complete: false }
          : {
              visibleCount: Math.min(activeScenarioStep, advancedCombatRecord.transcript.length),
              complete: scenarioActive
                ? activeScenarioStep > advancedCombatRecord.transcript.length
                : playbackComplete,
            },
      );
      const view = scenarioActive && encounterView.visualScene
        ? {
            ...encounterView,
            visualScene: {
              ...encounterView.visualScene,
              actionKey: `${encounterView.visualScene.actionKey}:replay-${scenarioReplay}`,
            },
          }
        : encounterView;
      return <main
        className="mx-auto w-full max-w-[1200px] p-6"
        data-playback-complete={continuousContactPilot ? contactPilotPlayback?.complete ?? false : undefined}
        data-playback-seen-counts={continuousContactPilot ? contactPilotSeenCounts.join(",") : undefined}
        data-playback-visible-count={continuousContactPilot ? contactPilotPlayback?.visibleCount ?? 0 : undefined}
        data-testid={continuousContactPilot ? "contact-pilot-reader" : undefined}
      >
        {continuousContactPilot && <nav
          aria-label="Contrôles du pilote de contact"
          className="mb-3 flex min-h-12 items-center justify-between gap-3 rounded border border-amber-800 bg-[#110b06] px-3 py-2 text-amber-100"
        >
          <span>Pilote de contact automatique · 400 ms par action</span>
          <button
            className="rounded border border-amber-700 px-3 py-2"
            onClick={() => {
              setContactPilotSeenCounts([]);
              setContactPilotReplay((replay) => replay + 1);
            }}
            type="button"
          >
            Rejouer
          </button>
        </nav>}
        {scenarioActive && <nav
          aria-label="Contrôles du scénario de combat avancé"
          className="mb-3 flex min-h-12 items-center justify-between gap-3 rounded border border-amber-800 bg-[#110b06] px-3 py-2 text-amber-100"
          data-testid="advanced-combat-scenario-controls"
        >
          <button
            className="rounded border border-amber-700 px-3 py-2 disabled:opacity-40"
            disabled={scenarioStep <= 1}
            onClick={() => setScenarioStep((step) => Math.max(1, step - 1))}
            type="button"
          >
            Précédente
          </button>
          <div className="text-center">
            <output className="block font-serif text-sm font-bold" data-testid="advanced-combat-scenario-step">
              Étape {scenarioStep}/{advancedCombatScenarioLabels.length}
            </output>
            <span className="text-xs text-amber-200">{advancedCombatScenarioLabels[scenarioStep - 1]}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded border border-amber-700 px-3 py-2"
              onClick={() => setScenarioReplay((replay) => replay + 1)}
              type="button"
            >
              Rejouer
            </button>
            <button
              className="rounded border border-amber-700 px-3 py-2 disabled:opacity-40"
              disabled={scenarioStep >= advancedCombatScenarioLabels.length}
              onClick={() => setScenarioStep((step) => Math.min(advancedCombatScenarioLabels.length, step + 1))}
              type="button"
            >
              Suivante
            </button>
          </div>
        </nav>}
        <CurrentEncounterPanel
          view={view}
          canMutate
          activeHeroCount={4}
          isExploring={false}
          animationsEnabled={harnessAnimationsEnabled}
          animationsRunning={harnessAnimationsEnabled}
          onExplore={() => undefined}
          onToggleAnimations={() => setHarnessAnimationsEnabled((enabled) => !enabled)}
        />
      </main>;
    }
    const scene = createEncounterSceneProjection(
      selectedRecord,
      new Map([
        ["ariane", "Ariane"],
        ["pugilist-history", "Ariane"],
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
      <DungeonCombatScene view={view} animationsEnabled={animationsEnabled} />
      <button type="button" className="mt-4 min-h-12 w-full rounded border border-amber-700 bg-amber-950 px-4 text-amber-100">Explorer la salle</button>
    </main>;
  }

  if (nonCombatScene) {
    const record = withHeroReview(nonCombatScene === "treasure" ? treasureRecord : restRecord);
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
