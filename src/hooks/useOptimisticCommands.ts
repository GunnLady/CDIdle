import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { GameCommand } from "../domain/commands";
import {
  OptimisticCommandBuffer,
  type OptimisticMerge,
} from "../lib/optimisticCommandBuffer";

export function useOptimisticCommands(options: {
  enabled: boolean;
  bufferRef: MutableRefObject<OptimisticCommandBuffer | null>;
  onChange(commands: GameCommand[]): void;
  send(command: GameCommand, acknowledge: () => void): Promise<boolean>;
  onDisabled(): void;
}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const reset = useCallback(() => {
    const current = optionsRef.current;
    current.bufferRef.current?.dispose();
    current.bufferRef.current = null;
    current.onDisabled();
  }, []);

  const enqueue = useCallback((key: string, command: GameCommand, merge: OptimisticMerge) => {
    const current = optionsRef.current;
    if (!current.enabled) return false;
    if (!current.bufferRef.current) {
      current.bufferRef.current = new OptimisticCommandBuffer({
        onChange: (commands) => optionsRef.current.onChange(commands),
        send: (bufferedCommand, acknowledge) => optionsRef.current.send(bufferedCommand, acknowledge),
      });
    }
    return current.bufferRef.current.enqueue(key, command, merge);
  }, []);

  useEffect(() => {
    if (options.enabled) return;
    reset();
  }, [options.enabled, reset]);

  useEffect(() => () => {
    const current = optionsRef.current;
    current.bufferRef.current?.dispose();
    current.bufferRef.current = null;
  }, []);

  return { enqueue, reset };
}
