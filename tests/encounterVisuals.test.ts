import { describe, expect, it, vi } from "vitest";
import { CANONICAL_HERO_CLASSES } from "../shared/domain/hero-classes";
import { HERO_PORTRAIT_VARIANT_COUNT } from "../shared/domain/hero-portrait-identity";
import { UNDERCITY_ZONES } from "../shared/domain/undercity";
import {
  clearEncounterVisualAssetSession,
  ENCOUNTER_VISUAL_CACHE_LIMIT,
  ENCOUNTER_VISUAL_KEYS,
  getEncounterHeroVisualKeys,
  getEncounterVisualAssetCacheStats,
  getStaticEncounterVisualManifest,
  loadEncounterVisualAsset,
  resolveEncounterVisualDescriptor,
} from "../src/assets/encounterVisuals";
import { createBoundedAsyncAssetCache } from "../src/assets/visualAssetCache";
import { clearVisualAssetSession, registerVisualAssetSessionCleaner } from "../src/assets/visualAssetSession";

describe("encounter visual catalog", () => {
  it("resolves all 400 canonical hero identities without changing their variant", () => {
    const keys = getEncounterHeroVisualKeys();
    expect(keys).toHaveLength(CANONICAL_HERO_CLASSES.length * 2 * HERO_PORTRAIT_VARIANT_COUNT);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      const descriptor = resolveEncounterVisualDescriptor(key);
      expect(descriptor).toMatchObject({ key, kind: "hero", fallback: false, anchor: { x: 0.5, y: 0.93 } });
      expect(descriptor.load).toBeTypeOf("function");
    }
    expect(resolveEncounterVisualDescriptor("Mage_Female_7").key).toBe("Mage_Female_7");
  });

  it("aligns rat-pack assets with immutable blueprint member keys", () => {
    const ratPack = UNDERCITY_ZONES.flatMap((zone) => zone.encounters).find((encounter) => encounter.id === "rat-pack");
    expect(ratPack?.members.map((member) => [member.key, member.name])).toEqual([
      ["a", "Rat des canaux"],
      ["b", "Rat galeux"],
      ["c", "Rat pestiféré"],
    ]);
    expect(Object.entries(ENCOUNTER_VISUAL_KEYS.sewers.ratPack)).toEqual([
      ["a", "undercity:rat-pack:a"],
      ["b", "undercity:rat-pack:b"],
      ["c", "undercity:rat-pack:c"],
    ]);
    for (const key of Object.values(ENCOUNTER_VISUAL_KEYS.sewers.ratPack)) {
      expect(resolveEncounterVisualDescriptor(key)).toMatchObject({ kind: "enemy", fallback: false, version: 1 });
    }
  });

  it("keeps the pilot manifest lazy and uses useful neutral fallbacks", async () => {
    clearEncounterVisualAssetSession();
    expect(getEncounterVisualAssetCacheStats()).toEqual({ size: 0, limit: ENCOUNTER_VISUAL_CACHE_LIMIT });
    const manifest = getStaticEncounterVisualManifest();
    expect(manifest).toHaveLength(9);
    expect(manifest.filter((entry) => entry.load)).toHaveLength(8);

    const [first, duplicate] = await Promise.all([
      loadEncounterVisualAsset(ENCOUNTER_VISUAL_KEYS.sewers.ratPack.a),
      loadEncounterVisualAsset(ENCOUNTER_VISUAL_KEYS.sewers.ratPack.a),
    ]);
    expect(first).toEqual(duplicate);
    expect(first.status).toBe("ready");
    expect(first.url).toContain("rat-pack-canal-rat-v1");
    expect(getEncounterVisualAssetCacheStats().size).toBe(1);

    const missing = await loadEncounterVisualAsset("undercity:missing:enemy");
    expect(missing).toMatchObject({ status: "fallback", url: null, descriptor: { fallback: true, fallbackGlyph: "?" } });
    clearEncounterVisualAssetSession();
    expect(getEncounterVisualAssetCacheStats().size).toBe(0);
  });

  it("registers dedicated backgrounds and reusable props for treasure and rest", async () => {
    for (const [kind, keys] of Object.entries(ENCOUNTER_VISUAL_KEYS.encounters)) {
      expect(resolveEncounterVisualDescriptor(keys.prop)).toMatchObject({
        key: keys.prop,
        kind: "prop",
        version: 1,
        fallback: false,
      });
      expect(resolveEncounterVisualDescriptor(keys.background)).toMatchObject({
        key: keys.background,
        kind: "background",
        version: 1,
        fallback: false,
      });
      const [prop, background] = await Promise.all([
        loadEncounterVisualAsset(keys.prop),
        loadEncounterVisualAsset(keys.background),
      ]);
      expect(prop.status).toBe("ready");
      expect(prop.url).toMatch(/treasure-chest-open-v3|rest-camp-v2/);
      expect(background.status).toBe("ready");
      expect(background.url).toContain(kind === "treasure"
        ? "treasure-vault-background-v2"
        : "rest-chamber-background-v1");
    }
  });
});

describe("bounded async visual cache", () => {
  it("purges registered caches when the application session changes", () => {
    const cleaner = vi.fn();
    const unregister = registerVisualAssetSessionCleaner(cleaner);
    clearVisualAssetSession();
    expect(cleaner).toHaveBeenCalledTimes(1);
    unregister();
    clearVisualAssetSession();
    expect(cleaner).toHaveBeenCalledTimes(1);
  });

  it("deduplicates slow loads, stays bounded and releases the session", async () => {
    const cache = createBoundedAsyncAssetCache<string>(2);
    let release!: (value: string) => void;
    const slowLoader = vi.fn(() => new Promise<string>((resolve) => { release = resolve; }));
    const first = cache.load("slow", slowLoader);
    const duplicate = cache.load("slow", slowLoader);
    expect(first).toBe(duplicate);
    await Promise.resolve();
    expect(slowLoader).toHaveBeenCalledTimes(1);
    release("loaded");
    await expect(first).resolves.toBe("loaded");

    await cache.load("second", async () => "second");
    await cache.load("third", async () => "third");
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("does not retain a failed asset and permits a retry", async () => {
    const cache = createBoundedAsyncAssetCache<string>(2);
    let attempts = 0;
    const loader = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("asset missing");
      return "fallback-recovered";
    };
    await expect(cache.load("missing", loader)).rejects.toThrow("asset missing");
    expect(cache.size).toBe(0);
    await expect(cache.load("missing", loader)).resolves.toBe("fallback-recovered");
    expect(attempts).toBe(2);
  });
});
