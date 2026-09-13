import { UNDERCITY_ZONES, type UndercityZoneId } from "../../shared/domain/undercity";
import type { DungeonChallengeKind } from "../../shared/domain/dungeon-challenges";
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
import {
  getDungeonCombatActionProfile,
  type DungeonCombatActionProfile,
} from "./dungeonCombatActionProfile";

export const DUNGEON_COMBAT_EFFECT_LIMIT = 16;
export const DUNGEON_COMBAT_EFFECT_STAGGER_MS = 600;
export const DUNGEON_COMBAT_EFFECT_DURATION_MS = 1_000;
export const DUNGEON_COMBAT_ACTION_EFFECT_DURATION_MS = 720;
export const DUNGEON_COMBAT_ACTION_TRAVEL_DURATION_MS = 430;
export const DUNGEON_COMBAT_ACTION_IMPACT_DELAY_MS = 430;
export const DUNGEON_COMBAT_MELEE_IMPACT_DELAY_MS = 160;

export type DungeonCombatActionMode = "entry" | "idle" | DungeonCombatActionProfile | "result";
export type DungeonCombatActorMotion = "enter" | "idle" | "melee" | "ranged" | "cast" | "focus";
export type DungeonCombatActorReaction = "none" | "impact" | "dodge" | "ko";
export type DungeonCombatEffectKind =
  | "damage"
  | "critical"
  | "dodge"
  | "defeat"
  | "recovery-health"
  | "recovery-mana"
  | "mana-spent"
  | "revival";
export type DungeonCombatActionEffectKind = "projectile" | "magic" | "healing" | "support";

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
  healthDelayMs: number;
  manaDelayMs: number;
  state: "ready" | "wounded" | "ko";
  active: boolean;
  motion: DungeonCombatActorMotion;
  reaction: DungeonCombatActorReaction;
  idleDurationMs: number;
  idleDelayMs: number;
  metaOffsetYPercent: number;
  standard: DungeonSceneSlot;
  zoomed: DungeonSceneSlot;
}

export interface DungeonCombatSceneEffectView {
  id: string;
  targetActorId: string;
  kind: DungeonCombatEffectKind;
  label: string;
  offset: number;
  delayMs: number;
}

export interface DungeonCombatSceneActionEffectView {
  id: string;
  kind: DungeonCombatActionEffectKind;
  sourceActorId: string;
  targetActorId: string;
  source: { xPercent: number; yPercent: number };
  target: { xPercent: number; yPercent: number };
  offset: number;
}

export interface DungeonCombatSceneView {
  actionKey: string;
  actionMode: DungeonCombatActionMode;
  actionSummary: string;
  environment: UndercityZoneId | "treasure-vault" | "rest-chamber" | "challenge-chamber" | "fallback";
  actors: DungeonCombatSceneActorView[];
  effects: DungeonCombatSceneEffectView[];
  actionEffects: DungeonCombatSceneActionEffectView[];
  result: EncounterSceneResult | null;
  nonCombat?: "treasure" | "rest" | DungeonChallengeKind;
  nonCombatOutcome?: EncounterSceneResult | null;
  nonCombatDetails?: string[];
}

export interface DungeonCombatEnemyRole {
  id: string;
  role?: string;
}

const ENTRY_EVENT_TYPES = ["combat.start", "encounter.started"];

let undercityZoneByBlueprintId: Map<string, UndercityZoneId> | null = null;

function getUndercityEnvironment(contentKey: string | null): UndercityZoneId | null {
  if (!contentKey) return null;
  if (!undercityZoneByBlueprintId) {
    undercityZoneByBlueprintId = new Map(UNDERCITY_ZONES.flatMap((zone) => (
      [...zone.encounters, zone.elite, zone.boss].map((blueprint) => [blueprint.id, zone.id])
    )));
  }
  return undercityZoneByBlueprintId.get(contentKey.split(":", 1)[0]) ?? null;
}

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
  return actor.contentKey
    ? `undercity:${actor.contentKey}${actor.visualVariant ? `:${actor.visualVariant}` : ""}`
    : null;
}

const actorPositionOffsets: Readonly<Record<string, { xPercent: number; yPercent: number }>> = {
  "pipe-slime:a": { xPercent: 5, yPercent: 0 },
  "colossal-rat:a": { xPercent: 5, yPercent: 0 },
  "sewer-warden:a": { xPercent: -2, yPercent: 0 },
  "vermin-mother:a": { xPercent: 10, yPercent: 0 },
};

