import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import {
  openCrossTabAuthorityBridge,
  type CrossTabAuthorityBridge,
  type CrossTabAuthoritySnapshot,
} from "../domain/crossTabAuthority";
import type { CanonicalOperationQueue } from "../lib/canonicalOperationQueue";

export function useCrossTabAuthority(options: {
  userId: string | null;
  ready: boolean;
  canonicalQueue: CanonicalOperationQueue;
  revisionRef: MutableRefObject<number>;
  getLatestSnapshot(): CrossTabAuthoritySnapshot | null;
  applyIncomingSnapshot(snapshot: CrossTabAuthoritySnapshot, isCurrent: () => boolean): Promise<void>;
  onAccountDeleted(): void;
}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const bridgeRef = useRef<CrossTabAuthorityBridge | null>(null);

  useEffect(() => {
    if (!options.userId || !options.ready || typeof BroadcastChannel === "undefined") return;
    const userId = options.userId;
    let active = true;
    const bridge = openCrossTabAuthorityBridge({
      userId,
      sourceId: crypto.randomUUID(),
      currentRevision: () => optionsRef.current.revisionRef.current,
      onSnapshot: (snapshot) => {
        void optionsRef.current.canonicalQueue.enqueueBackground(async () => {
          if (!active || snapshot.revision <= optionsRef.current.revisionRef.current) return;
          await optionsRef.current.applyIncomingSnapshot(snapshot, () => active);
        });
      },
      onAccountDeleted: () => optionsRef.current.onAccountDeleted(),
    });
    bridgeRef.current = bridge;
    const latestSnapshot = optionsRef.current.getLatestSnapshot();
    if (latestSnapshot) bridge.publish(latestSnapshot);
    return () => {
      active = false;
      bridge.close();
      if (bridgeRef.current === bridge) bridgeRef.current = null;
    };
  }, [options.ready, options.userId]);

  const publishSnapshot = useCallback((snapshot: CrossTabAuthoritySnapshot) => {
    bridgeRef.current?.publish(snapshot);
  }, []);
  const publishAccountDeleted = useCallback(() => {
    bridgeRef.current?.publishAccountDeleted();
  }, []);

  return { publishAccountDeleted, publishSnapshot };
}
