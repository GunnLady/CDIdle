import { useEffect, useState, type CSSProperties } from "react";
import { ENCOUNTER_VISUAL_KEYS } from "../../assets/encounterVisuals";
import { getUndercityBackgroundVisualKey } from "../../assets/undercityVisualManifest";
import {
  DUNGEON_COMBAT_ACTION_EFFECT_DURATION_MS,
  DUNGEON_COMBAT_ACTION_IMPACT_DELAY_MS,
  DUNGEON_COMBAT_ACTION_TRAVEL_DURATION_MS,
  DUNGEON_COMBAT_EFFECT_DURATION_MS,
  DUNGEON_COMBAT_EFFECT_LIMIT,
  DUNGEON_COMBAT_EFFECT_STAGGER_MS,
  type DungeonCombatSceneActionEffectView,
  type DungeonCombatSceneActorView,
  type DungeonCombatSceneEffectView,
  type DungeonCombatSceneView,
} from "../../domain/dungeonCombatScene";
import { useEncounterVisualAsset } from "../../hooks/useEncounterVisualAsset";
import { useDungeonCombatEffectStream } from "../../hooks/useDungeonCombatEffectStream";
import styles from "./DungeonCombatScene.module.css";

type SceneStyle = CSSProperties & Record<`--${string}`, string | number>;

function getBackgroundKey(environment: DungeonCombatSceneView["environment"]): string {
  if (environment === "fallback") return ENCOUNTER_VISUAL_KEYS.fallback.background;
  if (environment === "challenge-chamber") return ENCOUNTER_VISUAL_KEYS.encounters.trap.background;
  if (environment === "rest-chamber") return ENCOUNTER_VISUAL_KEYS.encounters.rest.background;
  if (environment === "treasure-vault") return ENCOUNTER_VISUAL_KEYS.encounters.treasure.background;
  return getUndercityBackgroundVisualKey(environment);
}

const nonCombatLabels = {
  treasure: "Trésor",
  rest: "Repos",
  trap: "Piège",
  enigma: "Énigme",
  ambush: "Embuscade",
  ritual: "Rituel",
  obstacle: "Obstacle",
  negotiation: "Négociation",
} as const satisfies Record<NonNullable<DungeonCombatSceneView["nonCombat"]>, string>;

function actorHealthLabel(actor: DungeonCombatSceneActorView): string {
  if (actor.currentHp === null || actor.maximumHp === null) {
    return actor.team === "heroes" ? "PV historiques du héros inconnus" : "PV historiques inconnus";
  }
  return `${actor.currentHp}/${actor.maximumHp} PV`;
}

function useDelayedPresentationValue<T>(value: T, delayMs: number, animationsEnabled: boolean): T {
  const [displayedValue, setDisplayedValue] = useState(value);

  useEffect(() => {
    if (!animationsEnabled || delayMs <= 0) {
      setDisplayedValue(value);
      return undefined;
    }
    const timeout = globalThis.setTimeout(() => setDisplayedValue(value), delayMs);
    return () => globalThis.clearTimeout(timeout);
  }, [animationsEnabled, delayMs, value]);

  return displayedValue;
}

function VisualAsset({ className, testId, visualKey }: {
  className: string;
  testId?: string;
  visualKey: string;
}) {
  const visual = useEncounterVisualAsset(visualKey);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = visual.url === failedUrl ? null : visual.url;
  const style = {
    "--visual-scale": visual.descriptor.scale,
    "--visual-anchor-x": `${visual.descriptor.anchor.x * 100}%`,
    "--visual-anchor-y": `${visual.descriptor.anchor.y * 100}%`,
  } as SceneStyle;

  return (
    <div
      className={className}
      data-asset-status={visual.loading ? "loading" : url ? visual.status : "fallback"}
      data-testid={testId}
      data-visual-key={visualKey}
    >
      {url
        ? <img
            alt=""
            className={styles.sprite}
            draggable={false}
            onError={() => setFailedUrl(url)}
            src={url}
            style={style}
          />
        : <span aria-hidden="true">{visual.descriptor.fallbackGlyph || "?"}</span>}
    </div>
  );
}

