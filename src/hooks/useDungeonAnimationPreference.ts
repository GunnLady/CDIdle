import { useCallback, useEffect, useState } from "react";

export const DUNGEON_ANIMATION_PREFERENCE_KEY = "cdidle:dungeon-animations";

function readDungeonAnimationPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DUNGEON_ANIMATION_PREFERENCE_KEY) !== "disabled";
  } catch {
    return true;
  }
}

function writeDungeonAnimationPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(
      DUNGEON_ANIMATION_PREFERENCE_KEY,
      enabled ? "enabled" : "disabled",
    );
  } catch {
    // The preference is optional; rendering remains usable without storage.
  }
}

export function useDungeonAnimationPreference() {
  const [animationsEnabled, setAnimationsEnabled] = useState(readDungeonAnimationPreference);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );

  useEffect(() => {
    writeDungeonAnimationPreference(animationsEnabled);
  }, [animationsEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => setDocumentVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled((enabled) => !enabled);
  }, []);

  return {
    animationsEnabled,
    animationsRunning: animationsEnabled && documentVisible,
    toggleAnimations,
  };
}
