import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ENCOUNTER_VISUAL_KEYS } from "../../assets/encounterVisuals";
import HeroPortrait from "../../components/HeroPortrait";
import {
  createDungeonScenePrototypeFixture,
  DUNGEON_SCENE_PROTOTYPE_DURATION_MS,
  DUNGEON_SCENE_PROTOTYPE_KINDS,
  getDungeonScenePrototypeFrame,
  getDungeonScenePrototypePlacements,
  type DungeonScenePrototypeActor,
  type DungeonScenePrototypeKind,
} from "../../domain/dungeonScenePrototype";
import { useEncounterVisualAsset } from "../../hooks/useEncounterVisualAsset";
import Button from "../primitives/Button";
import styles from "./DungeonScenePrototype.module.css";

type PrototypeStyle = CSSProperties & Record<`--${string}`, string | number>;

const enemyGlyph = { rat: "R", guard: "G", king: "♛" } as const;

function PrototypeEnemyVisual({ actor }: { actor: DungeonScenePrototypeActor }) {
  const visual = useEncounterVisualAsset(actor.visualKey ?? ENCOUNTER_VISUAL_KEYS.fallback.actor);
  return <div
    className={styles.enemyShell}
    data-asset-status={visual.loading ? "loading" : visual.status}
    data-visual-key={actor.visualKey ?? ENCOUNTER_VISUAL_KEYS.fallback.actor}
  >
    {visual.url
      ? <img
          alt=""
          aria-hidden="true"
          className={styles.enemySprite}
          draggable={false}
          src={visual.url}
          style={{ "--enemy-visual-scale": visual.descriptor.scale } as PrototypeStyle}
        />
      : <span className={styles.enemyGlyph} data-glyph={actor.glyph} aria-hidden="true">{enemyGlyph[actor.glyph ?? "rat"]}</span>}
  </div>;
}

