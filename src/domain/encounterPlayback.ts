import type { CanonicalDungeonEncounterRecord } from "../../shared/contracts/authoritative";
import {
  createEncounterSceneTimeline,
  type EncounterSceneCursor,
  type EncounterSceneTimeline,
} from "./encounterSceneProjection";

export { getEncounterPlaybackTranscript } from "./encounterSceneProjection";

export const ENCOUNTER_PLAYBACK_STEP_MS = 400;
export const DUNGEON_AUTO_EXPLORE_DELAY_MS = 4_750;
export const ENCOUNTER_PLAYBACK_DEDUPE_LIMIT = 32;

export type EncounterPlaybackState = EncounterSceneCursor & {
  encounterId: string;
};

export interface EncounterPlaybackClock {
  now(): number;
  waitUntil(deadlineMs: number, signal: AbortSignal): Promise<void>;
}

export type EncounterPlaybackIdentity = {
  revision?: string | number;
};

export type EncounterPlaybackRuntimeOptions = {
  isVisible: () => boolean;
  onChange: (state: EncounterPlaybackState) => unknown;
  clock?: EncounterPlaybackClock;
};

export type EncounterPlaybackDiagnostics = {
  generation: number;
  active: boolean;
  pendingWait: boolean;
  recentCount: number;
};

type ActivePlayback = {
  key: string;
  generation: number;
  cancelled: boolean;
  waitController: AbortController | null;
  promise: Promise<void>;
};

