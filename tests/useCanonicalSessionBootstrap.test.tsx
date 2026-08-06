import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { initialTownState } from "../supabase/functions/game-api/town-authority";
import { CanonicalOperationQueue } from "../src/lib/canonicalOperationQueue";
import { useCanonicalSessionBootstrap } from "../src/hooks/useCanonicalSessionBootstrap";
import { GameApiError } from "../src/lib/supabase";

const auth = vi.hoisted(() => ({
  snapshotUser: null as User | null,
  listener: null as ((snapshot: { user: User | null }) => void) | null,
  unsubscribe: vi.fn(),
}));
const bootstrap = vi.hoisted(() => ({ request: vi.fn() }));
const cache = vi.hoisted(() => ({ read: vi.fn() }));

vi.mock("../src/lib/supabase", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/lib/supabase")>();
  return {
    ...original,
    getAuthSnapshot: vi.fn(async () => ({ session: null, user: auth.snapshotUser })),
    onAuthStateChange: vi.fn((listener: typeof auth.listener) => {
      auth.listener = listener;
      return { data: { subscription: { unsubscribe: auth.unsubscribe } } };
    }),
  };
});

vi.mock("../src/lib/canonicalBootstrap", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/lib/canonicalBootstrap")>();
  return { ...original, requestCanonicalBootstrap: bootstrap.request };
});

