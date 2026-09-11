import { useCallback, useEffect, useRef, useState } from "react";
import type { CanonicalDungeonEncounterRecord } from "../../shared/contracts/authoritative";
import type { ActiveTab } from "../domain/activeTabPreference";
import {
  EncounterPlaybackRuntime,
  type EncounterPlaybackIdentity,
  type EncounterPlaybackState,
} from "../domain/encounterPlayback";

function isPlaybackVisible(activeTab: ActiveTab): boolean {
  return activeTab === "dungeon"
    && (typeof document === "undefined" || document.visibilityState === "visible");
}

export function useEncounterPlayback(activeTab: ActiveTab, sessionId: string | null) {
  const [encounterPlayback, setEncounterPlayback] = useState<EncounterPlaybackState | null>(null);
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;
  const visibleRef = useRef(isPlaybackVisible(activeTab));
  const runtimeRef = useRef<EncounterPlaybackRuntime | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = new EncounterPlaybackRuntime({
      isVisible: () => visibleRef.current,
      onChange: setEncounterPlayback,
    });
  }
  const runtime = runtimeRef.current;

  useEffect(() => () => runtime.cancel(), [runtime]);

  useEffect(() => {
    runtime.setSession(sessionId ?? "anonymous");
    setEncounterPlayback(null);
  }, [runtime, sessionId]);

  useEffect(() => {
    const synchronizeVisibility = () => {
      visibleRef.current = isPlaybackVisible(activeTab);
      runtime.synchronize();
    };
    synchronizeVisibility();
    document.addEventListener("visibilitychange", synchronizeVisibility);
    return () => document.removeEventListener("visibilitychange", synchronizeVisibility);
  }, [activeTab, runtime]);

  const playEncounterTranscript = useCallback(
    (encounter: CanonicalDungeonEncounterRecord, identity?: EncounterPlaybackIdentity) => runtime.play(encounter, identity),
    [runtime],
  );
  const prepareEncounterPlayback = useCallback((encounterId: string) => {
    runtime.cancel();
    const prepared = { encounterId, visibleCount: 0, complete: false };
    setEncounterPlayback(prepared);
  }, [runtime]);
  const resetEncounterPlayback = useCallback((expectedSessionId?: string | null) => {
    if (expectedSessionId !== undefined && expectedSessionId !== sessionRef.current) return;
    runtime.reset();
    setEncounterPlayback(null);
  }, [runtime]);

  return {
    encounterPlayback,
    playEncounterTranscript,
    prepareEncounterPlayback,
    resetEncounterPlayback,
  };
}
