import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { CanonicalActiveDungeonEncounter } from "../../shared/contracts/authoritative";
import type { GameCommand } from "../domain/commands";

type DispatchCommand = (command: GameCommand, options?: { interactive?: boolean }) => Promise<boolean>;

export function useDungeonAutomation(options: {
  activeFloor: number;
  autoExplore: boolean;
  currentEncounter: CanonicalActiveDungeonEncounter | null;
  enabled: boolean;
  leaderRef: MutableRefObject<boolean>;
  dispatchCommand: DispatchCommand;
}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const retreatRequestedRef = useRef(false);
  const blockedRef = useRef(false);

  const setBlocked = useCallback((blocked: boolean) => {
    blockedRef.current = blocked;
  }, []);

  const exploreAndResolve = useCallback(async (interactive = true) => {
    const current = optionsRef.current;
    if (blockedRef.current || isRunningRef.current || !current.enabled || !current.leaderRef.current) return false;
    isRunningRef.current = true;
    setIsRunning(true);
    try {
      if (!current.currentEncounter) {
        const explored = await current.dispatchCommand({
          type: "dungeon.explore",
          floor: current.activeFloor,
        }, { interactive });
        if (!explored) {
          blockedRef.current = true;
          return false;
        }
        if (retreatRequestedRef.current) return true;
      }
      const resolved = await current.dispatchCommand({ type: "dungeon.resolve" }, { interactive });
      if (!resolved) blockedRef.current = true;
      return resolved;
    } finally {
      isRunningRef.current = false;
      setIsRunning(false);
    }
  }, []);

  const retreat = useCallback(async () => {
    blockedRef.current = true;
    retreatRequestedRef.current = true;
    try {
      return await optionsRef.current.dispatchCommand({ type: "dungeon.retreat" });
    } finally {
      retreatRequestedRef.current = false;
    }
  }, []);

  const waitUntilIdle = useCallback(async () => {
    while (isRunningRef.current) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
    }
  }, []);

  const reset = useCallback(() => {
    blockedRef.current = false;
    retreatRequestedRef.current = false;
    isRunningRef.current = false;
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (blockedRef.current || !options.enabled || !options.currentEncounter || isRunning) return;
    void exploreAndResolve(false);
  }, [exploreAndResolve, isRunning, options.currentEncounter, options.enabled]);

  useEffect(() => {
    if (blockedRef.current || !options.enabled || !options.autoExplore || options.currentEncounter || isRunning) return;
    const handle = window.setTimeout(() => { void exploreAndResolve(false); }, 1_000);
    return () => window.clearTimeout(handle);
  }, [exploreAndResolve, isRunning, options.autoExplore, options.currentEncounter, options.enabled]);

  return {
    exploreAndResolve,
    isRunning,
    isRunningRef,
    reset,
    retreat,
    setBlocked,
    waitUntilIdle,
  };
}