vi.mock("../src/lib/gameCache", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/lib/gameCache")>();
  return { ...original, readGameCache: cache.read };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

function authenticatedUser(): User {
  return { id: "user-1" } as User;
}

function envelope(revision: number, cityName: string) {
  return {
    schemaVersion: 1 as const,
    revision,
    serverTime: "2026-08-06T20:00:00.000Z",
    lastProcessedAt: "2026-08-06T20:00:00.000Z",
    state: { ...initialTownState(42), revision, cityName },
  };
}

function bootstrapOptions(overrides: Record<string, unknown> = {}) {
  return {
    reconnectNonce: 0,
    canonicalQueue: new CanonicalOperationQueue(),
    bootstrapEpochRef: { current: 0 },
    applyAuthoritativeState: vi.fn(async () => true),
    clearClientGameState: vi.fn(),
    hasAuthoritativeSnapshot: () => false,
    setApiAvailable: vi.fn(),
    setCanonicalStateFailureDetails: vi.fn(),
    setCurrentUser: vi.fn(),
    setInitialGameLoadDone: vi.fn(),
    setIsAuthLoading: vi.fn(),
    setIsSyncing: vi.fn(),
    addLog: vi.fn(),
    ...overrides,
  };
}

describe("canonical session bootstrap hook", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    auth.snapshotUser = null;
    auth.listener = null;
    auth.unsubscribe.mockReset();
    bootstrap.request.mockReset();
    cache.read.mockReset();
    cache.read.mockResolvedValue(null);
  });

  afterEach(() => vi.restoreAllMocks());

  it("owns signed-out initialization, invalidation and subscription cleanup", async () => {
    const clearClientGameState = vi.fn();
    const setCurrentUser = vi.fn();
    const setInitialGameLoadDone = vi.fn();
    const setIsAuthLoading = vi.fn();
    const addLog = vi.fn();
    const bootstrapEpochRef = { current: 0 };
    const { result, unmount } = renderHook(() => useCanonicalSessionBootstrap({
      reconnectNonce: 0,
      canonicalQueue: new CanonicalOperationQueue(),
      bootstrapEpochRef,
      applyAuthoritativeState: vi.fn(async () => true),
      clearClientGameState,
      hasAuthoritativeSnapshot: () => false,
      setApiAvailable: vi.fn(),
      setCanonicalStateFailureDetails: vi.fn(),
      setCurrentUser,
      setInitialGameLoadDone,
      setIsAuthLoading,
      setIsSyncing: vi.fn(),
      addLog,
    }));

    await waitFor(() => expect(setCurrentUser).toHaveBeenCalledWith(null));
    expect(clearClientGameState).not.toHaveBeenCalled();
    expect(bootstrapEpochRef.current).toBe(0);
    expect(setIsAuthLoading).toHaveBeenCalledWith(false);
    expect(setInitialGameLoadDone).toHaveBeenCalledWith(true);
    expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Veuillez vous connecter"), "info");

    act(() => result.current.invalidate({ advanceEpoch: true }));
    expect(bootstrapEpochRef.current).toBe(1);

    unmount();
    expect(auth.unsubscribe).toHaveBeenCalledOnce();
  });

  it("applies a fast user cache before replacing it with the authoritative bootstrap", async () => {
    auth.snapshotUser = authenticatedUser();
    const server = deferred<ReturnType<typeof envelope>>();
    cache.read.mockResolvedValue({ ...initialTownState(42), revision: 2, cityName: "Cached" });
    bootstrap.request.mockReturnValue(server.promise);
    const options = bootstrapOptions();
    renderHook(() => useCanonicalSessionBootstrap(options));

    await waitFor(() => expect(options.applyAuthoritativeState).toHaveBeenCalledWith(
      expect.objectContaining({ cityName: "Cached" }),
      2,
      "user-1",
      undefined,
      undefined,
      false,
    ));

    server.resolve(envelope(3, "Server"));
    await waitFor(() => expect(options.applyAuthoritativeState).toHaveBeenCalledWith(
      expect.objectContaining({ cityName: "Server" }),
      3,
      "user-1",
      expect.any(String),
      expect.any(String),
    ));
    expect(options.setApiAvailable).toHaveBeenLastCalledWith(true);
    expect(options.setInitialGameLoadDone).toHaveBeenLastCalledWith(true);
  });

  it("ignores a slow cache when the authoritative bootstrap wins the race", async () => {
    auth.snapshotUser = authenticatedUser();
    const cached = deferred<ReturnType<typeof initialTownState>>();
    cache.read.mockReturnValue(cached.promise);
    bootstrap.request.mockResolvedValue(envelope(5, "Server first"));
    const options = bootstrapOptions();
    renderHook(() => useCanonicalSessionBootstrap(options));

    await waitFor(() => expect(options.applyAuthoritativeState).toHaveBeenCalledWith(
      expect.objectContaining({ cityName: "Server first" }),
      5,
      "user-1",
      expect.any(String),
      expect.any(String),
    ));
    cached.resolve({ ...initialTownState(42), cityName: "Too late" });
    await waitFor(() => expect(cache.read).toHaveBeenCalledOnce());
    expect(options.applyAuthoritativeState).toHaveBeenCalledOnce();
  });

  it("retries bootstrap after a revision conflict on reconnect", async () => {
    auth.snapshotUser = authenticatedUser();
    bootstrap.request
      .mockRejectedValueOnce(new GameApiError("conflict", 409, "REVISION_CONFLICT"))
      .mockResolvedValueOnce(envelope(7, "Reconnected"));
    const options = bootstrapOptions();
    const { rerender } = renderHook(
      ({ reconnectNonce }) => useCanonicalSessionBootstrap({ ...options, reconnectNonce }),
      { initialProps: { reconnectNonce: 0 } },
    );

    await waitFor(() => expect(options.addLog).toHaveBeenCalledWith(
      expect.stringContaining("concurrente"),
      "info",
    ));
    expect(options.setApiAvailable).toHaveBeenLastCalledWith(false);

    rerender({ reconnectNonce: 1 });
    await waitFor(() => expect(options.applyAuthoritativeState).toHaveBeenCalledWith(
      expect.objectContaining({ cityName: "Reconnected" }),
      7,
      "user-1",
      expect.any(String),
      expect.any(String),
    ));
    expect(bootstrap.request).toHaveBeenCalledTimes(2);
  });

  it("locks mutations when the server rejects the canonical state", async () => {
    auth.snapshotUser = authenticatedUser();
    bootstrap.request.mockRejectedValue(new GameApiError(
      "invalid",
      422,
      "INVALID_GAME_STATE",
      { error: { requestId: "request-1" } },
    ));
    const options = bootstrapOptions();
    renderHook(() => useCanonicalSessionBootstrap(options));

    await waitFor(() => expect(options.setCanonicalStateFailureDetails).toHaveBeenCalledWith({
      requestId: "request-1",
    }));
    expect(options.setApiAvailable).toHaveBeenLastCalledWith(true);
    expect(options.addLog).toHaveBeenCalledWith(
      expect.stringContaining("incompatible"),
      "defeat",
    );
  });

  it("keeps an applied cache read-only when the network bootstrap fails", async () => {
    auth.snapshotUser = authenticatedUser();
    cache.read.mockResolvedValue({ ...initialTownState(42), revision: 4, cityName: "Offline" });
    bootstrap.request.mockRejectedValue(new Error("network unavailable"));
    const options = bootstrapOptions();
    renderHook(() => useCanonicalSessionBootstrap(options));

    await waitFor(() => expect(options.addLog).toHaveBeenCalledWith(
      expect.stringContaining("lecture seule"),
      "info",
    ));
    expect(options.setApiAvailable).toHaveBeenLastCalledWith(false);
    expect(options.setInitialGameLoadDone).toHaveBeenLastCalledWith(true);
  });
});
