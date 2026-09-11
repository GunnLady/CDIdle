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
export type DungeonCombatEffectKind =
  | "damage"
  | "critical"
  | "dodge"
  | "defeat"
  | "recovery-health"
  | "recovery-mana"
  | "revival";

export interface DungeonCombatSceneActorView {
  id: string;
  team: EncounterSceneTeam;
  name: string;
  role: string;
  visualKey: string | null;
  currentHp: number | null;
  maximumHp: number | null;
  healthPercent: number | null;
  currentMana: number | null;
  maximumMana: number | null;
  manaPercent: number | null;
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
  environment: "sewers" | "treasure-vault" | "rest-chamber" | "fallback";
  actors: DungeonCombatSceneActorView[];
  effects: DungeonCombatSceneEffectView[];
  result: EncounterSceneResult | null;
  nonCombat?: "treasure" | "rest";
  nonCombatDetails?: string[];
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
    [3_400, -600],
    [3_700, -1_900],
    [3_200, -1_200],
    [3_900, -2_800],
  ],
  enemies: [
    [3_600, -2_400],
    [3_250, -900],
    [3_850, -1_700],
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
  if (impact.kind === "healing" || impact.kind === "recovery") return "none";
  if (impact.kind === "dodge") return "dodge";
  if (impact.knockedOutAfter === true || actor.knockedOut === true || impact.hp?.after === 0) return "ko";
  return "impact";
}

type EffectDetail = readonly [idSuffix: string, kind: DungeonCombatEffectKind, label: string];

function effectDetails(step: EncounterSceneStep, impact: EncounterSceneImpact): EffectDetail[] {
  const recovery = step.type === "party.restored" || impact.kind === "healing" || impact.kind === "recovery";
  if (!recovery) {
    const kind = impact.kind === "dodge"
      ? "dodge"
      : step.type === "hero.hit.critical" ? "critical" : impact.kind === "defeat" ? "defeat" : "damage";
    const value = impact.appliedValue ?? impact.announcedValue;
    const label = kind === "dodge"
      ? "Esquive"
      : impact.appliedValue === null && impact.announcedValue !== null
        ? `−${impact.announcedValue}?`
        : value === null ? "−?" : `−${value}`;
    return [["effect", kind, label]];
  }

  const details: EffectDetail[] = [];
  if (impact.hp?.before === 0 && impact.hp.after > 0) {
    details.push(["revival", "revival", "Réanimé"]);
  }
  if (impact.hp && impact.hp.after !== impact.hp.before) {
    const total = impact.hp.maximum === null ? impact.hp.after : `${impact.hp.after}/${impact.hp.maximum}`;
    details.push([
      "health",
      "recovery-health",
      `PV +${impact.hp.after - impact.hp.before} · ${total}`,
    ]);
  }
  if (impact.mana && impact.mana.after !== impact.mana.before) {
    const total = impact.mana.maximum === null ? impact.mana.after : `${impact.mana.after}/${impact.mana.maximum}`;
    details.push([
      "mana",
      "recovery-mana",
      `PM +${impact.mana.after - impact.mana.before} · ${total}`,
    ]);
  }
  return details;
}

function selectVisibleActors(scene: EncounterSceneState): Array<{ actor: EncounterSceneActor; index: number }> {
  return (["heroes", "enemies"] as const).flatMap((team) => {
    const limit = team === "heroes" ? DUNGEON_SCENE_HERO_LIMIT : DUNGEON_SCENE_ENEMY_LIMIT;
    return scene.actors
      .filter((actor) => actor.team === team)
      .sort((left, right) => left.slot - right.slot)
      .slice(0, limit)
      .map((actor, index) => ({ actor, index }));
  });
}

export function createDungeonCombatSceneView(
  scene: EncounterSceneState,
  enemyRoles: readonly DungeonCombatEnemyRole[] = [],
): DungeonCombatSceneView {
  const selections = selectVisibleActors(scene);
  const selectedIds = new Set(selections.map(({ actor }) => actor.id));
  const mode = actionMode(scene);
  const step = scene.complete ? null : scene.activeStep;
  const activeActor = step?.sourceActorId
    ? selections.find(({ actor }) => actor.id === step.sourceActorId && actorState(actor) !== "ko")?.actor
    : undefined;
  const visibleImpacts = !step || (mode !== "melee" && step.type !== "party.restored")
    ? []
    : step.impacts.filter((impact) => selectedIds.has(impact.targetActorId));
  const targetOffsets = new Map<string, number>();
  const effects = visibleImpacts.flatMap((impact): DungeonCombatSceneEffectView[] => {
    const target = selections.find(({ actor }) => actor.id === impact.targetActorId)?.actor;
    if (!target) return [];
    return effectDetails(step, impact).map(([idSuffix, kind, label]) => {
      const offset = targetOffsets.get(target.id) ?? 0;
      targetOffsets.set(target.id, offset + 1);
      return {
        id: `${impact.id}:${idSuffix}`,
        targetActorId: target.id,
        kind,
        label,
        offset,
      };
    });
  }).slice(0, DUNGEON_COMBAT_EFFECT_LIMIT);
  const impactsByActorId = new Map(visibleImpacts.map((impact) => [impact.targetActorId, impact]));
  const rolesById = new Map(enemyRoles.map((enemy) => [enemy.id, enemy.role ?? "Ennemi"]));
  const actors = selections.flatMap(({ actor, index }): DungeonCombatSceneActorView[] => {
    const standard = getDungeonSceneSlot(actor.team, index, "standard");
    const zoomed = getDungeonSceneSlot(actor.team, index, "zoomed");
    const idleRhythm = idleRhythms[actor.team][index];
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
      currentMana: actor.currentMana,
      maximumMana: actor.maximumMana,
      manaPercent: percentage(actor.currentMana, actor.maximumMana),
      state: actorState(actor),
      active,
      motion: mode === "entry" ? "enter" : active ? mode === "melee" ? "melee" : "focus" : "idle",
      reaction: impactReaction(actor, impactsByActorId.get(actor.id)),
      idleDurationMs: idleRhythm[0],
      idleDelayMs: idleRhythm[1],
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
    environment: selections.some(({ actor }) => actor.contentKey?.startsWith("rat-pack:"))
      ? "sewers"
      : "fallback",
    actors,
    effects,
    result: scene.result,
  };
}
