import type { CanonicalDungeonEncounterRecord } from "../../shared/contracts/authoritative";

export const ENCOUNTER_PLAYBACK_STEP_MS = 400;

export type EncounterPlaybackState = {
  encounterId: string;
  visibleCount: number;
  complete: boolean;
};

export type EncounterPlaybackRuntimeOptions = {
  isVisible: () => boolean;
  onChange: (state: EncounterPlaybackState) => void;
  wait: (durationMs: number) => Promise<void>;
};

export class EncounterPlaybackRuntime {
  private generation = 0;

  constructor(private readonly options: EncounterPlaybackRuntimeOptions) {}

  cancel(): void {
    this.generation += 1;
  }

  async play(encounter: CanonicalDungeonEncounterRecord): Promise<void> {
    const generation = ++this.generation;
    const total = encounter.transcript.length;
    const complete = () => this.options.onChange({
      encounterId: encounter.encounterId,
      visibleCount: total,
      complete: true,
    });

    this.options.onChange({
      encounterId: encounter.encounterId,
      visibleCount: 0,
      complete: false,
    });
    if (!this.options.isVisible()) {
      await this.options.wait((total + 1) * ENCOUNTER_PLAYBACK_STEP_MS);
      if (this.generation === generation) complete();
      return;
    }
    for (let index = 0; index < total; index += 1) {
      await this.options.wait(ENCOUNTER_PLAYBACK_STEP_MS);
      if (this.generation !== generation) return;
      if (!this.options.isVisible()) {
        await this.options.wait((total - index) * ENCOUNTER_PLAYBACK_STEP_MS);
        if (this.generation === generation) complete();
        return;
      }
      this.options.onChange({
        encounterId: encounter.encounterId,
        visibleCount: index + 1,
        complete: false,
      });
    }
    await this.options.wait(ENCOUNTER_PLAYBACK_STEP_MS);
    if (this.generation === generation) complete();
  }
}
