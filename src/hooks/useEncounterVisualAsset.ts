import { useEffect, useState } from "react";
import {
  loadEncounterVisualAsset,
  resolveEncounterVisualDescriptor,
  type LoadedEncounterVisual,
} from "../assets/encounterVisuals";

export function useEncounterVisualAsset(key: string): LoadedEncounterVisual & { loading: boolean } {
  const [resolved, setResolved] = useState<LoadedEncounterVisual>(() => ({
    descriptor: resolveEncounterVisualDescriptor(key),
    url: null,
    status: "fallback",
  }));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setResolved({ descriptor: resolveEncounterVisualDescriptor(key), url: null, status: "fallback" });
    void loadEncounterVisualAsset(key).then((asset) => {
      if (!active) return;
      setResolved(asset);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [key]);

  if (resolved.descriptor.key !== key) {
    return {
      descriptor: resolveEncounterVisualDescriptor(key),
      url: null,
      status: "fallback",
      loading: true,
    };
  }
  return { ...resolved, loading };
}