function ResourceBar(props: {
  actorName: string;
  kind: "health" | "mana";
  percentage: number | null;
  current: number | null;
  maximum: number | null;
  delayMs: number;
}) {
  if (props.percentage === null || props.current === null || props.maximum === null) return null;
  const resource = props.kind === "health" ? "PV" : "PM";
  return (
    <span
      aria-label={`${resource} de ${props.actorName} : ${props.current} sur ${props.maximum}`}
      aria-valuemax={props.maximum}
      aria-valuemin={0}
      aria-valuenow={props.current}
      className={styles.vitalBar}
      data-resource={props.kind}
      role="progressbar"
      style={{ "--resource-delay": `${props.delayMs}ms` } as SceneStyle}
    >
      <span style={{ width: `${props.percentage}%` }} />
    </span>
  );
}

function CombatActor(props: {
  actor: DungeonCombatSceneActorView;
  actionKey: string;
  animationsEnabled: boolean;
  effects: DungeonCombatSceneEffectView[];
  key?: string;
}) {
  const { actor } = props;
  const displayedCurrentHp = useDelayedPresentationValue(
    actor.currentHp,
    actor.healthDelayMs,
    props.animationsEnabled,
  );
  const displayedState = useDelayedPresentationValue(
    actor.state,
    actor.healthDelayMs,
    props.animationsEnabled,
  );
  const style = {
    "--actor-x": `${actor.standard.xPercent}%`,
    "--actor-y": `${actor.standard.yPercent}%`,
    "--actor-scale": actor.standard.scale,
    "--actor-layer": actor.standard.layer,
    "--actor-zoom-x": `${actor.zoomed.xPercent}%`,
    "--actor-zoom-y": `${actor.zoomed.yPercent}%`,
    "--actor-zoom-scale": actor.zoomed.scale,
    "--actor-idle-duration": `${actor.idleDurationMs}ms`,
    "--actor-idle-delay": `${actor.idleDelayMs}ms`,
    "--actor-meta-offset-y": actor.metaOffsetYPercent,
  } as SceneStyle;
  const health = actorHealthLabel({ ...actor, currentHp: displayedCurrentHp });
  const stateLabel = displayedState === "ko" ? "KO" : displayedState === "wounded" ? "Blessé" : "Prêt";

  return (
    <li
      aria-label={`${actor.name}, ${actor.role}, ${health}, ${stateLabel}`}
      className={styles.actor}
      data-active={actor.active}
      data-actor-id={actor.id}
      data-state={displayedState}
      data-team={actor.team}
      data-testid="dungeon-combat-actor"
      style={style}
    >
      <div
        key={actor.active || actor.reaction !== "none" ? `${actor.id}:${props.actionKey}:motion` : `${actor.id}:idle`}
        className={styles.motionLayer}
        data-motion={actor.motion}
      >
        <div className={styles.idleLayer} data-idle-motion="true">
          <div className={styles.reactionLayer} data-reaction={actor.reaction}>
            <VisualAsset
              className={styles.visualShell}
              testId="dungeon-combat-visual"
              visualKey={actor.visualKey ?? ENCOUNTER_VISUAL_KEYS.fallback.actor}
            />
          </div>
        </div>
      </div>
      <div className={styles.actorMeta}>
        <span className={styles.actorName}>{actor.name}</span>
        <ResourceBar
          actorName={actor.name}
          current={actor.currentHp}
          kind="health"
          maximum={actor.maximumHp}
          percentage={actor.healthPercent}
          delayMs={actor.healthDelayMs}
        />
        <ResourceBar
          actorName={actor.name}
          current={actor.currentMana}
          kind="mana"
          maximum={actor.maximumMana}
          percentage={actor.manaPercent}
          delayMs={actor.manaDelayMs}
        />
        <span className={actor.healthPercent === null ? styles.unknownVital : styles.vitalText}>{health}</span>
      </div>
      {props.effects.map((effect) => (
        <CombatEffect key={`${props.actionKey}:${effect.id}`} actorName={actor.name} effect={effect} />
      ))}
    </li>
  );
}

function CombatEffect({ actorName, effect }: {
  actorName: string;
  effect: DungeonCombatSceneEffectView;
  key?: string;
}) {
  const style = {
    "--effect-delay": `${(effect.delayMs ?? 0) + (effect.offset * DUNGEON_COMBAT_EFFECT_STAGGER_MS)}ms`,
    "--effect-duration": `${DUNGEON_COMBAT_EFFECT_DURATION_MS}ms`,
    "--effect-static-y": `${effect.offset * 1.45}rem`,
  } as SceneStyle;
  return (
    <output
      aria-label={`${effect.label}, ${actorName}`}
      className={styles.effect}
      data-kind={effect.kind}
      data-target-actor-id={effect.targetActorId}
      data-testid="dungeon-combat-effect"
      data-visual-key={ENCOUNTER_VISUAL_KEYS.effects.physicalImpact}
      style={style}
    >
      {effect.label}
    </output>
  );
}