const actorStandardPositionOffsets: Readonly<Record<string, { xPercent: number; yPercent: number }>> = {
  "hound-handler:a": { xPercent: -4, yPercent: 0 },
  "smuggler-captain:a": { xPercent: -2, yPercent: 1 },
  "smuggler-captain:b": { xPercent: -1, yPercent: 0 },
  "smuggler-captain:c": { xPercent: 0, yPercent: -1 },
  "tribute-collector:a": { xPercent: -2, yPercent: 1 },
  "tribute-collector:b": { xPercent: -1, yPercent: 0 },
  "tribute-collector:c": { xPercent: 0, yPercent: -1 },
  "water-parasites:a": { xPercent: -1, yPercent: 2 },
  "water-parasites:b": { xPercent: 1, yPercent: 5 },
  "water-parasites:c": { xPercent: 5, yPercent: 1 },
  "reservoir-slime:a": { xPercent: 0, yPercent: 4 },
  "refuge-warden:a": { xPercent: 0, yPercent: 4 },
  "cistern-leeches:a": { xPercent: -1, yPercent: 4 },
  "cistern-leeches:b": { xPercent: 0, yPercent: 10 },
  "valve-sentinel:a": { xPercent: 0, yPercent: 3 },
  "valve-sentinel:b": { xPercent: 2, yPercent: 5 },
  "dead-water-warden:a": { xPercent: 0, yPercent: 2 },
  "bastion-defenders:b": { xPercent: 0, yPercent: -3 },
  "bastion-defenders:c": { xPercent: 1, yPercent: 0 },
  "barricade-warden:b": { xPercent: -1, yPercent: -1 },
  "outcast-standard-bearer:a": { xPercent: -2, yPercent: 0 },
  "outcast-standard-bearer:b": { xPercent: 0, yPercent: -1 },
  "court-guard:a": { xPercent: -1, yPercent: 0 },
  "court-guard:b": { xPercent: -1, yPercent: -1 },
  "court-vermin:a": { xPercent: -1, yPercent: 1 },
  "chamberlain-escort:a": { xPercent: -2, yPercent: 0 },
  "chamberlain-escort:b": { xPercent: -1, yPercent: -1 },
  "king-herald:a": { xPercent: -2, yPercent: 0 },
  "king-herald:b": { xPercent: -1, yPercent: 0 },
  "rat-king:a": { xPercent: -5, yPercent: 0 },
  "rat-king:b": { xPercent: -6, yPercent: -1 },
};

const actorMetaOffsetsYPercent: Readonly<Record<string, number>> = {
  "sewer-warden:b": 2,
};

const environmentStandardSlotOffsets: Readonly<Record<string, { xPercent: number; yPercent: number }>> = {
  "smugglers:heroes:0": { xPercent: 0, yPercent: 2 },
  "smugglers:heroes:1": { xPercent: 0, yPercent: 8 },
  "smugglers:heroes:2": { xPercent: 0, yPercent: 2 },
  "cisterns:heroes:0": { xPercent: 1, yPercent: 5 },
  "cisterns:heroes:1": { xPercent: 1, yPercent: 12 },
  "cisterns:heroes:2": { xPercent: 1, yPercent: 10 },
  "cisterns:heroes:3": { xPercent: 1, yPercent: 2 },
};

function applyActorPositionOffset(
  slot: DungeonSceneSlot,
  contentKey: string | null,
): DungeonSceneSlot {
  const offset = contentKey ? actorPositionOffsets[contentKey] : undefined;
  if (!offset) return slot;
  return {
    ...slot,
    xPercent: slot.xPercent + offset.xPercent,
    yPercent: slot.yPercent + offset.yPercent,
  };
}

function applyActorStandardPositionOffset(
  slot: DungeonSceneSlot,
  contentKey: string | null,
): DungeonSceneSlot {
  const offset = contentKey ? actorStandardPositionOffsets[contentKey] : undefined;
  if (!offset) return slot;
  return {
    ...slot,
    xPercent: slot.xPercent + offset.xPercent,
    yPercent: slot.yPercent + offset.yPercent,
  };
}

