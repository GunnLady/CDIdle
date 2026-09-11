import {
  DUNGEON_SCENE_ENEMY_LIMIT,
  DUNGEON_SCENE_HERO_LIMIT,
  getDungeonSceneSlot,
  type DungeonSceneSlot,
} from "./dungeonSceneLayout";
import type {
  EncounterSceneActor,
  EncounterSceneImpact,
  EncounterSceneResult,
  EncounterSceneState,
  EncounterSceneStep,
  EncounterSceneTeam,
} from "./encounterSceneProjection";

export const DUNGEON_COMBAT_EFFECT_LIMIT = 16;

export type DungeonCombatActionMode = "entry" | "idle" | "melee" | "neutral" | "result";
export type DungeonCombatActorMotion = "enter" | "idle" | "melee" | "focus";
export type DungeonCombatActorReaction = "none" | "impact" | "dodge" | "ko";
export type DungeonCombatEffectKind = "damage" | "critical" | "dodge" | "defeat";

export interface DungeonCombatSceneActorView {
  id: string;
  team: EncounterSceneTeam;
  name: string;
  role: string;
  visualKey: string | null;
  currentHp: number | null;
  maximumHp: number | null;
  healthPercent: number | null;
  state: "ready" | "wounded" | "ko";
  active: boolean;
  motion: DungeonCombatActorMotion;
  reaction: DungeonCombatActorReaction;
  idleDurationMs: number;
  idleDelayMs: number;
  standard: DungeonSceneSlot;
  zoomed: DungeonSceneSlot;
}

export interface DungeonCombatSceneEffectView {
  id: string;
  targetActorId: string;
  kind: DungeonCombatEffectKind;
  label: string;
  offset: number;
}

export interface DungeonCombatSceneView {
  actionKey: string;
  actionMode: DungeonCombatActionMode;
  actionSummary: string;
  environment: "sewers" | "fallback";
  actors: DungeonCombatSceneActorView[];
  effects: DungeonCombatSceneEffectView[];
  result: EncounterSceneResult | null;
}

export interface DungeonCombatEnemyRole {
  id: string;
  role?: string;
}

const MELEE_EVENT_TYPES = [
  "hero.hit",
  "hero.hit.critical",
  "enemy.hit",
  "enemy.dodged",
  "hero.defeated",
];

const ENTRY_EVENT_TYPES = ["combat.start", "encounter.started"];

const idleRhythms = {
  heroes: [
    { durationMs: 3_400, delayMs: -600 },
    { durationMs: 3_700, delayMs: -1_900 },
    { durationMs: 3_200, delayMs: -1_200 },
    { durationMs: 3_900, delayMs: -2_800 },
  ],
  enemies: [
    { durationMs: 3_600, delayMs: -2_400 },
    { durationMs: 3_250, delayMs: -900 },
    { durationMs: 3_850, delayMs: -1_700 },
  ],
} as const;

function percentage(current: number | null, maximum: number | null): number | null {
  if (current === null || maximum === null || maximum <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((current / maximum) * 100)));
}

function heroRole(actor: EncounterSceneActor): string {
  const classType = actor.visualKey?.split("_")[0]?.trim();
  return classType || "Héros";
}

function actorVisualKey(actor: EncounterSceneActor): string | null {
  if (actor.team === "heroes") return actor.visualKey;
  return actor.contentKey ? `undercity:${actor.contentKey}` : null;
}

function actorState(actor: EncounterSceneActor): DungeonCombatSceneActorView["state"] {
  if (actor.knockedOut === true || actor.currentHp === 0) return "ko";
  if (
    actor.currentHp !== null
    && actor.maximumHp !== null
    && actor.maximumHp > 0
    && actor.currentHp / actor.maximumHp <= 0.45
  ) return "wounded";
  return "ready";
}

function actionMode(scene: EncounterSceneState): DungeonCombatActionMode {
  if (scene.complete) return "result";
  const step = scene.activeStep;
  if (!step) return scene.visibleCount === 0 ? "entry" : "idle";
  if (MELEE_EVENT_TYPES.includes(step.type)) return "melee";
  if (ENTRY_EVENT_TYPES.includes(step.type)) return "entry";
  if (step.result) return "result";
  return "neutral";
}

function impactReaction(
  actor: EncounterSceneActor,
  impact: EncounterSceneImpact | undefined,
): DungeonCombatActorReaction {
  if (!impact) return "none";
  if (impact.kind === "dodge") return "dodge";
  if (impact.knockedOutAfter === true || actor.knockedOut === true || impact.hp?.after === 0) return "ko";
  return "impact";
}

function numericEffectValue(impact: EncounterSceneImpact): number | null {
  return impact.appliedValue ?? impact.announcedValue;
}

