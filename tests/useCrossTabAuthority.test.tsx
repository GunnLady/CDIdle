import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { CanonicalOperationQueue } from "../src/lib/canonicalOperationQueue";
import { useCrossTabAuthority } from "../src/hooks/useCrossTabAuthority";

const bridge = vi.hoisted(() => ({
  close: vi.fn(),
  publish: vi.fn(),
  publishAccountDeleted: vi.fn(),
}));
const openBridge = vi.hoisted(() => vi.fn((_options: unknown) => bridge));

vi.mock("../src/domain/crossTabAuthority", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/domain/crossTabAuthority")>();
  return { ...original, openCrossTabAuthorityBridge: openBridge };
});

describe("cross-tab authority hook", () => {
  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", class {});
    vi.stubGlobal("crypto", { randomUUID: () => "tab-a" });
    openBridge.mockClear();
    bridge.close.mockClear();
    bridge.publish.mockClear();
    bridge.publishAccountDeleted.mockClear();
  });

  it("opens, seeds, publishes and closes the user-scoped bridge", () => {
    const snapshot = {
      revision: 2,
      state: initialTownState(42),
      serverTime: "2026-08-06T20:00:00.000Z",
      lastProcessedAt: "2026-08-06T20:00:00.000Z",
    };
    const { result, unmount } = renderHook(() => useCrossTabAuthority({
      userId: "user-1",
      ready: true,
      canonicalQueue: new CanonicalOperationQueue(),
      revisionRef: { current: 2 },
      getLatestSnapshot: () => snapshot,
      applyIncomingSnapshot: vi.fn(async () => undefined),
      onAccountDeleted: vi.fn(),
    }));

    expect(openBridge).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1",
      sourceId: "tab-a",
    }));
    expect(bridge.publish).toHaveBeenCalledWith(snapshot);
    act(() => result.current.publishAccountDeleted());
    expect(bridge.publishAccountDeleted).toHaveBeenCalledOnce();

    unmount();
    expect(bridge.close).toHaveBeenCalledOnce();
  });

  it("queues only newer incoming snapshots and forwards account deletion", async () => {
    const applyIncomingSnapshot = vi.fn(async () => undefined);
    const onAccountDeleted = vi.fn();
    const revisionRef = { current: 2 };
    renderHook(() => useCrossTabAuthority({
      userId: "user-1",
      ready: true,
      canonicalQueue: new CanonicalOperationQueue(),
      revisionRef,
      getLatestSnapshot: () => null,
      applyIncomingSnapshot,
      onAccountDeleted,
    }));
    const callbacks = openBridge.mock.calls[0][0] as {
      onSnapshot(value: ReturnType<typeof createSnapshot>): void;
      onAccountDeleted(): void;
    };

    callbacks.onSnapshot(createSnapshot(2));
    await Promise.resolve();
    expect(applyIncomingSnapshot).not.toHaveBeenCalled();

    callbacks.onSnapshot(createSnapshot(3));
    await waitFor(() => expect(applyIncomingSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 3 }),
      expect.any(Function),
    ));
    callbacks.onAccountDeleted();
    expect(onAccountDeleted).toHaveBeenCalledOnce();
  });
});

function createSnapshot(revision: number) {
  return {
    revision,
    state: initialTownState(42),
    serverTime: "2026-08-06T20:00:00.000Z",
    lastProcessedAt: "2026-08-06T20:00:00.000Z",
  };
}
