import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { CanonicalDungeonEncounterRecord } from "../../shared/contracts/authoritative";
import type { ActiveTab } from "../domain/activeTabPreference";
import {
  EncounterPlaybackRuntime,
  type EncounterPlaybackState,
} from "../domain/encounterPlayback";

export function useEncounterPlayback(activeTabRef: RefObject<ActiveTab>) {
  const [encounterPlayback, setEncounterPlayback] = useState<EncounterPlaybackState | null>(null);
  const runtimeRef = useRef<EncounterPlaybackRuntime | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = new EncounterPlaybackRuntime({
      isVisible: () => activeTabRef.current === "dungeon",
      onChange: setEncounterPlayback,
      wait: (durationMs) => new Promise<void>((resolve) => window.setTimeout(resolve, durationMs)),
    });
  }
  const runtime = runtimeRef.current;

  useEffect(() => () => runtime.cancel(), [runtime]);

  const playEncounterTranscript = useCallback(
    (encounter: CanonicalDungeonEncounterRecord) => runtime.play(encounter),
    [runtime],
  );
  const prepareEncounterPlayback = useCallback((encounterId: string) => {
    setEncounterPlayback({ encounterId, visibleCount: 0, complete: false });
  }, []);
  const resetEncounterPlayback = useCallback(() => {
    runtime.cancel();
    setEncounterPlayback(null);
  }, [runtime]);

  return {
    encounterPlayback,
    playEncounterTranscript,
    prepareEncounterPlayback,
    resetEncounterPlayback,
  };
}
