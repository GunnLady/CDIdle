import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanonicalOperationQueue } from "../src/lib/canonicalOperationQueue";
import { useAutomationLeadership } from "../src/hooks/useAutomationLeadership";

describe("automation leadership hook", () => {
  afterEach(() => {
    delete (navigator as Navigator & { locks?: unknown }).locks;
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("owns the single-tab fallback and resets when the session disappears", async () => {
    const canonicalQueue = new CanonicalOperationQueue();
    const base = {
      ready: true,
      transportOnline: true,
      canonicalQueue,
      getBootstrapOperationKey: (userId: string) => `bootstrap:${userId}`,
      refreshAuthority: vi.fn(async () => undefined),
      onAuthorityAcquired: vi.fn(),
      onAuthorityFailure: vi.fn(),
      showNotice: vi.fn(),
    };
    const { result, rerender } = renderHook(
      ({ userId }) => useAutomationLeadership({ ...base, userId }),
      { initialProps: { userId: "user-1" as string | null } },
    );

    await waitFor(() => expect(result.current.isAutomationLeader).toBe(true));
    expect(result.current.isAutomationLeaderRef.current).toBe(true);

    rerender({ userId: null });
    await waitFor(() => expect(result.current.isAutomationLeader).toBe(false));
    expect(result.current.isAutomationLeaderRef.current).toBe(false);
  });

  it("refreshes authority before publishing leadership acquired through Web Locks", async () => {
    const request = vi.fn((
      _name: string,
      _settings: { mode: string },
      callback: () => Promise<void>,
    ) => callback());
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: { request },
    });
    const refreshAuthority = vi.fn(async () => undefined);
    const onAuthorityAcquired = vi.fn();
    const { result, unmount } = renderHook(() => useAutomationLeadership({
      userId: "user-1",
      ready: true,
      transportOnline: true,
      canonicalQueue: new CanonicalOperationQueue(),
      getBootstrapOperationKey: (userId) => `bootstrap:${userId}`,
      refreshAuthority,
      onAuthorityAcquired,
      onAuthorityFailure: vi.fn(),
      showNotice: vi.fn(),
    }));

    await waitFor(() => expect(result.current.isAutomationLeader).toBe(true));
    expect(request).toHaveBeenCalledWith(
      "cdidle:automation:user-1",
      { mode: "exclusive" },
      expect.any(Function),
    );
    expect(refreshAuthority).toHaveBeenCalledWith(
      "user-1",
      expect.any(Object),
      expect.any(Function),
    );
    expect(onAuthorityAcquired).toHaveBeenCalledOnce();
    unmount();
  });

  it("records and exposes an explicit control transfer request", async () => {
    const request = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: { request },
    });
    const showNotice = vi.fn();
    const { result } = renderHook(() => useAutomationLeadership({
      userId: "user-1",
      ready: true,
      transportOnline: true,
      canonicalQueue: new CanonicalOperationQueue(),
      getBootstrapOperationKey: (userId) => `bootstrap:${userId}`,
      refreshAuthority: vi.fn(async () => undefined),
      onAuthorityAcquired: vi.fn(),
      onAuthorityFailure: vi.fn(),
      showNotice,
    }));
    await waitFor(() => expect(request).toHaveBeenCalled());

    act(() => result.current.requestGameControl());
    expect(result.current.isControlTransferPending).toBe(true);
    expect(window.localStorage.getItem("cdidle:control-request:user-1")).toMatch(
      /^.+:\d+:.+$/,
    );
    expect(showNotice).toHaveBeenCalledWith(expect.stringContaining("Transfert"));
  });
});
