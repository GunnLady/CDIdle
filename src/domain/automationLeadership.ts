export const AUTOMATION_LOCK_PREFIX = "cdidle:automation";
export const CONTROL_REQUEST_PREFIX = "cdidle:control-request";
export const CONTROL_REQUEST_TTL_MS = 30_000;

export function automationLockName(userId: string): string {
  return `${AUTOMATION_LOCK_PREFIX}:${userId}`;
}

export function controlRequestKey(userId: string): string {
  return `${CONTROL_REQUEST_PREFIX}:${userId}`;
}

export function requestedControlOwner(request: string | null): string | null {
  return request?.split(":", 1)[0] || null;
}

export function isControlRequestExpired(request: string | null, now: number): boolean {
  if (!request) return false;
  const requestedAt = Number(request.split(":")[1]);
  return !Number.isFinite(requestedAt) || now - requestedAt >= CONTROL_REQUEST_TTL_MS;
}

export function canAcquireRequestedControl(
  request: string | null,
  tabId: string,
  now: number,
): boolean {
  return request === null
    || requestedControlOwner(request) === tabId
    || isControlRequestExpired(request, now);
}

export interface AutomationLease {
  stop: () => void;
  completion: Promise<void>;
}

export function startExclusiveAutomationLease(options: {
  userId: string;
  requestLock: (name: string, callback: () => Promise<void>) => Promise<void>;
  canAcquire?: () => boolean;
  onLeadershipChange: (leader: boolean) => void | Promise<void>;
}): AutomationLease {
  let stopped = false;
  let releaseLease: () => void = () => undefined;
  const lease = new Promise<void>((resolve) => {
    releaseLease = resolve;
  });
  const completion = options.requestLock(automationLockName(options.userId), async () => {
    if (stopped || options.canAcquire?.() === false) return;
    await options.onLeadershipChange(true);
    try {
      await lease;
    } finally {
      await options.onLeadershipChange(false);
    }
  });
  return {
    stop() {
      stopped = true;
      releaseLease();
    },
    completion,
  };
}
