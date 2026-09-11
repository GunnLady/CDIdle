import { CANONICAL_HERO_CLASSES, type CanonicalHeroClass } from "../../shared/domain/hero-classes";
import { HERO_PORTRAIT_VARIANT_COUNT } from "../../shared/domain/hero-portrait-identity";
import {
  getHeroPortraitCacheKey,
  parseHeroPortraitCacheKey,
} from "../domain/heroPortrait";
import {
  clearHeroPortraitAssetSession,
  loadHeroPortraitAsset,
} from "./heroPortraitAssets";
import { createBoundedAsyncAssetCache } from "./visualAssetCache";
import { registerVisualAssetSessionCleaner } from "./visualAssetSession";
import sewersStageUrl from "./images/dungeon/undercity/sewers/undercity-sewers-stage-v1.jpg";
import canalRatUrl from "./images/dungeon/undercity/sewers/rat-pack-canal-rat-v1.png";
import mangyRatUrl from "./images/dungeon/undercity/sewers/rat-pack-mangy-rat-v1.png";
import plagueRatUrl from "./images/dungeon/undercity/sewers/rat-pack-plague-rat-v1.png";
import restCampUrl from "./images/dungeon/encounters/rest-camp-v2.png";
import restChamberBackgroundUrl from "./images/dungeon/encounters/rest-chamber-background-v1.jpg";
import treasureChestOpenUrl from "./images/dungeon/encounters/treasure-chest-open-v3.png";
import treasureVaultBackgroundUrl from "./images/dungeon/encounters/treasure-vault-background-v2.jpg";

export const ENCOUNTER_VISUAL_CATALOG_VERSION = 1;
export const ENCOUNTER_VISUAL_CACHE_LIMIT = 16;

export const ENCOUNTER_VISUAL_KEYS = {
  sewers: {
    background: "undercity:sewers:background",
    ratPack: {
      a: "undercity:rat-pack:a",
      b: "undercity:rat-pack:b",
      c: "undercity:rat-pack:c",
    },
  },
  effects: {
    physicalImpact: "effect:physical-impact",
  },
  encounters: {
    rest: {
      background: "undercity:rest-chamber:background",
      prop: "encounter:rest-camp",
    },
    treasure: {
      background: "undercity:treasure-vault:background",
      prop: "encounter:treasure",
    },
  },
  fallback: {
    actor: "fallback:actor",
    background: "fallback:background",
  },
} as const;

export type EncounterVisualKind = "background" | "enemy" | "hero" | "effect" | "prop";

export interface EncounterVisualDescriptor {
  key: string;
  kind: EncounterVisualKind;
  version: number;
  provenance: string;
  anchor: { x: number; y: number };
  scale: number;
  fallbackGlyph: string;
  fallback: boolean;
  load?: () => Promise<string>;
}

const loadedUrl = (url: string) => () => Promise.resolve(url);

type StaticVisual = readonly [
  key: string,
  kind: EncounterVisualKind,
  provenance: string,
  anchorY: number,
  scale: number,
  fallbackGlyph: string,
  url?: string,
];

const staticCatalog: Readonly<Record<string, EncounterVisualDescriptor>> = Object.fromEntries(([
  [ENCOUNTER_VISUAL_KEYS.sewers.background, "background", "CDIdle ImageGen kit Égouts v1", 1, 1, "", sewersStageUrl],
  [ENCOUNTER_VISUAL_KEYS.sewers.ratPack.a, "enemy", "CDIdle ImageGen rat-pack v1", 0.86, 0.9, "R", canalRatUrl],
  [ENCOUNTER_VISUAL_KEYS.sewers.ratPack.b, "enemy", "CDIdle ImageGen rat-pack v1", 0.88, 1, "R", mangyRatUrl],
  [ENCOUNTER_VISUAL_KEYS.sewers.ratPack.c, "enemy", "CDIdle ImageGen rat-pack v1", 0.87, 0.94, "R", plagueRatUrl],
  [ENCOUNTER_VISUAL_KEYS.effects.physicalImpact, "effect", "CDI-097 CSS impact profile", 0.2, 1, "✦"],
  [ENCOUNTER_VISUAL_KEYS.encounters.treasure.background, "background", "CDIdle ImageGen salle de trésor v1", 1, 1, "", treasureVaultBackgroundUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.treasure.prop, "prop", "CDIdle ImageGen coffre v3", 0.94, 1, "◇", treasureChestOpenUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.rest.background, "background", "CDIdle ImageGen salle de repos v1", 1, 1, "", restChamberBackgroundUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.rest.prop, "prop", "CDIdle ImageGen repos v2", 0.93, 1, "✦", restCampUrl],
] satisfies StaticVisual[]).map(([key, kind, provenance, anchorY, scale, fallbackGlyph, url]) => [key, {
  key,
  kind,
  version: 1,
  provenance,
  anchor: { x: 0.5, y: anchorY },
  scale,
  fallbackGlyph,
  fallback: false,
  load: url ? loadedUrl(url) : undefined,
}]));

