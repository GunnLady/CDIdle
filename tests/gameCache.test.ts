import { describe, expect, it } from "vitest";
import { gameCacheConstants, purgeLegacyGameCache } from "../src/lib/gameCache";

describe("game cache contract", () => {
  it("uses a per-user IndexedDB store and purges the legacy localStorage key", async () => {
    localStorage.setItem(gameCacheConstants.LEGACY_STORAGE_KEY, "legacy");
    await purgeLegacyGameCache();
    expect(localStorage.getItem(gameCacheConstants.LEGACY_STORAGE_KEY)).toBeNull();
    expect(gameCacheConstants.STORE_NAME).toBe("game-snapshots");
  });
});
