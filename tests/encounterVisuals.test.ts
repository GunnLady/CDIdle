import { describe, expect, it, vi } from "vitest";
import { CANONICAL_HERO_CLASSES } from "../shared/domain/hero-classes";
import {
  HERO_PORTRAIT_VARIANT_COUNT,
  NOVICE_PORTRAIT_VARIANT_COUNT,
} from "../shared/domain/hero-portrait-identity";
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
import {
  getUndercityEnemyVisualKey,
  UNDERCITY_ZONE_VISUAL_PACKS,
} from "../src/assets/undercityVisualManifest";

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

  it("loads all twenty CDI-148 combat-idle identities and keeps neutral fallback for other classes", async () => {
    const noviceIdentities = (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: NOVICE_PORTRAIT_VARIANT_COUNT }, (_, variant) => ({ gender, variant }))
    ));
    const noviceAssets = await Promise.all(noviceIdentities.map(({ gender, variant }) => (
      loadEncounterVisualAsset(`Novice_${gender}_${variant}@combat_idle`)
    )));
    for (const [index, asset] of noviceAssets.entries()) {
      const { gender, variant } = noviceIdentities[index];
      expect(asset).toMatchObject({
        status: "ready",
        descriptor: { provenance: "CDI-148 validated Novice combat-idle alpha sprites" },
      });
      expect(asset.url).toContain(
        `novice-${gender.toLowerCase()}-${String(variant + 1).padStart(2, "0")}-combat-idle-v1`,
      );
    }

    const wrappedNovice = await loadEncounterVisualAsset("Novice_Male_10@combat_idle");
    expect(wrappedNovice.url).toContain("novice-male-01-combat-idle-v1");

    const otherClass = resolveEncounterVisualDescriptor("Mage_Female_7@combat_idle");
    expect(otherClass).toMatchObject({
      provenance: "CDIdle explicit neutral hero-pose fallback",
      kind: "hero",
      fallback: false,
    });
    expect(otherClass.load).toBeTypeOf("function");
  });

  it("loads CDI-137 Warrior neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Guerrier_Male_0");
    const wrapped = await loadEncounterVisualAsset("Guerrier_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-137 validated Warrior alpha sprites" },
    });
    expect(first.url).toContain("warrior-male-01-v1");
    expect(wrapped.url).toContain("warrior-female-10-v1");
  });

  it("loads CDI-138 Rogue neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Voleur_Male_0");
    const wrapped = await loadEncounterVisualAsset("Voleur_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-138 validated Rogue alpha sprites" },
    });
    expect(first.url).toContain("rogue-male-01-v1");
    expect(wrapped.url).toContain("rogue-female-10-v1");
  });

  it("loads CDI-139 Archer neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Archer_Male_0");
    const wrapped = await loadEncounterVisualAsset("Archer_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-139 validated Archer alpha sprites" },
    });
    expect(first.url).toContain("archer-male-01-v1");
    expect(wrapped.url).toContain("archer-female-10-v1");
  });

  it("loads CDI-140 Mage neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Mage_Male_0");
    const wrapped = await loadEncounterVisualAsset("Mage_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-140 validated Mage alpha sprites" },
    });
    expect(first.url).toContain("mage-male-01-v1");
    expect(wrapped.url).toContain("mage-female-10-v1");
  });

  it("aligns available UnderCity packs with immutable blueprint member keys", () => {
    for (const pack of UNDERCITY_ZONE_VISUAL_PACKS) {
      const zone = UNDERCITY_ZONES.find((candidate) => candidate.id === pack.zoneId);
      expect(zone).toBeDefined();
      if (!zone) throw new Error(`Canonical ${pack.zoneId} zone missing`);
      const blueprints = [...zone.encounters, zone.elite, zone.boss];
      const canonicalKeys = blueprints.flatMap((blueprint) => (
        blueprint.members.map((member) => getUndercityEnemyVisualKey(blueprint.id, member.key))
      ));
      const manifestKeys = pack.enemies.map((visual) => (
        getUndercityEnemyVisualKey(visual.blueprintId, visual.memberKey)
      ));
      expect(manifestKeys).toEqual(canonicalKeys);
      expect(new Set(manifestKeys).size).toBe(canonicalKeys.length);
    }
    expect(Object.entries(ENCOUNTER_VISUAL_KEYS.sewers.ratPack)).toEqual([
      ["a", "undercity:rat-pack:a"],
      ["b", "undercity:rat-pack:b"],
      ["c", "undercity:rat-pack:c"],
    ]);
    for (const pack of UNDERCITY_ZONE_VISUAL_PACKS) {
      for (const visual of pack.enemies) {
        expect(resolveEncounterVisualDescriptor(getUndercityEnemyVisualKey(visual.blueprintId, visual.memberKey))).toMatchObject({
          kind: "enemy",
          fallback: false,
          version: 1,
          provenance: visual.provenance,
          anchor: visual.anchor,
          scale: visual.scale,
        });
      }
      for (const visual of pack.variants) {
        expect(resolveEncounterVisualDescriptor(
          getUndercityEnemyVisualKey(visual.blueprintId, visual.memberKey, visual.variantKey),
        )).toMatchObject({
          kind: "enemy",
          fallback: false,
          version: 1,
          provenance: visual.provenance,
          anchor: visual.anchor,
          scale: visual.scale,
        });
      }
    }
  });

  it("keeps the registered manifest lazy and uses useful neutral fallbacks", async () => {
    clearEncounterVisualAssetSession();
    expect(getEncounterVisualAssetCacheStats()).toEqual({ size: 0, limit: ENCOUNTER_VISUAL_CACHE_LIMIT });
    const manifest = getStaticEncounterVisualManifest();
    const undercityEntryCount = UNDERCITY_ZONE_VISUAL_PACKS.reduce(
      (total, pack) => total + 1 + pack.enemies.length + pack.variants.length,
      0,
    );
    expect(manifest).toHaveLength(undercityEntryCount + 16);
    expect(manifest.filter((entry) => entry.load)).toHaveLength(undercityEntryCount + 11);

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

  it("registers the zero-download combat effect profiles with explicit provenance", () => {
    for (const key of Object.values(ENCOUNTER_VISUAL_KEYS.effects)) {
      expect(resolveEncounterVisualDescriptor(key)).toMatchObject({
        key,
        kind: "effect",
        fallback: false,
        version: 1,
      });
      expect(resolveEncounterVisualDescriptor(key).provenance).toMatch(/CSS/);
      expect(resolveEncounterVisualDescriptor(key).load).toBeUndefined();
    }
  });

  it("registers dedicated props and the shared challenge chamber without duplicate downloads", async () => {
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
      expect(prop.url).toContain(kind === "treasure"
        ? "treasure-chest-open-v3"
        : kind === "rest"
          ? "rest-camp-v2"
          : `challenge-${kind}-v1`);
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