const visualAssetCache = createBoundedAsyncAssetCache<string>(ENCOUNTER_VISUAL_CACHE_LIMIT);

function fallbackDescriptor(key: string): EncounterVisualDescriptor {
  const background = key.includes("background");
  const hero = parseHeroPortraitCacheKey(key) !== null;
  const effect = key.startsWith("effect:");
  return {
    key,
    kind: background ? "background" : hero ? "hero" : effect ? "effect" : "enemy",
    version: ENCOUNTER_VISUAL_CATALOG_VERSION,
    provenance: "CDIdle neutral fallback",
    anchor: { x: 0.5, y: 0.9 },
    scale: 1,
    fallbackGlyph: background ? "" : hero ? "◆" : effect ? "✦" : "?",
    fallback: true,
  };
}

export function getEncounterHeroVisualKeys(): string[] {
  return CANONICAL_HERO_CLASSES.flatMap((classType) => (
    (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: HERO_PORTRAIT_VARIANT_COUNT }, (_, variant) => (
        getHeroPortraitCacheKey(classType, gender, variant)
      ))
    ))
  ));
}

export function resolveEncounterVisualDescriptor(key: string): EncounterVisualDescriptor {
  const staticDescriptor = staticCatalog[key];
  if (staticDescriptor) return staticDescriptor;
  const heroIdentity = parseHeroPortraitCacheKey(key);
  if (!heroIdentity) return fallbackDescriptor(key);
  return {
    key,
    kind: "hero",
    version: ENCOUNTER_VISUAL_CATALOG_VERSION,
    provenance: "CDIdle canonical hero spritesheets",
    anchor: { x: 0.5, y: 0.93 },
    scale: 1,
    fallbackGlyph: "◆",
    fallback: false,
    load: () => loadHeroPortraitAsset({
      classType: heroIdentity.classType as CanonicalHeroClass,
      gender: heroIdentity.gender,
      variant: heroIdentity.variant,
    }).then((asset) => asset.url),
  };
}

export interface LoadedEncounterVisual {
  descriptor: EncounterVisualDescriptor;
  url: string | null;
  status: "ready" | "fallback";
}

export async function loadEncounterVisualAsset(key: string): Promise<LoadedEncounterVisual> {
  const descriptor = resolveEncounterVisualDescriptor(key);
  if (!descriptor.load) {
    return { descriptor, url: null, status: descriptor.fallback ? "fallback" : "ready" };
  }
  try {
    const url = await visualAssetCache.load(descriptor.key, descriptor.load);
    return { descriptor, url, status: "ready" };
  } catch {
    return { descriptor: fallbackDescriptor(key), url: null, status: "fallback" };
  }
}

export function clearEncounterVisualAssetSession(): void {
  visualAssetCache.clear();
  clearHeroPortraitAssetSession();
}

export function getEncounterVisualAssetCacheStats() {
  return { size: visualAssetCache.size, limit: visualAssetCache.limit };
}

export function getStaticEncounterVisualManifest(): readonly EncounterVisualDescriptor[] {
  return Object.values(staticCatalog);
}

registerVisualAssetSessionCleaner(() => visualAssetCache.clear());
