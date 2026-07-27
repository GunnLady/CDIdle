import { describe, expect, it, vi } from "vitest";
import {
  automationLockName,
  canAcquireRequestedControl,
  controlRequestKey,
  isControlRequestExpired,
  requestedControlOwner,
  startExclusiveAutomationLease,
} from "../src/domain/automationLeadership";

describe("cross-tab automation leadership", () => {
  it("scopes the lock to the authenticated user", () => {
    expect(automationLockName("user-42")).toBe("cdidle:automation:user-42");
    expect(controlRequestKey("user-42")).toBe("cdidle:control-request:user-42");
  });

  it("prioritizes the tab that explicitly requested control", () => {
    expect(canAcquireRequestedControl(null, "tab-a", 1001)).toBe(true);
    expect(canAcquireRequestedControl("tab-a:1000:request-1", "tab-a", 1001)).toBe(true);
    expect(canAcquireRequestedControl("tab-a:1000:request-1", "tab-b", 1001)).toBe(false);
    expect(canAcquireRequestedControl("tab-a:1000:request-1", "tab-b", 31_000)).toBe(true);
    expect(isControlRequestExpired("tab-a:1000:request-1", 30_999)).toBe(false);
    expect(isControlRequestExpired("tab-a:1000:request-1", 31_000)).toBe(true);
    expect(requestedControlOwner("tab-a:1000:request-1")).toBe("tab-a");
    expect(requestedControlOwner(null)).toBeNull();
  });

  it("holds leadership until the lease is stopped", async () => {
    const changes: boolean[] = [];
    let acquired: (() => Promise<void>) | undefined;
    const requestLock = vi.fn(async (_name: string, callback: () => Promise<void>) => {
      acquired = callback;
    });
    const lease = startExclusiveAutomationLease({
      userId: "user-42",
      requestLock,
      onLeadershipChange: (leader) => { changes.push(leader); },
    });
    const running = acquired?.();
    await Promise.resolve();
    expect(changes).toEqual([true]);
    lease.stop();
    await running;
    expect(changes).toEqual([true, false]);
  });

  it("does not become leader after being stopped while queued", async () => {
    const onLeadershipChange = vi.fn();
    let acquired: (() => Promise<void>) | undefined;
    const lease = startExclusiveAutomationLease({
      userId: "user-42",
      requestLock: async (_name, callback) => { acquired = callback; },
      onLeadershipChange,
    });
    lease.stop();
    await acquired?.();
    expect(onLeadershipChange).not.toHaveBeenCalled();
  });

  it("skips leadership when another tab explicitly requested control", async () => {
    const onLeadershipChange = vi.fn();
    let acquired: (() => Promise<void>) | undefined;
    startExclusiveAutomationLease({
      userId: "user-42",
      requestLock: async (_name, callback) => { acquired = callback; },
      canAcquire: () => false,
      onLeadershipChange,
    });
    await acquired?.();
    expect(onLeadershipChange).not.toHaveBeenCalled();
  });
});
