import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteGameCache,
  gameCacheConstants,
  purgeLegacyGameCache,
  readGameCache,
  writeGameCache,
} from "../src/lib/gameCache";
import { createIndexedDbMock } from "./helpers/indexedDbMock";
import { initialTownState } from "../supabase/functions/game-api/town-authority";

const cacheSnapshot = (cityName: string, revision: number) => ({
  ...initialTownState(42),
  cityName,
  revision,
});

describe("game cache contract", () => {
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mock = createIndexedDbMock();
    close = mock.close;
    vi.stubGlobal("indexedDB", mock.indexedDb);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("uses a per-user IndexedDB store and purges the legacy localStorage key", async () => {
    localStorage.setItem(gameCacheConstants.LEGACY_STORAGE_KEY, "legacy");
    await purgeLegacyGameCache();
    expect(localStorage.getItem(gameCacheConstants.LEGACY_STORAGE_KEY)).toBeNull();
    expect(gameCacheConstants.STORE_NAME).toBe("game-snapshots");
  });

  it("isolates snapshots by user and replaces only with a newer canonical revision", async () => {
    await writeGameCache("user-a", cacheSnapshot("A", 1));
    await writeGameCache("user-b", cacheSnapshot("B", 2));
    await writeGameCache("user-a", cacheSnapshot("Reset", 3));
    await writeGameCache("user-a", cacheSnapshot("Stale", 2));

    await expect(readGameCache("user-a")).resolves.toMatchObject({ cityName: "Reset", revision: 3 });
    await expect(readGameCache("user-b")).resolves.toMatchObject({ cityName: "B", revision: 2 });
  });

  it("round-trips the optional initial encounter actors without projecting current heroes", async () => {
    const initialActors = {
      v: 1 as const,
      h: [["historical-hero", "Novice_Female_3", 12, 20, 4, 10, 0] as [string, string, number, number, number, number, 0]],
      e: [],
    };
    const cached = {
      ...cacheSnapshot("Actors", 8),
      encounterHistory: [{
        encounterId: "cached-encounter", dungeonId: "undercity", kind: "rest" as const,
        floor: 1, room: 2, outcome: "victory" as const, roundCount: 0,
        enemy: null, initialActors, transcript: [], rewards: { gold: 0, loot: [] },
      }],
    };

    await writeGameCache("actor-user", cached);

    await expect(readGameCache("actor-user")).resolves.toMatchObject({
      encounterHistory: [{ initialActors }],
    });
  });

  it("deletes only the targeted user snapshot without allowing resurrection", async () => {
    await writeGameCache("deleted-user", cacheSnapshot("Old kingdom", 42));
    await writeGameCache("other-user", cacheSnapshot("Other kingdom", 7));

    await deleteGameCache("deleted-user");

    await expect(readGameCache("deleted-user")).resolves.toBeNull();
    await expect(readGameCache("other-user")).resolves.toMatchObject({ cityName: "Other kingdom", revision: 7 });
    expect(close).toHaveBeenCalled();
  });

  it("rejects a write whose transaction aborts after the request succeeds", async () => {
    const mock = createIndexedDbMock({ abortWrites: true });
    vi.stubGlobal("indexedDB", mock.indexedDb);

    await expect(writeGameCache("user-a", cacheSnapshot("Abort", 3))).rejects.toMatchObject({ name: "AbortError" });
    expect(mock.records.has("user-a")).toBe(false);
    expect(mock.close).toHaveBeenCalled();
  });

  it("times out instead of freezing authoritative initialization when IndexedDB never opens", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("indexedDB", {
      open: () => ({} as IDBOpenDBRequest),
    } as unknown as IDBFactory);

    const write = writeGameCache("user-a", cacheSnapshot("Timeout", 3));
    const rejection = expect(write).rejects.toMatchObject({
      name: "TimeoutError",
      message: "CACHE_OPEN_TIMEOUT",
    });
    await vi.advanceTimersByTimeAsync(gameCacheConstants.CACHE_OPERATION_TIMEOUT_MS);

    await rejection;
  });
});