function actionEffectVisualKey(kind: DungeonCombatSceneActionEffectView["kind"]): string {
  return ENCOUNTER_VISUAL_KEYS.effects[kind];
}

function ActionEffectGlyph({ kind }: { kind: DungeonCombatSceneActionEffectView["kind"] }) {
  return kind === "projectile"
    ? <path className={styles.actionEffectPayloadGlyph} d="M -1.8 -0.7 L 1.8 0 L -1.8 0.7 L -1.05 0 Z" />
    : <circle className={styles.actionEffectPayloadGlyph} cx="0" cy="0" r="1.05" />;
}

function CombatActionEffect({ effect }: { effect: DungeonCombatSceneActionEffectView; key?: string }) {
  const deltaX = effect.target.xPercent - effect.source.xPercent;
  const deltaY = effect.target.yPercent - effect.source.yPercent;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  const control = {
    x: effect.source.xPercent + (deltaX * 0.5),
    y: Math.min(effect.source.yPercent, effect.target.yPercent) - Math.min(7, Math.max(2.5, Math.abs(deltaX) * 0.09)),
  };
  const path = `M ${effect.source.xPercent} ${effect.source.yPercent} Q ${control.x} ${control.y} ${effect.target.xPercent} ${effect.target.yPercent}`;
  const midpoint = {
    x: (0.25 * effect.source.xPercent) + (0.5 * control.x) + (0.25 * effect.target.xPercent),
    y: (0.25 * effect.source.yPercent) + (0.5 * control.y) + (0.25 * effect.target.yPercent),
  };
  const effectDelayMs = effect.offset * DUNGEON_COMBAT_EFFECT_STAGGER_MS;
  const style = {
    "--effect-delay": `${effectDelayMs}ms`,
    "--effect-impact-delay": `${effectDelayMs + DUNGEON_COMBAT_ACTION_IMPACT_DELAY_MS}ms`,
    "--action-effect-duration": `${DUNGEON_COMBAT_ACTION_EFFECT_DURATION_MS}ms`,
    "--action-travel-duration": `${DUNGEON_COMBAT_ACTION_TRAVEL_DURATION_MS}ms`,
  } as SceneStyle;
  return (
    <g
      data-kind={effect.kind}
      data-source-actor-id={effect.sourceActorId}
      data-target-actor-id={effect.targetActorId}
      data-testid="dungeon-combat-action-effect"
      data-visual-key={actionEffectVisualKey(effect.kind)}
      style={style}
    >
      <path
        className={styles.actionEffectTrail}
        d={path}
        vectorEffect="non-scaling-stroke"
      />
      <g className={styles.actionEffectPayload} data-testid="dungeon-combat-action-payload">
        <g
          className={styles.actionEffectPayloadAnimated}
        >
          <animateMotion
            begin={`${effect.offset * DUNGEON_COMBAT_EFFECT_STAGGER_MS}ms`}
            dur={`${DUNGEON_COMBAT_ACTION_TRAVEL_DURATION_MS}ms`}
            fill="freeze"
            path={path}
            rotate={effect.kind === "projectile" ? "auto" : undefined}
          />
          <ActionEffectGlyph kind={effect.kind} />
        </g>
        <g
          className={styles.actionEffectPayloadStatic}
          transform={`translate(${midpoint.x} ${midpoint.y}) rotate(${angle})`}
        >
          <ActionEffectGlyph kind={effect.kind} />
        </g>
      </g>
      <circle
        className={styles.actionEffectImpact}
        cx={effect.target.xPercent}
        cy={effect.target.yPercent}
        r={0.9}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

type StreamedCombatEffect =
  | { id: string; offset: number; delayMs: number; type: "label"; value: DungeonCombatSceneEffectView }
  | { id: string; offset: number; delayMs: number; type: "action"; value: DungeonCombatSceneActionEffectView };

export default function DungeonCombatScene({
  view,
  animationsEnabled = true,
}: {
  view: DungeonCombatSceneView;
  animationsEnabled?: boolean;
}) {
  const backgroundKey = getBackgroundKey(view.environment);
  const background = useEncounterVisualAsset(backgroundKey);
  const resultLabel = view.result === "victory" ? "Victoire" : view.result === "defeat" ? "Défaite" : null;
  const kind = view.nonCombat;
  const incomingEffects: StreamedCombatEffect[] = [
    ...view.actionEffects.map((effect) => ({
      id: effect.id,
      offset: effect.offset,
      delayMs: 0,
      type: "action" as const,
      value: effect,
    })),
    ...view.effects.map((effect) => ({
      id: effect.id,
      offset: effect.offset,
      delayMs: effect.delayMs ?? 0,
      type: "label" as const,
      value: effect,
    })),
  ];
  const streamedEffects = useDungeonCombatEffectStream({
    actionKey: view.actionKey,
    effects: incomingEffects,
    animationsEnabled,
    durationMs: DUNGEON_COMBAT_EFFECT_DURATION_MS,
    staggerMs: DUNGEON_COMBAT_EFFECT_STAGGER_MS,
    limit: DUNGEON_COMBAT_EFFECT_LIMIT,
  });
  const labelEffects = streamedEffects
    .filter((effect): effect is Extract<StreamedCombatEffect, { type: "label" }> => effect.type === "label")
    .map((effect) => effect.value);
  const actionEffects = streamedEffects
    .filter((effect): effect is Extract<StreamedCombatEffect, { type: "action" }> => effect.type === "action")
    .map((effect) => effect.value);

  return (
    <section
      aria-label="Scène de rencontre"
      className={styles.scene}
      data-action-mode={view.actionMode}
      data-animations={animationsEnabled ? "enabled" : "disabled"}
      data-encounter-kind={kind}
      data-encounter-outcome={view.nonCombatOutcome ?? undefined}
      data-testid="dungeon-combat-scene"
      style={{
        "--combat-action-duration": `${DUNGEON_COMBAT_ACTION_EFFECT_DURATION_MS}ms`,
        "--combat-impact-delay": `${DUNGEON_COMBAT_ACTION_IMPACT_DELAY_MS}ms`,
        "--combat-travel-duration": `${DUNGEON_COMBAT_ACTION_TRAVEL_DURATION_MS}ms`,
      } as SceneStyle}
      tabIndex={0}
    >
      <p aria-live="polite" className="sr-only">{view.actionSummary}</p>
      <div
        className={styles.stage}
        data-asset-status={background.loading ? "loading" : background.status}
        data-testid="dungeon-combat-stage"
        style={{ "--stage-art": background.url ? `url("${background.url}")` : "none" } as SceneStyle}
      >
        <ol className="m-0 list-none p-0" aria-label="Acteurs présents">
          {view.actors.map((actor) => <CombatActor
            key={actor.id}
            actionKey={view.actionKey}
            actor={actor}
            animationsEnabled={animationsEnabled}
            effects={labelEffects.filter((effect) => effect.targetActorId === actor.id)}
          />)}
        </ol>
        {actionEffects.length > 0 && (
          <svg
            aria-hidden="true"
            className={styles.actionEffects}
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {actionEffects.map((effect) => (
              <CombatActionEffect effect={effect} key={`${view.actionKey}:${effect.id}`} />
            ))}
          </svg>
        )}
        {kind && <>
          <VisualAsset
            className={styles.accessory}
            testId="dungeon-non-combat-accessory"
            visualKey={ENCOUNTER_VISUAL_KEYS.encounters[kind].prop}
          />
          <ul
            aria-label={nonCombatLabels[kind]}
            className={styles.nonCombatSummary}
          >
            {(view.nonCombatDetails ?? [view.actionSummary]).map((detail, index) => (
              <li
                className={styles.nonCombatSummaryItem}
                data-testid="dungeon-non-combat-summary-item"
                key={`${view.actionKey}:summary:${index}`}
                style={{ "--summary-delay": `${index * DUNGEON_COMBAT_EFFECT_STAGGER_MS}ms` } as SceneStyle}
              >
                {detail}
              </li>
            ))}
          </ul>
        </>}
        {!kind && view.actionMode === "neutral" && (
          <p className={styles.neutralNotice} data-testid="dungeon-combat-neutral-action">
            Action avancée fidèle au journal.
          </p>
        )}
        {!kind && resultLabel && view.actionMode === "result" && (
          <div className={styles.result} data-result={view.result} data-testid="dungeon-combat-result">
            <strong>{resultLabel}</strong>
          </div>
        )}
      </div>
    </section>
  );
}