export default function DungeonScenePrototype() {
  const [kind, setKind] = useState<DungeonScenePrototypeKind>("battle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const elapsedMsRef = useRef(elapsedMs);
  const fixture = useMemo(() => createDungeonScenePrototypeFixture(kind), [kind]);
  const standard = useMemo(() => getDungeonScenePrototypePlacements(fixture, "standard"), [fixture]);
  const zoomed = useMemo(() => getDungeonScenePrototypePlacements(fixture, "zoomed"), [fixture]);
  const frame = getDungeonScenePrototypeFrame(fixture, elapsedMs, "standard");
  const zoomedFrame = getDungeonScenePrototypeFrame(fixture, elapsedMs, "zoomed");
  const stageVisualKey = kind === "waiting" || kind === "battle"
    ? ENCOUNTER_VISUAL_KEYS.sewers.background
    : ENCOUNTER_VISUAL_KEYS.fallback.background;
  const stageVisual = useEncounterVisualAsset(stageVisualKey);

  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  useEffect(() => {
    if (!playing) return undefined;
    const start = performance.now() - elapsedMsRef.current;
    const tick = (now: number) => {
      const next = (now - start) % DUNGEON_SCENE_PROTOTYPE_DURATION_MS;
      setElapsedMs(next);
      animationFrame.current = requestAnimationFrame(tick);
    };
    animationFrame.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    };
  }, [playing]);

  const selectKind = (next: DungeonScenePrototypeKind) => {
    setKind(next);
    setElapsedMs(0);
    setPlaying(false);
  };

  const restart = () => {
    setElapsedMs(0);
    setPlaying(kind !== "waiting");
  };

  const impactPlacement = fixture.impactTargetId
    ? standard.find((placement) => placement.actorId === fixture.impactTargetId)
    : undefined;
  const impactZoomedPlacement = fixture.impactTargetId
    ? zoomed.find((placement) => placement.actorId === fixture.impactTargetId)
    : undefined;

  return (
    <div className={styles.prototype} data-testid="dungeon-scene-prototype">
      <div className="mb-4 rounded-lg border border-ui-border-subtle bg-ui-surface p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ui-warning">Prototype de présentation · aucune commande de jeu</p>
            <h3 className="mt-1 font-serif text-base font-bold text-ui-text">{fixture.title}</h3>
            <p className="mt-1 text-xs text-ui-text-muted">{fixture.location}</p>
          </div>
          <span className="rounded-full border border-ui-border px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-ui-accent">{fixture.status}</span>
        </div>
        <p id="dungeon-scene-prototype-summary" className="mt-3 text-xs leading-relaxed text-ui-text">{fixture.summary}</p>
      </div>

      <div aria-label="États de la fixture" className="mb-3 flex flex-wrap gap-2">
        {DUNGEON_SCENE_PROTOTYPE_KINDS.map((entry) => {
          const candidate = createDungeonScenePrototypeFixture(entry);
          return <Button key={entry} size="sm" variant={entry === kind ? "primary" : "secondary"} aria-pressed={entry === kind} onClick={() => selectKind(entry)}>{candidate.label}</Button>;
        })}
      </div>

      <section
        aria-label={`Scène 2D : ${fixture.title}`}
        aria-describedby="dungeon-scene-prototype-summary"
        className={styles.stage}
        data-kind={kind}
        data-phase={frame.phase}
        data-asset-status={stageVisual.loading ? "loading" : stageVisual.status}
        data-testid="dungeon-scene-prototype-stage"
        style={{ "--stage-art": stageVisual.url ? `url("${stageVisual.url}")` : "none" } as PrototypeStyle}
      >
        <span className={styles.formationLabel} data-team="heroes">Escouade</span>
        <span className={styles.formationLabel} data-team="enemies">Rencontre</span>
        {fixture.object && <div className={styles.object} data-testid="dungeon-scene-object">
          <span className={styles.objectGlyph} aria-hidden="true">{fixture.object.glyph}</span>
          <span className={styles.objectLabel}>{fixture.object.label}</span>
        </div>}
        <ol className="m-0 list-none p-0" aria-label="Acteurs présents dans la scène">
          {fixture.actors.map((actor) => {
            const position = standard.find((placement) => placement.actorId === actor.id)!;
            const zoomedPosition = zoomed.find((placement) => placement.actorId === actor.id)!;
            const motion = frame.motions[actor.id];
            const zoomedMotion = zoomedFrame.motions[actor.id];
            const actorStyle: PrototypeStyle = {
              "--actor-x": `${position.xPercent}%`,
              "--actor-y": `${position.yPercent}%`,
              "--actor-scale": position.scale,
              "--actor-layer": position.layer,
              "--actor-zoom-x": `${zoomedPosition.xPercent}%`,
              "--actor-zoom-y": `${zoomedPosition.yPercent}%`,
              "--actor-zoom-scale": zoomedPosition.scale,
              "--actor-motion-x": `${motion.x}px`,
              "--actor-motion-y": `${motion.y}px`,
              "--actor-zoom-motion-x": `${zoomedMotion.x}px`,
              "--actor-zoom-motion-y": `${zoomedMotion.y}px`,
              "--actor-motion-scale": motion.scale,
              "--actor-motion-rotate": `${motion.rotate}deg`,
            };
            const hp = Math.round((Math.max(0, actor.hp) / actor.maxHp) * 100);
            const mana = actor.maxMana ? Math.round(((actor.mana ?? 0) / actor.maxMana) * 100) : null;
            const active = actor.id === fixture.focusActorId && frame.phase !== "idle" && frame.phase !== "result";
            return <li key={actor.id} className={styles.actor} style={actorStyle} data-active={active} data-actor-id={actor.id} data-state={actor.state} data-team={actor.team} data-testid="dungeon-scene-actor">
              {actor.hero ? <div className={styles.portraitShell}><HeroPortrait hero={actor.hero} size="xl" noBorder noBg noPadding className={styles.portrait} /></div> : <PrototypeEnemyVisual actor={actor} />}
              <div className={styles.actorMeta}>
                <span className={styles.name}>{actor.name}</span>
                <span className={styles.role}>{actor.role}{actor.state === "ko" ? " · KO" : actor.state === "guarding" ? " · Protection" : ""}</span>
                <span className={styles.bar} data-kind="hp"><span style={{ width: `${hp}%` }} /></span>
                {mana !== null && <span className={styles.bar} data-kind="mana"><span style={{ width: `${mana}%` }} /></span>}
              </div>
            </li>;
          })}
        </ol>
        {frame.impactVisible && impactPlacement && impactZoomedPlacement && <output
          className={styles.impact}
          data-visual-key={ENCOUNTER_VISUAL_KEYS.effects.physicalImpact}
          data-testid="dungeon-scene-impact"
          style={{
            "--impact-x": `${impactPlacement.xPercent}%`,
            "--impact-y": `${impactPlacement.yPercent}%`,
            "--impact-zoom-x": `${impactZoomedPlacement.xPercent}%`,
            "--impact-zoom-y": `${impactZoomedPlacement.yPercent}%`,
          } as PrototypeStyle}
        >{fixture.impactLabel}</output>}
      </section>

      <section aria-label="Contrôles temporels du prototype" className="mt-3 rounded-lg border border-ui-border-subtle bg-ui-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-ui-text-muted">Présentation uniquement</p>
            <p className="mt-1 text-xs text-ui-text"><strong>{frame.phaseLabel}</strong> · {Math.round(frame.elapsedMs)} ms</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setPlaying((current) => !current)} disabled={kind === "waiting"}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? "Pause" : "Lire la chorégraphie"}</Button>
            <Button size="sm" variant="ghost" onClick={restart}><RotateCcw className="h-4 w-4" />Recommencer</Button>
          </div>
        </div>
        <label className="mt-3 block text-[10px] text-ui-text-muted" htmlFor="dungeon-scene-prototype-time">Instant de la scène</label>
        <input id="dungeon-scene-prototype-time" className={`${styles.timeline} mt-2 block w-full`} type="range" min="0" max={DUNGEON_SCENE_PROTOTYPE_DURATION_MS} step="50" value={Math.round(elapsedMs)} onChange={(event) => { setElapsedMs(Number(event.target.value)); setPlaying(false); }} />
      </section>

      <details className="mt-3 rounded-lg border border-ui-border-subtle bg-ui-surface p-3">
        <summary className="min-h-11 cursor-pointer py-3 text-xs font-bold text-ui-accent">Consulter le journal de la fixture</summary>
        <ol className="mt-2 space-y-2 border-t border-ui-border-subtle pt-3 text-xs text-ui-text">
          {fixture.journal.map((entry, index) => <li key={`${kind}-${index}`}><span className="mr-2 font-mono text-[9px] text-ui-text-muted">{String(index + 1).padStart(2, "0")}</span>{entry}</li>)}
        </ol>
      </details>
    </div>
  );
}
