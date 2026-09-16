import type { CanonicalHeroClass } from "../../shared/domain/hero-classes";
import { HERO_SPRITE_SHEETS, type HeroPortraitGender } from "./heroSpriteSheets";
import { getCdi136NovicePortraitUrl } from "./noviceCdi136Portraits";
import { getCdi137WarriorPortraitUrl } from "./warriorCdi137Portraits";
import { getCdi138RoguePortraitUrl } from "./rogueCdi138Portraits";
import { getCdi139ArcherPortraitUrl } from "./archerCdi139Portraits";
import { HERO_SPRITE_SLICES, getHeroPortraitCacheKey } from "../domain/heroPortrait";
import { findHeroPortraitOpaqueBounds, fitHeroPortraitToFrame } from "./heroPortraitFraming";
import { createBoundedAsyncAssetCache } from "./visualAssetCache";
import { registerVisualAssetSessionCleaner } from "./visualAssetSession";

export const HERO_PORTRAIT_SHEET_CACHE_LIMIT = 4;
export const HERO_PORTRAIT_SPRITE_CACHE_LIMIT = 32;

const sourceImageCache = createBoundedAsyncAssetCache<HTMLImageElement>(HERO_PORTRAIT_SHEET_CACHE_LIMIT);
const processedSpriteCache = createBoundedAsyncAssetCache<string>(HERO_PORTRAIT_SPRITE_CACHE_LIMIT);

function loadSourceImage(url: string): Promise<HTMLImageElement> {
  return sourceImageCache.load(url, () => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load spritesheet from: ${url}`));
    image.src = url;
  }));
}

async function extractHeroPortrait(sheetUrl: string, cacheKey: string, variant: number): Promise<string> {
  return processedSpriteCache.load(cacheKey, async () => {
    const sourceImage = await loadSourceImage(sheetUrl);
    const slice = HERO_SPRITE_SLICES[variant];
    if (!slice) throw new Error(`Unknown hero portrait variant: ${variant}`);
    const canvas = document.createElement("canvas");
    canvas.width = slice.width;
    canvas.height = slice.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2d context for hero portrait");

    context.drawImage(
      sourceImage,
      slice.x,
      slice.y,
      slice.width,
      slice.height,
      0,
      0,
      slice.width,
      slice.height,
    );

    const imageData = context.getImageData(0, 0, slice.width, slice.height);
    const pixels = imageData.data;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const greenDominance = green - Math.max(red, blue);
      if (green > 45 && greenDominance > 25 && green > red * 1.25 && green > blue * 1.25) {
        pixels[index + 3] = 0;
      }
    }
    context.putImageData(imageData, 0, 0);
    const opaqueBounds = findHeroPortraitOpaqueBounds(pixels, slice.width, slice.height);
    if (!opaqueBounds) throw new Error(`Hero portrait contains no visible pixels: ${cacheKey}`);
    const placement = fitHeroPortraitToFrame(opaqueBounds, slice.width, slice.height);
    const framedCanvas = document.createElement("canvas");
    framedCanvas.width = slice.width;
    framedCanvas.height = slice.height;
    const framedContext = framedCanvas.getContext("2d");
    if (!framedContext) throw new Error("Could not get 2d context for framed hero portrait");
    framedContext.imageSmoothingEnabled = false;
    framedContext.drawImage(
      canvas,
      placement.source.x,
      placement.source.y,
      placement.source.width,
      placement.source.height,
      placement.destination.x,
      placement.destination.y,
      placement.destination.width,
      placement.destination.height,
    );
    return framedCanvas.toDataURL("image/png");
  });
}

export interface HeroPortraitAssetRequest {
  classType: CanonicalHeroClass;
  gender: HeroPortraitGender;
  variant: number;
}

export interface ResolvedHeroPortraitAsset {
  url: string;
  requestedKey: string;
  resolvedKey: string;
  fallback: boolean;
}

export async function loadHeroPortraitAsset(request: HeroPortraitAssetRequest): Promise<ResolvedHeroPortraitAsset> {
  const classType = request.classType;
  const requestedKey = getHeroPortraitCacheKey(classType, request.gender, request.variant);
  if (classType === "Novice") {
    return {
      url: getCdi136NovicePortraitUrl(request.gender, request.variant),
      requestedKey,
      resolvedKey: requestedKey,
      fallback: false,
    };
  }
  if (classType === "Guerrier") {
    return {
      url: getCdi137WarriorPortraitUrl(request.gender, request.variant),
      requestedKey,
      resolvedKey: requestedKey,
      fallback: false,
    };
  }
  if (classType === "Voleur") {
    return {
      url: getCdi138RoguePortraitUrl(request.gender, request.variant),
      requestedKey,
      resolvedKey: requestedKey,
      fallback: false,
    };
  }
  if (classType === "Archer") {
    return {
      url: getCdi139ArcherPortraitUrl(request.gender, request.variant),
      requestedKey,
      resolvedKey: requestedKey,
      fallback: false,
    };
  }
  try {
    return {
      url: await extractHeroPortrait(HERO_SPRITE_SHEETS[classType][request.gender], requestedKey, request.variant),
      requestedKey,
      resolvedKey: requestedKey,
      fallback: false,
    };
  } catch {
    const fallbackKey = getHeroPortraitCacheKey("Novice", request.gender, request.variant);
    return {
      url: getCdi136NovicePortraitUrl(request.gender, request.variant),
      requestedKey,
      resolvedKey: fallbackKey,
      fallback: true,
    };
  }
}

export function clearHeroPortraitAssetSession(): void {
  processedSpriteCache.clear();
  sourceImageCache.clear();
}

export function getHeroPortraitAssetCacheStats() {
  return {
    sheets: sourceImageCache.size,
    sprites: processedSpriteCache.size,
    sheetLimit: sourceImageCache.limit,
    spriteLimit: processedSpriteCache.limit,
  };
}

registerVisualAssetSessionCleaner(clearHeroPortraitAssetSession);