function effectKind(
  step: EncounterSceneStep,
  impact: EncounterSceneImpact,
): DungeonCombatEffectKind {
  if (impact.kind === "dodge") return "dodge";
  if (step.type === "hero.hit.critical") return "critical";
  if (impact.kind === "defeat") return "defeat";
  return "damage";
}

function effectLabel(kind: DungeonCombatEffectKind, impact: EncounterSceneImpact): string {
  if (kind === "dodge") return "Esquive";
  const value = numericEffectValue(impact);
  if (impact.appliedValue === null && impact.announcedValue !== null) return `−${impact.announcedValue}?`;
  return value === null ? "−?" : `−${value}`;
}

function selectVisibleActors(scene: EncounterSceneState): EncounterSceneActor[] {
  return (["heroes", "enemies"] as const).flatMap((team) => {
    const limit = team === "heroes" ? DUNGEON_SCENE_HERO_LIMIT : DUNGEON_SCENE_ENEMY_LIMIT;
    return scene.actors
      .filter((actor) => actor.team === team)
      .sort((left, right) => left.slot - right.slot)
      .slice(0, limit);
  });
}

export function createDungeonCombatSceneView(
  scene: EncounterSceneState,
  enemyRoles: readonly DungeonCombatEnemyRole[] = [],
): DungeonCombatSceneView {
  const selectedActors = selectVisibleActors(scene);
  const selectedIds = new Set(selectedActors.map((actor) => actor.id));
  const selectedIndexById = new Map<string, number>();
  for (const team of ["heroes", "enemies"] as const) {
    selectedActors.filter((actor) => actor.team === team).forEach((actor, index) => {
      selectedIndexById.set(actor.id, index);
    });
  }
  const mode = actionMode(scene);
  const step = scene.complete ? null : scene.activeStep;
  const activeActor = step?.sourceActorId
    ? selectedActors.find((actor) => actor.id === step.sourceActorId && actorState(actor) !== "ko")
    : undefined;
  const visibleImpacts = mode !== "melee" || !step
    ? []
    : step.impacts.filter((impact) => selectedIds.has(impact.targetActorId));
  const effectImpacts = visibleImpacts.slice(0, DUNGEON_COMBAT_EFFECT_LIMIT);
  const targetOffsets = new Map<string, number>();
  const effects = effectImpacts.flatMap((impact): DungeonCombatSceneEffectView[] => {
    const target = selectedActors.find((actor) => actor.id === impact.targetActorId);
    if (!target) return [];
    const offset = targetOffsets.get(target.id) ?? 0;
    targetOffsets.set(target.id, offset + 1);
    const kind = effectKind(step, impact);
    return [{
      id: impact.id,
      targetActorId: target.id,
      kind,
      label: effectLabel(kind, impact),
      offset,
    }];
  });
  const impactsByActorId = new Map(visibleImpacts.map((impact) => [impact.targetActorId, impact]));
  const rolesById = new Map(enemyRoles.map((enemy) => [enemy.id, enemy.role ?? "Ennemi"]));
  const actors = selectedActors.flatMap((actor): DungeonCombatSceneActorView[] => {
    const selectedIndex = selectedIndexById.get(actor.id);
    if (selectedIndex === undefined) return [];
    const standard = getDungeonSceneSlot(actor.team, selectedIndex, "standard");
    const zoomed = getDungeonSceneSlot(actor.team, selectedIndex, "zoomed");
    const idleRhythm = idleRhythms[actor.team][selectedIndex];
    if (!standard || !zoomed || !idleRhythm) return [];
    const active = actor.id === activeActor?.id;
    return [{
      id: actor.id,
      team: actor.team,
      name: actor.name,
      role: actor.team === "heroes" ? heroRole(actor) : rolesById.get(actor.sourceId ?? "") ?? "Ennemi",
      visualKey: actorVisualKey(actor),
      currentHp: actor.currentHp,
      maximumHp: actor.maximumHp,
      healthPercent: percentage(actor.currentHp, actor.maximumHp),
      state: actorState(actor),
      active,
      motion: mode === "entry" ? "enter" : active ? mode === "melee" ? "melee" : "focus" : "idle",
      reaction: impactReaction(actor, impactsByActorId.get(actor.id)),
      idleDurationMs: idleRhythm.durationMs,
      idleDelayMs: idleRhythm.delayMs,
      standard,
      zoomed,
    }];
  });
  const actionSummary = scene.complete
    ? scene.result === "victory"
      ? "Victoire."
      : scene.result === "defeat"
        ? "Défaite."
        : "Combat terminé."
    : step?.summary ?? "Les équipes prennent position.";

  return {
    actionKey: step?.id ?? `${scene.encounterId}:${mode}`,
    actionMode: mode,
    actionSummary,
    environment: selectedActors.some((actor) => actor.contentKey?.startsWith("rat-pack:"))
      ? "sewers"
      : "fallback",
    actors,
    effects,
    result: scene.result,
  };
}