function applyEnvironmentStandardSlotOffset(
  slot: DungeonSceneSlot,
  environment: UndercityZoneId | null,
  team: EncounterSceneTeam,
  index: number,
): DungeonSceneSlot {
  const offset = environment
    ? environmentStandardSlotOffsets[`${environment}:${team}:${index}`]
    : undefined;
  if (!offset) return slot;
  return {
    ...slot,
    xPercent: slot.xPercent + offset.xPercent,
    yPercent: slot.yPercent + offset.yPercent,
  };
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
  if (ENTRY_EVENT_TYPES.includes(step.type)) return "entry";
  if (step.result) return "result";
  return getDungeonCombatActionProfile(step);
}

function impactReaction(
  actor: EncounterSceneActor,
  impacts: readonly EncounterSceneImpact[],
): DungeonCombatActorReaction {
  if (impacts.some((impact) => (
    impact.knockedOutAfter === true || actor.knockedOut === true || impact.hp?.after === 0
  ))) return "ko";
  if (impacts.some((impact) => impact.kind === "dodge")) return "dodge";
  if (impacts.some((impact) => impact.kind === "damage" || impact.kind === "defeat")) return "impact";
  return "none";
}

type EffectDetail = readonly [idSuffix: string, kind: DungeonCombatEffectKind, label: string];

