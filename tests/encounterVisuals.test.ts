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
  CDI149_WARRIOR_COMBAT_IDLE_VARIANT_COUNT,
  getCdi149WarriorCombatIdlePivotX,
} from "../src/assets/warriorCdi149CombatPoses";
import { CDI150_ROGUE_COMBAT_IDLE_VARIANT_COUNT } from "../src/assets/rogueCdi150CombatPoses";
import { CDI151_ARCHER_COMBAT_IDLE_VARIANT_COUNT } from "../src/assets/archerCdi151CombatPoses";
import { CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT } from "../src/assets/mageCdi152CombatPoses";
import {
  CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT,
  getCdi153AcolyteCombatIdleScale,
} from "../src/assets/acolyteCdi153CombatPoses";
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

  it("loads all twenty CDI-148 Novice combat-idle identities", async () => {
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
  });

  it("loads all twenty CDI-149 Warrior combat-idle identities without weapon-based downscaling", async () => {
    const warriorIdentities = (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: CDI149_WARRIOR_COMBAT_IDLE_VARIANT_COUNT }, (_, variant) => ({ gender, variant }))
    ));
    const warriorAssets = await Promise.all(warriorIdentities.map(({ gender, variant }) => (
      loadEncounterVisualAsset(`Guerrier_${gender}_${variant}@combat_idle`)
    )));
    for (const [index, asset] of warriorAssets.entries()) {
      const { gender, variant } = warriorIdentities[index];
      expect(asset).toMatchObject({
        status: "ready",
        descriptor: {
          provenance: "CDI-149 validated Warrior combat-idle alpha sprites",
          anchor: { x: 0.5, y: 900 / 920 },
          pivotX: getCdi149WarriorCombatIdlePivotX(gender, variant),
          scale: 920 / 692,
          fit: "height",
        },
      });
      expect(asset.url).toContain(
        `warrior-${gender.toLowerCase()}-${String(variant + 1).padStart(2, "0")}-combat-idle-v1`,
      );
    }

    const wrappedWarrior = await loadEncounterVisualAsset("Guerrier_Female_19@combat_idle");
    expect(wrappedWarrior.url).toContain("warrior-female-10-combat-idle-v1");
    expect(wrappedWarrior.descriptor.pivotX).toBe(314.5 / 776);

    const otherClass = resolveEncounterVisualDescriptor("Aède_Female_7@combat_idle");
    expect(otherClass).toMatchObject({
      provenance: "CDIdle explicit neutral hero-pose fallback",
      kind: "hero",
      fallback: false,
    });
    expect(otherClass.load).toBeTypeOf("function");
  });

  it("loads all twenty CDI-150 Rogue combat-idle identities with their neutral variant", async () => {
    const identities = (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: CDI150_ROGUE_COMBAT_IDLE_VARIANT_COUNT }, (_, variant) => ({ gender, variant }))
    ));
    const assets = await Promise.all(identities.map(({ gender, variant }) => (
      loadEncounterVisualAsset(`Voleur_${gender}_${variant}@combat_idle`)
    )));
    for (const [index, asset] of assets.entries()) {
      const { gender, variant } = identities[index];
      const rogueScale = gender === "Female"
        ? ({ 1: 1.05, 3: 0.90, 5: 1.04, 6: 1.03, 9: 1.05 } as Record<number, number>)[variant] ?? 1
        : ({ 2: 1.03, 3: 1.03, 8: 1.05, 9: 1.05 } as Record<number, number>)[variant] ?? 1;
      expect(asset).toMatchObject({
        status: "ready",
        descriptor: {
          provenance: "CDI-150 validated Rogue combat-idle alpha sprites",
          anchor: { x: 0.5, y: 900 / 920 },
          pivotX: 0.5,
          scale: 920 / 692 * rogueScale,
          fit: "height",
        },
      });
      expect(asset.url).toContain(
        `rogue-${gender.toLowerCase()}-${String(variant + 1).padStart(2, "0")}-combat-idle-v1`,
      );
      expect(resolveEncounterVisualDescriptor(`Voleur_${gender}_${variant}`)).toMatchObject({
        provenance: "CDI-138 validated Rogue alpha sprites",
        anchor: { x: 0.5, y: 0.93 },
        scale: 1,
      });
    }
    const wrapped = await loadEncounterVisualAsset("Voleur_Female_19@combat_idle");
    expect(wrapped.url).toContain("rogue-female-10-combat-idle-v1");
  });

  it("loads all twenty CDI-151 Archer combat-idle identities with their neutral variant", async () => {
    const expectedScaleAdjustments: Record<string, number> = {
      Male_0: 1.05,
      Female_1: 1.03,
      Male_1: 1.03,
      Female_3: 1.05,
      Male_3: 1.05,
      Female_4: 1.08,
      Female_5: 1.05,
      Male_5: 1.08,
      Female_6: 1.03,
      Male_6: 1.05,
      Female_7: 1.08,
      Female_8: 1.07,
      Female_9: 1.15,
    };
    const identities = (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: CDI151_ARCHER_COMBAT_IDLE_VARIANT_COUNT }, (_, variant) => ({ gender, variant }))
    ));
    const assets = await Promise.all(identities.map(({ gender, variant }) => (
      loadEncounterVisualAsset(`Archer_${gender}_${variant}@combat_idle`)
    )));
    for (const [index, asset] of assets.entries()) {
      const { gender, variant } = identities[index];
      expect(asset).toMatchObject({
        status: "ready",
        descriptor: {
          provenance: "CDI-151 validated Archer combat-idle alpha sprites",
          anchor: { x: 0.5, y: 900 / 920 },
          pivotX: 0.5,
          scale: 920 / 692 * (expectedScaleAdjustments[`${gender}_${variant}`] ?? 1),
          fit: "height",
        },
      });
      expect(asset.url).toContain(
        `archer-${gender.toLowerCase()}-${String(variant + 1).padStart(2, "0")}-combat-idle-v1`,
      );
      expect(resolveEncounterVisualDescriptor(`Archer_${gender}_${variant}`)).toMatchObject({
        provenance: "CDI-139 validated Archer alpha sprites",
        anchor: { x: 0.5, y: 0.93 },
        scale: 1,
      });
    }
    const wrapped = await loadEncounterVisualAsset("Archer_Female_19@combat_idle");
    expect(wrapped.url).toContain("archer-female-10-combat-idle-v1");
  });

  it("loads all twenty CDI-152 Mage combat-idle identities with their neutral variant", async () => {
    const expectedScaleAdjustments: Record<string, number> = {
      Female_0: 0.65,
      Male_0: 0.65,
      Female_1: 0.72,
      Male_1: 0.8,
      Female_2: 0.68,
      Male_2: 0.68,
      Female_3: 0.7,
      Male_3: 0.9,
      Female_4: 0.7,
      Male_4: 0.75,
      Female_5: 0.7,
      Male_5: 0.83,
      Female_6: 0.75,
      Male_6: 0.75,
      Female_7: 0.75,
      Male_7: 0.75,
      Female_8: 0.7,
      Male_8: 0.75,
      Female_9: 0.7,
      Male_9: 0.75,
    };
    const identities = (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: CDI152_MAGE_COMBAT_IDLE_VARIANT_COUNT }, (_, variant) => ({ gender, variant }))
    ));
    const assets = await Promise.all(identities.map(({ gender, variant }) => (
      loadEncounterVisualAsset(`Mage_${gender}_${variant}@combat_idle`)
    )));
    for (const [index, asset] of assets.entries()) {
      const { gender, variant } = identities[index];
      expect(asset).toMatchObject({
        status: "ready",
        descriptor: {
          provenance: "CDI-152 validated Mage combat-idle alpha sprites",
          anchor: { x: 0.5, y: 900 / 920 },
          pivotX: 0.5,
          scale: 920 / 692 * (expectedScaleAdjustments[`${gender}_${variant}`] ?? 1),
          fit: "height",
        },
      });
      expect(asset.url).toContain(
        `mage-${gender.toLowerCase()}-${String(variant + 1).padStart(2, "0")}-combat-idle-v1`,
      );
      expect(resolveEncounterVisualDescriptor(`Mage_${gender}_${variant}`)).toMatchObject({
        provenance: "CDI-140 validated Mage alpha sprites",
        anchor: { x: 0.5, y: 0.93 },
        scale: 1,
      });
    }
    const wrapped = await loadEncounterVisualAsset("Mage_Female_19@combat_idle");
    expect(wrapped.url).toContain("mage-female-10-combat-idle-v1");
  });

  it("loads all twenty CDI-153 Acolyte combat-idle identities and keeps neutral portraits separate", async () => {
    const identities = (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: CDI153_ACOLYTE_COMBAT_IDLE_VARIANT_COUNT }, (_, variant) => ({ gender, variant }))
    ));
    const assets = await Promise.all(identities.map(({ gender, variant }) => (
      loadEncounterVisualAsset(`Acolyte_${gender}_${variant}@combat_idle`)
    )));
    for (const [index, asset] of assets.entries()) {
      const { gender, variant } = identities[index];
      expect(asset).toMatchObject({
        status: "ready",
        descriptor: {
          provenance: "CDI-153 validated Acolyte combat-idle alpha sprites",
          anchor: { x: 0.5, y: 900 / 920 },
          pivotX: 0.5,
          scale: 920 / 692 * getCdi153AcolyteCombatIdleScale(gender, variant),
          fit: "height",
        },
      });
      expect(asset.url).toContain(
        `acolyte-${gender.toLowerCase()}-${String(variant + 1).padStart(2, "0")}-combat-idle-v1`,
      );
      expect(resolveEncounterVisualDescriptor(`Acolyte_${gender}_${variant}`)).toMatchObject({
        provenance: "CDI-141 validated Acolyte alpha sprites",
        anchor: { x: 0.5, y: 0.93 },
        scale: 1,
      });
    }
    const wrapped = await loadEncounterVisualAsset("Acolyte_Female_19@combat_idle");
    expect(wrapped.url).toContain("acolyte-female-10-combat-idle-v1");
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

  it("loads CDI-141 Acolyte neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Acolyte_Male_0");
    const wrapped = await loadEncounterVisualAsset("Acolyte_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-141 validated Acolyte alpha sprites" },
    });
    expect(first.url).toContain("acolyte-male-01-v1");
    expect(wrapped.url).toContain("acolyte-female-10-v1");
  });

  it("loads CDI-142 Aede neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("A\u00e8de_Male_0");
    const wrapped = await loadEncounterVisualAsset("A\u00e8de_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-142 validated Aede alpha sprites" },
    });
    expect(first.url).toContain("aede-male-01-v1");
    expect(wrapped.url).toContain("aede-female-10-v1");
  });

  it("loads CDI-143 Druid neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Druide_Male_0");
    const wrapped = await loadEncounterVisualAsset("Druide_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-143 validated Druid alpha sprites" },
    });
    expect(first.url).toContain("druid-male-01-v1");
    expect(wrapped.url).toContain("druid-female-10-v1");
  });

  it("loads CDI-144 Artificer neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Artificier_Male_0");
    const wrapped = await loadEncounterVisualAsset("Artificier_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-144 validated Artificer alpha sprites" },
    });
    expect(first.url).toContain("artificer-male-01-v1");
    expect(wrapped.url).toContain("artificer-female-10-v1");
  });

  it("loads CDI-145 Pugilist neutral sprites through stable legacy identity keys", async () => {
    const first = await loadEncounterVisualAsset("Pugiliste_Male_0");
    const wrapped = await loadEncounterVisualAsset("Pugiliste_Female_19");

    expect(first).toMatchObject({
      status: "ready",
      descriptor: { provenance: "CDI-145 validated Pugilist alpha sprites" },
    });
    expect(first.url).toContain("pugilist-male-01-v1");
    expect(wrapped.url).toContain("pugilist-female-10-v1");
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
