import type { CanonicalDungeonEncounterRecord } from "../../shared/contracts/authoritative";
import { createDungeonCombatSceneView, type DungeonCombatSceneView } from "./dungeonCombatScene";
import { getDungeonNonCombatSceneSlot } from "./dungeonSceneLayout";
import type { EncounterSceneReward, EncounterSceneState, EncounterSceneTimeline } from "./encounterSceneProjection";

function rewardText(reward: EncounterSceneReward): string {
  if (reward.kind === "empty") return "Coffre vide";
  if (reward.kind === "gold") return `+${reward.amount} or`;
  const name = reward.name ?? reward.contentId ?? reward.kind;
  return reward.kind === "blueprint" ? `Plan · ${name}` : `${name} ×${reward.amount}`;
}

export function createDungeonNonCombatSceneView(
  record: CanonicalDungeonEncounterRecord,
  timeline: EncounterSceneTimeline,
  scene: EncounterSceneState,
): DungeonCombatSceneView | null {
  const kind = record.kind;
  if (kind !== "treasure" && kind !== "rest") return null;
  const activeStep = kind === "rest"
    ? timeline.steps.slice(0, scene.visibleCount).find((step) => step.type === "party.restored") ?? scene.activeStep
    : scene.activeStep;
  const base = createDungeonCombatSceneView({ ...scene, activeStep, complete: false });
  const details = kind === "treasure" ? scene.rewards.map(rewardText) : [];
  const recoveryDetails = base.actors.flatMap((actor) => {
    const effects = base.effects.filter((effect) => effect.targetActorId === actor.id);
    return effects.length > 0 ? [`${actor.name} : ${effects.map((effect) => effect.label).join(", ")}`] : [];
  });
  const actionSummary = kind === "treasure"
    ? details.join(" • ") || "Trésor"
    : recoveryDetails.length > 0 ? `Repos terminé. ${recoveryDetails.join(" ; ")}.` : "Repos";

  base.actionSummary = actionSummary;
  base.environment = record.dungeonId !== "undercity"
    ? "fallback"
    : kind === "treasure" ? "treasure-vault" : "rest-chamber";
  base.actors = base.actors.map((actor, index) => {
    const standard = getDungeonNonCombatSceneSlot(kind, index, "standard");
    const zoomed = getDungeonNonCombatSceneSlot(kind, index, "zoomed");
    return standard && zoomed ? { ...actor, standard, zoomed } : actor;
  });
  base.nonCombat = kind;
  base.nonCombatDetails = kind === "treasure"
    ? details.length ? details : [actionSummary]
    : [base.effects.length > 0 ? "Repos terminé" : "Repos"];
  return base;
}
