import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OptimisticCommandBuffer } from "../src/lib/optimisticCommandBuffer";
import { useOptimisticCommands } from "../src/hooks/useOptimisticCommands";

describe("optimistic commands hook", () => {
  afterEach(() => vi.useRealTimers());

  it("owns buffer creation, flush and disabled cleanup", async () => {
    vi.useFakeTimers();
    const bufferRef = { current: null as OptimisticCommandBuffer | null };
    const onChange = vi.fn();
    const onDisabled = vi.fn();
    const send = vi.fn(async (_command, acknowledge: () => void) => {
      acknowledge();
      return true;
    });
    const { result, rerender } = renderHook(
      ({ enabled }) => useOptimisticCommands({ enabled, bufferRef, onChange, send, onDisabled }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      expect(result.current.enqueue(
        "auto",
        { type: "dungeon.auto_explore", enabled: true },
      )).toBe(true);
    });
    expect(bufferRef.current).not.toBeNull();
    expect(onChange).toHaveBeenCalledWith([{ type: "dungeon.auto_explore", enabled: true }]);

    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(send).toHaveBeenCalledOnce();

    rerender({ enabled: false });
    expect(bufferRef.current).toBeNull();
    expect(onDisabled).toHaveBeenCalledOnce();
    expect(result.current.enqueue(
      "auto",
      { type: "dungeon.auto_explore", enabled: false },
    )).toBe(false);
  });
});
