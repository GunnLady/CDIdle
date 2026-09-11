import type { CSSProperties } from "react";
import { ENCOUNTER_VISUAL_KEYS } from "../../assets/encounterVisuals";
import type {
  DungeonCombatSceneActorView,
  DungeonCombatSceneEffectView,
  DungeonCombatSceneView,
} from "../../domain/dungeonCombatScene";
import { useEncounterVisualAsset } from "../../hooks/useEncounterVisualAsset";
import styles from "./DungeonCombatScene.module.css";

type SceneStyle = CSSProperties & Record<`--${string}`, string | number>;

function actorHealthLabel(actor: DungeonCombatSceneActorView): string {
  if (actor.currentHp === null || actor.maximumHp === null) {
    return actor.team === "heroes" ? "PV historiques du héros inconnus" : "PV historiques inconnus";
  }
  return `${actor.currentHp}/${actor.maximumHp} PV`;
}

function ActorVisual({ actor }: { actor: DungeonCombatSceneActorView }) {
  const visualKey = actor.visualKey ?? ENCOUNTER_VISUAL_KEYS.fallback.actor;
  const visual = useEncounterVisualAsset(visualKey);
  const style = {
    "--visual-scale": visual.descriptor.scale,
    "--visual-anchor-x": `${visual.descriptor.anchor.x * 100}%`,
    "--visual-anchor-y": `${visual.descriptor.anchor.y * 100}%`,
  } as SceneStyle;

  return (
    <div
      className={styles.visualShell}
      data-asset-status={visual.loading ? "loading" : visual.status}
      data-testid="dungeon-combat-visual"
    >
      {visual.url
        ? <img
            alt=""
            aria-hidden="true"
            className={styles.sprite}
            draggable={false}
            src={visual.url}
            style={style}
          />
        : <span className={styles.fallbackGlyph} aria-hidden="true">{visual.descriptor.fallbackGlyph || "?"}</span>}
    </div>
  );
}

function VitalBar(props: {
  actorName: string;
  percentage: number | null;
  current: number | null;
  maximum: number | null;
}) {
  if (props.percentage === null || props.current === null || props.maximum === null) return null;
  return (
    <span
      aria-label={`PV de ${props.actorName} : ${props.current} sur ${props.maximum}`}
      aria-valuemax={props.maximum}
      aria-valuemin={0}
      aria-valuenow={props.current}
      className={styles.vitalBar}
      role="progressbar"
    >
      <span style={{ width: `${props.percentage}%` }} />
    </span>
  );
}

function CombatActor(props: {
  actor: DungeonCombatSceneActorView;
  actionKey: string;
  effects: DungeonCombatSceneEffectView[];
  key?: string;
}) {
  const { actor } = props;
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
  } as SceneStyle;
  const health = actorHealthLabel(actor);
  const stateLabel = actor.state === "ko" ? "KO" : actor.state === "wounded" ? "Blessé" : "Prêt";

  return (
    <li
      aria-label={`${actor.name}, ${actor.role}, ${health}, ${stateLabel}`}
      className={styles.actor}
      data-active={actor.active}
      data-actor-id={actor.id}
      data-state={actor.state}
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
            <ActorVisual actor={actor} />
          </div>
        </div>
      </div>
      <div className={styles.actorMeta}>
        <span className={styles.actorName}>{actor.name}</span>
        <VitalBar
          actorName={actor.name}
          current={actor.currentHp}
          maximum={actor.maximumHp}
          percentage={actor.healthPercent}
        />
        <span className={actor.healthPercent === null ? styles.unknownVital : styles.vitalText}>{health}</span>
      </div>
      {props.effects.map((effect) => <CombatEffect key={effect.id} actorName={actor.name} effect={effect} />)}
    </li>
  );
}

function CombatEffect({ actorName, effect }: {
  actorName: string;
  effect: DungeonCombatSceneEffectView;
  key?: string;
}) {
  const style = {
    "--effect-stack-x": `${((effect.offset % 4) - 1.5) * 1.15}rem`,
    "--effect-stack-y": `${Math.floor(effect.offset / 4) * 0.9}rem`,
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

export default function DungeonCombatScene({
  view,
  animationsEnabled = true,
}: {
  view: DungeonCombatSceneView;
  animationsEnabled?: boolean;
}) {
  const backgroundKey = view.environment === "sewers"
    ? ENCOUNTER_VISUAL_KEYS.sewers.background
    : ENCOUNTER_VISUAL_KEYS.fallback.background;
  const background = useEncounterVisualAsset(backgroundKey);
  const resultLabel = view.result === "victory" ? "Victoire" : view.result === "defeat" ? "Défaite" : null;

  return (
    <section
      aria-label="Scène du combat en cours"
      className={styles.scene}
      data-action-mode={view.actionMode}
      data-animations={animationsEnabled ? "enabled" : "disabled"}
      data-testid="dungeon-combat-scene"
    >
      <p aria-live="polite" className="sr-only">{view.actionSummary}</p>
      <div
        className={styles.stage}
        data-asset-status={background.loading ? "loading" : background.status}
        data-testid="dungeon-combat-stage"
        style={{ "--stage-art": background.url ? `url("${background.url}")` : "none" } as SceneStyle}
      >
        <ol className="m-0 list-none p-0" aria-label="Acteurs présents dans le combat">
          {view.actors.map((actor) => <CombatActor
            key={actor.id}
            actionKey={view.actionKey}
            actor={actor}
            effects={view.effects.filter((effect) => effect.targetActorId === actor.id)}
          />)}
        </ol>
        {view.actionMode === "neutral" && (
          <p className={styles.neutralNotice} data-testid="dungeon-combat-neutral-action">
            Action avancée fidèle au journal.
          </p>
        )}
        {resultLabel && view.actionMode === "result" && (
          <div className={styles.result} data-result={view.result} data-testid="dungeon-combat-result">
            <strong>{resultLabel}</strong>
          </div>
        )}
      </div>
    </section>
  );
}
