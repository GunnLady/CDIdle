import { useCallback, useRef, useState } from "react";
import {
  CanonicalOperationQueue,
  runInteractiveCanonicalOperation,
  runInteractiveCoalescedCanonicalOperation,
  type CanonicalOperationContext,
} from "../lib/canonicalOperationQueue";

export function useCanonicalOperations(onBusy: () => void) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingUserCommandCount, setPendingUserCommandCount] = useState(0);
  const interactivePendingRef = useRef(0);
  const optimisticPendingRef = useRef(0);
  const onBusyRef = useRef(onBusy);
  onBusyRef.current = onBusy;
  const queueRef = useRef<CanonicalOperationQueue | null>(null);
  if (!queueRef.current) {
    queueRef.current = new CanonicalOperationQueue({
      onMetrics: (metrics) => {
        if (import.meta.env.DEV || import.meta.env.MODE === "alpha") {
          console.info("Canonical operation timing", metrics);
        }
      },
    });
  }
  const canonicalQueue = queueRef.current;
  const publishPendingCount = useCallback(() => {
    setPendingUserCommandCount(interactivePendingRef.current + optimisticPendingRef.current);
  }, []);
  const setOptimisticPendingCount = useCallback((count: number) => {
    optimisticPendingRef.current = Math.max(0, count);
    publishPendingCount();
  }, [publishPendingCount]);
  const resetPendingOperations = useCallback(() => {
    interactivePendingRef.current = 0;
    optimisticPendingRef.current = 0;
    setPendingUserCommandCount(0);
    setIsSyncing(false);
  }, []);
  const enqueueInteractiveOperation = useCallback(<T,>(
    run: (context: CanonicalOperationContext) => Promise<T>,
    syncing = false,
    label?: string,
  ): Promise<T> | null => {
    if (interactivePendingRef.current > 0) {
      onBusyRef.current();
      return null;
    }
    return runInteractiveCanonicalOperation(canonicalQueue, run, (pending) => {
      interactivePendingRef.current = pending ? 1 : 0;
      publishPendingCount();
      if (syncing) setIsSyncing(pending);
    }, label);
  }, [canonicalQueue, publishPendingCount]);
  const enqueueInteractiveCoalescedOperation = useCallback((
    key: string,
    run: (context: CanonicalOperationContext) => Promise<void>,
    syncing = false,
    label?: string,
  ): Promise<void> | null => {
    if (interactivePendingRef.current > 0) {
      onBusyRef.current();
      return null;
    }
    return runInteractiveCoalescedCanonicalOperation(canonicalQueue, key, run, (pending) => {
      interactivePendingRef.current = pending ? 1 : 0;
      publishPendingCount();
      if (syncing) setIsSyncing(pending);
    }, label);
  }, [canonicalQueue, publishPendingCount]);

  return {
    canonicalQueue,
    enqueueInteractiveCoalescedOperation,
    enqueueInteractiveOperation,
    isSyncing,
    pendingUserCommandCount,
    resetPendingOperations,
    setIsSyncing,
    setOptimisticPendingCount,
  };
}
