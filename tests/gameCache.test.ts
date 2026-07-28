import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteGameCache,
  gameCacheConstants,
  purgeLegacyGameCache,
  readGameCache,
  writeGameCache,
} from "../src/lib/gameCache";
import { createIndexedDbMock } from "./helpers/indexedDbMock";

describe("game cache contract", () => {
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mock = createIndexedDbMock();
    close = mock.close;
    vi.stubGlobal("indexedDB", mock.indexedDb);
  });

  afterEach(() => {
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
    await writeGameCache("user-a", { cityName: "A", revision: 1 });
    await writeGameCache("user-b", { cityName: "B", revision: 2 });
    await writeGameCache("user-a", { cityName: "Reset", revision: 3 });
    await writeGameCache("user-a", { cityName: "Stale", revision: 2 });

    await expect(readGameCache("user-a")).resolves.toEqual({ cityName: "Reset", revision: 3 });
    await expect(readGameCache("user-b")).resolves.toEqual({ cityName: "B", revision: 2 });
  });

  it("deletes only the targeted user snapshot without allowing resurrection", async () => {
    await writeGameCache("deleted-user", { cityName: "Old kingdom", revision: 42 });
    await writeGameCache("other-user", { cityName: "Other kingdom", revision: 7 });

    await deleteGameCache("deleted-user");

    await expect(readGameCache("deleted-user")).resolves.toBeNull();
    await expect(readGameCache("other-user")).resolves.toEqual({ cityName: "Other kingdom", revision: 7 });
    expect(close).toHaveBeenCalled();
  });

  it("rejects a write whose transaction aborts after the request succeeds", async () => {
    const mock = createIndexedDbMock({ abortWrites: true });
    vi.stubGlobal("indexedDB", mock.indexedDb);

    await expect(writeGameCache("user-a", { revision: 3 })).rejects.toMatchObject({ name: "AbortError" });
    expect(mock.records.has("user-a")).toBe(false);
    expect(mock.close).toHaveBeenCalled();
  });
});