function finiteElapsed(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getEncounterPlaybackDurationMs(timeline: EncounterSceneTimeline): number {
  return (timeline.steps.length + 1) * ENCOUNTER_PLAYBACK_STEP_MS;
}

export function getEncounterPlaybackCursorAtElapsed(
  timeline: EncounterSceneTimeline,
  elapsedMs: number,
): EncounterSceneCursor {
  const elapsed = finiteElapsed(elapsedMs);
  const duration = getEncounterPlaybackDurationMs(timeline);
  if (elapsed >= duration) {
    return { visibleCount: timeline.steps.length, complete: true };
  }
  return {
    visibleCount: Math.min(timeline.steps.length, Math.floor(elapsed / ENCOUNTER_PLAYBACK_STEP_MS)),
    complete: false,
  };
}

export function createSystemEncounterPlaybackClock(): EncounterPlaybackClock {
  return {
    now: () => globalThis.performance.now(),
    waitUntil: (deadlineMs, signal) => {
      if (signal.aborted) return Promise.resolve();
      return new Promise<void>((resolve) => {
        let settled = false;
        let timeoutId: ReturnType<typeof globalThis.setTimeout>;
        const finish = () => {
          if (settled) return;
          settled = true;
          globalThis.clearTimeout(timeoutId);
          signal.removeEventListener("abort", finish);
          resolve();
        };
        timeoutId = globalThis.setTimeout(
          finish,
          Math.max(0, deadlineMs - globalThis.performance.now()),
        );
        signal.addEventListener("abort", finish, { once: true });
      });
    },
  };
}

function sameCursor(left: EncounterSceneCursor | null, right: EncounterSceneCursor): boolean {
  return left?.visibleCount === right.visibleCount && left.complete === right.complete;
}

export class EncounterPlaybackRuntime {
  private generation = 0;
  private sessionId = "default";
  private readonly clock: EncounterPlaybackClock;
  private active: ActivePlayback | null = null;
  private recentKeys: string[] = [];

  constructor(private readonly options: EncounterPlaybackRuntimeOptions) {
    this.clock = options.clock ?? createSystemEncounterPlaybackClock();
  }

  cancel(): void {
    this.cancelActive();
  }

  reset(): void {
    this.cancelActive();
    this.recentKeys = [];
  }

  setSession(sessionId: string): void {
    if (sessionId === this.sessionId) return;
    this.cancelActive();
    this.sessionId = sessionId;
    this.recentKeys = [];
  }

  synchronize(): void {
    this.active?.waitController?.abort();
  }

  diagnostics(): EncounterPlaybackDiagnostics {
    return {
      generation: this.generation,
      active: this.active !== null,
      pendingWait: this.active?.waitController != null,
      recentCount: this.recentKeys.length,
    };
  }

  play(
    encounter: CanonicalDungeonEncounterRecord,
    identity: EncounterPlaybackIdentity = {},
  ): Promise<void> {
    const key = JSON.stringify([this.sessionId, encounter.encounterId, identity.revision ?? null]);
    if (this.active?.key === key) return this.active.promise;
    if (this.recentKeys.includes(key)) return Promise.resolve();

    const timeline = createEncounterSceneTimeline(encounter);
    this.cancelActive();
    const generation = this.generation;
    let resolvePlayback!: () => void;
    let rejectPlayback!: (reason: unknown) => void;
    const promise = new Promise<void>((resolve, reject) => {
      resolvePlayback = resolve;
      rejectPlayback = reject;
    });
    const active: ActivePlayback = {
      key,
      generation,
      cancelled: false,
      waitController: null,
      promise,
    };
    this.active = active;

    void (async () => {
      let failure: unknown;
      let failed = false;
      try {
        const completed = await this.run(active, timeline);
        if (completed) this.remember(key);
      } catch (error) {
        failed = true;
        failure = error;
      } finally {
        if (this.active?.generation === generation) this.active = null;
        if (failed) rejectPlayback(failure);
        else resolvePlayback();
      }
    })();
    return promise;
  }

  private cancelActive(): void {
    this.generation += 1;
    const active = this.active;
    if (!active) return;
    active.cancelled = true;
    active.waitController?.abort();
    this.active = null;
  }

  private remember(key: string): void {
    this.recentKeys = [key, ...this.recentKeys.filter((candidate) => candidate !== key)]
      .slice(0, ENCOUNTER_PLAYBACK_DEDUPE_LIMIT);
  }

  private isCurrent(active: ActivePlayback): boolean {
    return !active.cancelled && active.generation === this.generation;
  }

  private publish(
    active: ActivePlayback,
    timeline: EncounterSceneTimeline,
    cursor: EncounterSceneCursor,
  ): void {
    if (!this.isCurrent(active)) return;
    this.options.onChange({
      encounterId: timeline.encounterId,
      ...cursor,
    });
  }

  private async waitUntil(active: ActivePlayback, deadlineMs: number): Promise<void> {
    const controller = new AbortController();
    active.waitController = controller;
    let releaseOnAbort!: () => void;
    const aborted = new Promise<void>((resolve) => {
      releaseOnAbort = () => resolve();
      controller.signal.addEventListener("abort", releaseOnAbort, { once: true });
    });
    try {
      await Promise.race([
        this.clock.waitUntil(deadlineMs, controller.signal),
        aborted,
      ]);
    } catch (error) {
      if (!controller.signal.aborted) throw error;
    } finally {
      controller.signal.removeEventListener("abort", releaseOnAbort);
      if (active.waitController === controller) active.waitController = null;
    }
  }

  private async run(active: ActivePlayback, timeline: EncounterSceneTimeline): Promise<boolean> {
    const startedAt = this.clock.now();
    const finalDeadline = startedAt + getEncounterPlaybackDurationMs(timeline);
    let publishedCursor: EncounterSceneCursor | null = null;
    const publishIfChanged = (cursor: EncounterSceneCursor) => {
      if (sameCursor(publishedCursor, cursor)) return;
      this.publish(active, timeline, cursor);
      publishedCursor = cursor;
    };

    publishIfChanged({ visibleCount: 0, complete: false });
    while (this.isCurrent(active)) {
      const cursor = getEncounterPlaybackCursorAtElapsed(timeline, this.clock.now() - startedAt);
      if (cursor.complete) {
        publishIfChanged(cursor);
        return this.isCurrent(active);
      }
      const visible = this.options.isVisible();
      if (visible) publishIfChanged(cursor);
      const nextDeadline = visible
        ? startedAt + ((cursor.visibleCount + 1) * ENCOUNTER_PLAYBACK_STEP_MS)
        : finalDeadline;
      await this.waitUntil(active, nextDeadline);
    }
    return false;
  }
}