function effectDetails(step: EncounterSceneStep, impact: EncounterSceneImpact): EffectDetail[] {
  if (impact.kind === "resource" && impact.mana) {
    const delta = impact.mana.after - impact.mana.before;
    if (delta === 0) return [];
    const total = impact.mana.maximum === null ? impact.mana.after : `${impact.mana.after}/${impact.mana.maximum}`;
    return [[
      "mana",
      delta < 0 ? "mana-spent" : "recovery-mana",
      `PM ${delta < 0 ? "−" : "+"}${Math.abs(delta)} · ${total}`,
    ]];
  }
  const recovery = step.type === "party.restored" || impact.kind === "healing" || impact.kind === "recovery";
  if (!recovery) {
    const kind = impact.kind === "dodge"
      ? "dodge"
      : impact.critical === true || step.type === "hero.hit.critical"
        ? "critical"
        : impact.kind === "defeat" ? "defeat" : "damage";
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

function actorMotion(mode: DungeonCombatActionMode, active: boolean): DungeonCombatActorMotion {
  if (mode === "entry") return "enter";
  if (!active) return "idle";
  if (mode === "melee") return "melee";
  if (mode === "projectile") return "ranged";
  if (mode === "magic" || mode === "healing" || mode === "support") return "cast";
  return "focus";
}

function actionEffectKind(mode: DungeonCombatActionMode): DungeonCombatActionEffectKind | null {
  return mode === "projectile" || mode === "magic" || mode === "healing" || mode === "support"
    ? mode
    : null;
}

function effectDelayMs(
  mode: DungeonCombatActionMode,
  kind: DungeonCombatEffectKind,
): number {
  if (kind === "mana-spent" || kind === "recovery-mana") return 0;
  if (mode === "projectile" || mode === "magic" || mode === "healing" || mode === "support") {
    return DUNGEON_COMBAT_ACTION_IMPACT_DELAY_MS;
  }
  if (mode === "melee" && (kind === "damage" || kind === "critical" || kind === "defeat")) {
    return DUNGEON_COMBAT_MELEE_IMPACT_DELAY_MS;
  }
  return 0;
}

function actorResourceDelayMs(
  impacts: readonly EncounterSceneImpact[],
  mode: DungeonCombatActionMode,
  resource: "health" | "mana",
): number {
  const changes = impacts.filter((impact) => {
    const value = resource === "health" ? impact.hp : impact.mana;
    return value !== null && value.after !== value.before;
  });
  if (changes.length === 0) return 0;
  if (resource === "mana") return 0;
  const baseDelay = mode === "projectile" || mode === "magic" || mode === "healing" || mode === "support"
    ? DUNGEON_COMBAT_ACTION_IMPACT_DELAY_MS
    : mode === "melee" ? DUNGEON_COMBAT_MELEE_IMPACT_DELAY_MS : 0;
  return baseDelay + ((changes.length - 1) * DUNGEON_COMBAT_EFFECT_STAGGER_MS);
}

function actionEffectPoint(actor: DungeonCombatSceneActorView): { xPercent: number; yPercent: number } {
  const lift = Math.max(8, Math.min(17, 10 * Math.sqrt(actor.standard.scale)));
  return {
    xPercent: actor.standard.xPercent,
    yPercent: actor.standard.yPercent - lift,
  };
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
  const visibleImpacts = step
    ? step.impacts.filter((impact) => selectedIds.has(impact.targetActorId))
    : [];
  const impactsByActorId = new Map<string, EncounterSceneImpact[]>();
  for (const impact of visibleImpacts) {
    const actorImpacts = impactsByActorId.get(impact.targetActorId) ?? [];
    actorImpacts.push(impact);
    impactsByActorId.set(impact.targetActorId, actorImpacts);
  }
  const rolesById = new Map(enemyRoles.map((enemy) => [enemy.id, enemy.role ?? "Ennemi"]));
  const environment = selections.reduce<UndercityZoneId | null>(
    (found, { actor }) => found ?? (actor.team === "enemies" ? getUndercityEnvironment(actor.contentKey) : null),
    null,
  );
  const actors = selections.flatMap(({ actor, index }): DungeonCombatSceneActorView[] => {
    const standardSlot = getDungeonSceneSlot(actor.team, index, "standard");
    const zoomedSlot = getDungeonSceneSlot(actor.team, index, "zoomed");
    const idleRhythm = idleRhythms[actor.team][index];
    if (!standardSlot || !zoomedSlot || !idleRhythm) return [];
    const standard = applyActorStandardPositionOffset(
      applyActorPositionOffset(
        applyEnvironmentStandardSlotOffset(standardSlot, environment, actor.team, index),
        actor.contentKey,
      ),
      actor.contentKey,
    );
    const zoomed = applyActorPositionOffset(zoomedSlot, actor.contentKey);
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
      healthDelayMs: actorResourceDelayMs(impactsByActorId.get(actor.id) ?? [], mode, "health"),
      manaDelayMs: actorResourceDelayMs(impactsByActorId.get(actor.id) ?? [], mode, "mana"),
      state: actorState(actor),
      active,
      motion: actorMotion(mode, active),
      reaction: impactReaction(actor, impactsByActorId.get(actor.id) ?? []),
      idleDurationMs: idleRhythm[0],
      idleDelayMs: idleRhythm[1],
      metaOffsetYPercent: actor.contentKey ? actorMetaOffsetsYPercent[actor.contentKey] ?? 0 : 0,
      standard,
      zoomed,
    }];
  });
  const actorsById = new Map(actors.map((actor) => [actor.id, actor]));
  const targetOffsets = new Map<string, number>();
  const effects: DungeonCombatSceneEffectView[] = [];
  const actionEffects: DungeonCombatSceneActionEffectView[] = [];
  const travelKind = actionEffectKind(mode);
  let visualEffectCount = 0;
  for (const impact of visibleImpacts) {
    const target = actorsById.get(impact.targetActorId);
    if (!target) continue;
    let offset = targetOffsets.get(target.id) ?? 0;
    const source = impact.sourceActorId ? actorsById.get(impact.sourceActorId) : undefined;
    const carriesAction = impact.kind === "damage"
      || impact.kind === "defeat"
      || impact.kind === "healing"
      || impact.kind === "recovery";
    if (
      visualEffectCount < DUNGEON_COMBAT_EFFECT_LIMIT
      && travelKind
      && source
      && source.id !== target.id
      && carriesAction
    ) {
      actionEffects.push({
        id: `${impact.id}:action`,
        kind: travelKind,
        sourceActorId: source.id,
        targetActorId: target.id,
        source: actionEffectPoint(source),
        target: actionEffectPoint(target),
        offset,
      });
      visualEffectCount += 1;
    }
    for (const [idSuffix, kind, label] of effectDetails(step!, impact)) {
      if (visualEffectCount >= DUNGEON_COMBAT_EFFECT_LIMIT) break;
      effects.push({
        id: `${impact.id}:${idSuffix}`,
        targetActorId: target.id,
        kind,
        label,
        offset,
        delayMs: effectDelayMs(mode, kind),
      });
      visualEffectCount += 1;
      offset += 1;
      targetOffsets.set(target.id, offset);
    }
  }
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
    environment: environment ?? "fallback",
    actors,
    effects,
    actionEffects,
    result: scene.result,
  };
}
