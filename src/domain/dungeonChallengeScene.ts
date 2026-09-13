import type { CanonicalDungeonEncounterRecord } from "../../shared/contracts/authoritative";
import type { DungeonChallengeKind } from "../../shared/domain/dungeon-challenges";
import {
  createDungeonCombatSceneView,
  type DungeonCombatActorMotion,
  type DungeonCombatSceneView,
} from "./dungeonCombatScene";
import { getDungeonNonCombatSceneSlot } from "./dungeonSceneLayout";
import type {
  EncounterSceneReward,
  EncounterSceneState,
  EncounterSceneTimeline,
} from "./encounterSceneProjection";

export const DUNGEON_CHALLENGE_KINDS = [
  "trap",
  "enigma",
  "ambush",
  "ritual",
  "obstacle",
  "negotiation",
] as const satisfies readonly DungeonChallengeKind[];

const challengeLabels: Readonly<Record<DungeonChallengeKind, string>> = {
  trap: "Piège",
  enigma: "Énigme",
  ambush: "Embuscade",
  ritual: "Rituel",
  obstacle: "Obstacle",
  negotiation: "Négociation",
};

const challengeMotions: Readonly<Record<DungeonChallengeKind, DungeonCombatActorMotion>> = {
  trap: "ranged",
  enigma: "cast",
  ambush: "ranged",
  ritual: "cast",
  obstacle: "melee",
  negotiation: "focus",
};

export function isDungeonChallengeKind(value: string): value is DungeonChallengeKind {
  return (DUNGEON_CHALLENGE_KINDS as readonly string[]).includes(value);
}

function rewardText(reward: EncounterSceneReward): string {
  if (reward.kind === "gold") return `Or +${reward.amount}`;
  if (reward.kind === "gold-loss") return `Or −${reward.amount}`;
  if (reward.kind === "empty") return "Aucune récompense";
  const name = reward.name ?? reward.contentId ?? reward.kind;
  return reward.kind === "blueprint" ? `Plan · ${name}` : `${name} ×${reward.amount}`;
}

function uniqueDetails(details: readonly string[]): string[] {
  return [...new Set(details.filter(Boolean))];
}

export function createDungeonChallengeSceneView(
  record: CanonicalDungeonEncounterRecord,
  timeline: EncounterSceneTimeline,
  scene: EncounterSceneState,
): DungeonCombatSceneView | null {
  if (!isDungeonChallengeKind(record.kind)) return null;
  const visibleSteps = timeline.steps.slice(0, scene.visibleCount);
  const selectedStep = visibleSteps.find((step) => step.type === "challenge.hero_selected");
  const focusActorId = selectedStep?.sourceActorId ?? null;
  const base = createDungeonCombatSceneView({ ...scene, complete: false });
  const focus = focusActorId ? base.actors.find((actor) => actor.id === focusActorId) ?? null : null;
  const orderedActors = focus
    ? [focus, ...base.actors.filter((actor) => actor.id !== focus.id)]
    : base.actors;
  base.effects = base.effects.map((effect, index) => ({ ...effect, offset: index }));

  base.actors = orderedActors.map((actor, index) => {
    const standard = getDungeonNonCombatSceneSlot("challenge", index, "standard");
    const zoomed = getDungeonNonCombatSceneSlot("challenge", index, "zoomed");
    return {
      ...actor,
      active: actor.id === focusActorId,
      motion: actor.id === focusActorId ? challengeMotions[record.kind] : "idle",
      ...(standard && zoomed ? { standard, zoomed } : {}),
    };
  });

  const outcome = scene.result === "victory"
    ? "Épreuve réussie"
    : scene.result === "defeat"
      ? "Épreuve échouée · progression maintenue"
      : null;
  const rewardDetails = scene.rewards.map(rewardText);
  const waitingDetail = focus
    ? `${focus.name} relève l'épreuve`
    : scene.activeStep?.summary || challengeLabels[record.kind];
  const details = uniqueDetails([
    ...(outcome ? [outcome] : []),
    ...rewardDetails,
  ]);

  base.actionMode = scene.activeStep ? "neutral" : "entry";
  base.actionSummary = scene.activeStep?.summary || waitingDetail;
  base.environment = "challenge-chamber";
  base.result = null;
  base.actionEffects = [];
  base.nonCombat = record.kind;
  base.nonCombatOutcome = scene.result;
  base.nonCombatDetails = details.length > 0 ? details : [waitingDetail];
  return base;
}
