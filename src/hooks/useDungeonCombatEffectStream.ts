import { useEffect, useRef, useState } from "react";

interface TimedEffect {
  id: string;
  offset: number;
  delayMs?: number;
}

interface StreamEntry<T> {
  effect: T;
  expiresAt: number;
}

export function useDungeonCombatEffectStream<T extends TimedEffect>(input: {
  actionKey: string;
  effects: readonly T[];
  animationsEnabled: boolean;
  durationMs: number;
  staggerMs: number;
  limit: number;
}): T[] {
  const inputRef = useRef(input);
  inputRef.current = input;
  const [entries, setEntries] = useState<Array<StreamEntry<T>>>(() => (
    input.animationsEnabled
      ? input.effects.slice(-input.limit).map((effect) => ({
          effect,
          expiresAt: Date.now() + input.durationMs + (effect.offset * input.staggerMs) + (effect.delayMs ?? 0),
        }))
      : []
  ));

  useEffect(() => {
    if (!input.animationsEnabled) {
      setEntries([]);
      return;
    }
    const now = Date.now();
    const incoming = inputRef.current.effects.map((effect) => ({
      effect,
      expiresAt: now + input.durationMs + (effect.offset * input.staggerMs) + (effect.delayMs ?? 0),
    }));
    const incomingIds = new Set(incoming.map(({ effect }) => effect.id));
    setEntries((current) => [
      ...current.filter(({ effect, expiresAt }) => expiresAt > now && !incomingIds.has(effect.id)),
      ...incoming,
    ].slice(-input.limit));
  }, [input.actionKey, input.animationsEnabled, input.durationMs, input.limit, input.staggerMs]);

  useEffect(() => {
    if (!input.animationsEnabled || entries.length === 0) return undefined;
    const nextExpiry = Math.min(...entries.map(({ expiresAt }) => expiresAt));
    const timeout = globalThis.setTimeout(() => {
      const now = Date.now();
      setEntries((current) => current.filter(({ expiresAt }) => expiresAt > now));
    }, Math.max(0, nextExpiry - Date.now()));
    return () => globalThis.clearTimeout(timeout);
  }, [entries, input.animationsEnabled]);

  return input.animationsEnabled ? entries.map(({ effect }) => effect) : [...input.effects];
}
