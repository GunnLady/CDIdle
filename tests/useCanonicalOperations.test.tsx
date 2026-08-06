import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCanonicalOperations } from "../src/hooks/useCanonicalOperations";

describe("canonical operations hook", () => {
  it("owns interactive, syncing and optimistic pending state", async () => {
    let resolveOperation: (() => void) | undefined;
    const operationGate = new Promise<void>((resolve) => { resolveOperation = resolve; });
    const onBusy = vi.fn();
    const { result } = renderHook(() => useCanonicalOperations(onBusy));

    let operation: Promise<void> | null = null;
    act(() => {
      result.current.setOptimisticPendingCount(2);
      operation = result.current.enqueueInteractiveOperation(() => operationGate, true, "fixture");
    });
    expect(result.current.pendingUserCommandCount).toBe(3);
    expect(result.current.isSyncing).toBe(true);
    expect(result.current.enqueueInteractiveOperation(async () => undefined)).toBeNull();
    expect(onBusy).toHaveBeenCalledOnce();

    await act(async () => {
      resolveOperation?.();
      await operation;
    });
    expect(result.current.pendingUserCommandCount).toBe(2);
    expect(result.current.isSyncing).toBe(false);

    act(() => result.current.resetPendingOperations());
    expect(result.current.pendingUserCommandCount).toBe(0);
  });
});
