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
  fallback: {
    actor: "fallback:actor",
    background: "fallback:background",
  },
} as const;

export type EncounterVisualKind = "background" | "enemy" | "hero" | "effect";

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

const staticCatalog: Readonly<Record<string, EncounterVisualDescriptor>> = {
  [ENCOUNTER_VISUAL_KEYS.sewers.background]: {
    key: ENCOUNTER_VISUAL_KEYS.sewers.background,
    kind: "background",
    version: 1,
    provenance: "CDIdle ImageGen kit Égouts v1",
    anchor: { x: 0.5, y: 1 },
    scale: 1,
    fallbackGlyph: "",
    fallback: false,
    load: loadedUrl(sewersStageUrl),
  },
  [ENCOUNTER_VISUAL_KEYS.sewers.ratPack.a]: {
    key: ENCOUNTER_VISUAL_KEYS.sewers.ratPack.a,
    kind: "enemy",
    version: 1,
    provenance: "CDIdle ImageGen rat-pack v1",
    anchor: { x: 0.5, y: 0.86 },
    scale: 0.9,
    fallbackGlyph: "R",
    fallback: false,
    load: loadedUrl(canalRatUrl),
  },
  [ENCOUNTER_VISUAL_KEYS.sewers.ratPack.b]: {
    key: ENCOUNTER_VISUAL_KEYS.sewers.ratPack.b,
    kind: "enemy",
    version: 1,
    provenance: "CDIdle ImageGen rat-pack v1",
    anchor: { x: 0.5, y: 0.88 },
    scale: 1,
    fallbackGlyph: "R",
    fallback: false,
    load: loadedUrl(mangyRatUrl),
  },
  [ENCOUNTER_VISUAL_KEYS.sewers.ratPack.c]: {
    key: ENCOUNTER_VISUAL_KEYS.sewers.ratPack.c,
    kind: "enemy",
    version: 1,
    provenance: "CDIdle ImageGen rat-pack v1",
    anchor: { x: 0.5, y: 0.87 },
    scale: 0.94,
    fallbackGlyph: "R",
    fallback: false,
    load: loadedUrl(plagueRatUrl),
  },
  [ENCOUNTER_VISUAL_KEYS.effects.physicalImpact]: {
    key: ENCOUNTER_VISUAL_KEYS.effects.physicalImpact,
    kind: "effect",
    version: 1,
    provenance: "CDI-097 CSS impact profile",
    anchor: { x: 0.5, y: 0.2 },
    scale: 1,
    fallbackGlyph: "✦",
    fallback: false,
  },
};

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
