import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTROL_REQUEST_TTL_MS,
  canAcquireRequestedControl,
  controlRequestKey,
  isControlRequestExpired,
  requestedControlOwner,
  startExclusiveAutomationLease,
  type AutomationLease,
} from "../domain/automationLeadership";
import type {
  CanonicalOperationContext,
  CanonicalOperationQueue,
} from "../lib/canonicalOperationQueue";

export type AutomationLeadershipOptions = {
  userId: string | null;
  ready: boolean;
  transportOnline: boolean;
  canonicalQueue: CanonicalOperationQueue;
  getBootstrapOperationKey: (userId: string) => string;
  refreshAuthority: (
    userId: string,
    context: CanonicalOperationContext,
    isCurrent: () => boolean,
  ) => Promise<void>;
  onAuthorityAcquired: () => void;
  onAuthorityFailure: () => void;
  showNotice: (message: string) => void;
};

export function useAutomationLeadership(options: AutomationLeadershipOptions) {
  const [isAutomationLeader, setIsAutomationLeader] = useState(false);
  const [isControlTransferPending, setIsControlTransferPending] = useState(false);
  const [controlLeaseEpoch, setControlLeaseEpoch] = useState(0);
  const isAutomationLeaderRef = useRef(false);
  const controlLeaseRef = useRef<AutomationLease | null>(null);
  const controlTabIdRef = useRef(crypto.randomUUID());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const relinquishAutomationLeadership = useCallback(() => {
    isAutomationLeaderRef.current = false;
    setIsAutomationLeader(false);
  }, []);

  const resetAutomationLeadership = useCallback(() => {
    relinquishAutomationLeadership();
    setIsControlTransferPending(false);
  }, [relinquishAutomationLeadership]);

  useEffect(() => {
    if (!options.userId || !options.ready || !options.transportOnline) {
      resetAutomationLeadership();
      return;
    }
    if (!navigator.locks) {
      isAutomationLeaderRef.current = true;
      setIsAutomationLeader(true);
      setIsControlTransferPending(false);
      return;
    }
    relinquishAutomationLeadership();
    let active = true;
    const userId = options.userId;
    const requestKey = controlRequestKey(userId);
    const tabId = controlTabIdRef.current;
    let requestExpiryTimeout: number | undefined;
    const lease = startExclusiveAutomationLease({
      userId,
      requestLock: (name, callback) => navigator.locks.request(
        name,
        { mode: "exclusive" },
        callback,
      ),
      canAcquire: () => {
        const requestedTabId = window.localStorage.getItem(requestKey);
        return canAcquireRequestedControl(requestedTabId, tabId, Date.now());
      },
      onLeadershipChange: async (leader) => {
        if (!leader) {
          if (active) relinquishAutomationLeadership();
          return;
        }
        const current = optionsRef.current;
        await current.canonicalQueue.enqueueCoalescedBackground(
          current.getBootstrapOperationKey(userId),
          (context) => current.refreshAuthority(userId, context, () => active),
          "bootstrap:leadership",
        );
        if (!active) return;
        const resolvedRequest = window.localStorage.getItem(requestKey);
        const resolvedExplicitlyRequested = requestedControlOwner(resolvedRequest) === tabId;
        if (resolvedExplicitlyRequested || isControlRequestExpired(resolvedRequest, Date.now())) {
          window.localStorage.removeItem(requestKey);
        }
        current.onAuthorityAcquired();
        isAutomationLeaderRef.current = true;
        setIsControlTransferPending(false);
        setIsAutomationLeader(true);
        if (resolvedExplicitlyRequested) current.showNotice("Cet onglet contrôle maintenant la partie.");
      },
    });
    controlLeaseRef.current = lease;
    const queuedRequest = window.localStorage.getItem(requestKey);
    if (queuedRequest && requestedControlOwner(queuedRequest) !== tabId) {
      const requestedAt = Number(queuedRequest.split(":")[1]);
      const elapsed = Number.isFinite(requestedAt) ? Date.now() - requestedAt : CONTROL_REQUEST_TTL_MS;
      requestExpiryTimeout = window.setTimeout(() => {
        if (!active) return;
        if (window.localStorage.getItem(requestKey) === queuedRequest
          && isControlRequestExpired(queuedRequest, Date.now())) {
          window.localStorage.removeItem(requestKey);
        }
        if (!isAutomationLeaderRef.current) setControlLeaseEpoch((value) => value + 1);
      }, Math.max(0, CONTROL_REQUEST_TTL_MS - elapsed) + 1);
    }
    const handleControlRequest = (event: StorageEvent) => {
      if (event.key !== requestKey) return;
      if (event.newValue === null) {
        if (requestedControlOwner(event.oldValue) === tabId) setIsControlTransferPending(false);
        if (active && !isAutomationLeaderRef.current) setControlLeaseEpoch((value) => value + 1);
        return;
      }
      if (requestedControlOwner(event.newValue) === tabId) return;
      const requestValue = event.newValue;
      window.setTimeout(() => {
        if (window.localStorage.getItem(requestKey) === requestValue) {
          window.localStorage.removeItem(requestKey);
        }
      }, CONTROL_REQUEST_TTL_MS);
      resetAutomationLeadership();
      void optionsRef.current.canonicalQueue.whenIdle().finally(() => lease.stop());
    };
    window.addEventListener("storage", handleControlRequest);
    void lease.completion.catch(() => {
      if (!active) return;
      resetAutomationLeadership();
      optionsRef.current.onAuthorityFailure();
      optionsRef.current.showNotice("Impossible d’acquérir le contrôle de la partie.");
    });
    return () => {
      active = false;
      if (requestExpiryTimeout !== undefined) window.clearTimeout(requestExpiryTimeout);
      window.removeEventListener("storage", handleControlRequest);
      lease.stop();
      if (controlLeaseRef.current === lease) controlLeaseRef.current = null;
    };
  }, [controlLeaseEpoch, options.ready, options.transportOnline, options.userId, relinquishAutomationLeadership, resetAutomationLeadership]);

  const requestGameControl = useCallback(() => {
    const current = optionsRef.current;
    if (!current.userId || isAutomationLeaderRef.current
      || isControlTransferPending || !current.transportOnline) return;
    const requestKey = controlRequestKey(current.userId);
    window.localStorage.setItem(
      requestKey,
      `${controlTabIdRef.current}:${Date.now()}:${crypto.randomUUID()}`,
    );
    setIsControlTransferPending(true);
    controlLeaseRef.current?.stop();
    setControlLeaseEpoch((value) => value + 1);
    current.showNotice("Transfert du contrôle en cours…");
  }, [isControlTransferPending]);

  return {
    isAutomationLeader,
    isAutomationLeaderRef,
    isControlTransferPending,
    requestGameControl,
    resetAutomationLeadership,
  };
}
