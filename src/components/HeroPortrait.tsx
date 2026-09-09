import React, { useEffect, useState } from "react";
import { HERO_SPRITE_SHEETS } from "../assets/heroSpriteSheets";
import {
  HERO_SPRITE_SLICES,
  getHeroPortraitCacheKey,
  resolveHeroPortraitIdentity,
  type HeroPortraitView,
} from "../domain/heroPortrait";

const spriteCache = new Map<string, string>();
const sourceImageCache = new Map<string, Promise<HTMLImageElement>>();
const spriteProcessingCache = new Map<string, Promise<string>>();

function loadSourceImage(url: string): Promise<HTMLImageElement> {
  const cached = sourceImageCache.get(url);
  if (cached) return cached;

  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load spritesheet from: ${url}`));
    image.src = url;
  }).catch((error) => {
    sourceImageCache.delete(url);
    throw error;
  });
  sourceImageCache.set(url, loading);
  return loading;
}

function processSprite(sheetUrl: string, cacheKey: string, variant: number): Promise<string> {
  const cachedSprite = spriteCache.get(cacheKey);
  if (cachedSprite) return Promise.resolve(cachedSprite);

  const inProgress = spriteProcessingCache.get(cacheKey);
  if (inProgress) return inProgress;

  const processing = loadSourceImage(sheetUrl).then((sourceImage) => {
    const slice = HERO_SPRITE_SLICES[variant];
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

    const spriteUrl = canvas.toDataURL("image/png");
    spriteCache.set(cacheKey, spriteUrl);
    return spriteUrl;
  }).finally(() => {
    spriteProcessingCache.delete(cacheKey);
  });

  spriteProcessingCache.set(cacheKey, processing);
  return processing;
}

interface HeroPortraitProps {
  hero: HeroPortraitView;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  noBorder?: boolean;
  noBg?: boolean;
  noPadding?: boolean;
}

export default function HeroPortrait({
  hero,
  size = "md",
  className = "",
  noBorder = false,
  noBg = false,
  noPadding = false,
}: HeroPortraitProps) {
  const { gender, variant } = resolveHeroPortraitIdentity(hero);
  const cacheKey = getHeroPortraitCacheKey(hero.classType, gender, variant);
  const cachedSprite = spriteCache.get(cacheKey);
  const [resolvedSprite, setResolvedSprite] = useState<{ key: string; url: string } | null>(null);
  const spriteUrl = cachedSprite ?? (resolvedSprite?.key === cacheKey ? resolvedSprite.url : undefined);

  useEffect(() => {
    let active = true;
    const primarySheet = HERO_SPRITE_SHEETS[hero.classType][gender];

    processSprite(primarySheet, cacheKey, variant)
      .catch(async (primaryError: unknown) => {
        if (hero.classType === "Novice") throw primaryError;
        console.warn(`Tier 1 portrait unavailable for ${hero.classType}; using matching Novice portrait.`, primaryError);
        const fallbackKey = getHeroPortraitCacheKey("Novice", gender, variant);
        return processSprite(HERO_SPRITE_SHEETS.Novice[gender], fallbackKey, variant);
      })
      .then((url) => {
        if (active) setResolvedSprite({ key: cacheKey, url });
      })
      .catch((error: unknown) => {
        console.error("Error processing hero portrait:", error);
      });

    return () => {
      active = false;
    };
  }, [cacheKey, gender, hero.classType, variant]);

  // Sizes mapping
  const sizeClasses = {
    xs: "w-8 h-8 rounded-md",
    sm: "w-10 h-10 rounded-lg",
    md: "w-14 h-14 rounded-xl",
    lg: "w-24 h-24 rounded-2xl",
    xl: "w-40 h-40 rounded-3xl",
  };

  const getClassEmoji = (cls: string) => {
    switch (cls) {
      case "Guerrier": return "⚔️";
      case "Voleur": return "🗡️";
      case "Archer": return "🏹";
      case "Mage": return "🔮";
      case "Acolyte": return "☀️";
      case "Aède": return "🎵";
      case "Druide": return "🍃";
      case "Artificier": return "⚙️";
      case "Pugiliste": return "👊";
      default: return "🧑‍🌾";
    }
  };

  const fallbackEmoji = getClassEmoji(hero.classType);

  const borderClass = noBorder ? "" : "border-2 border-[#caa050]/40";
  const bgClass = noBg ? "" : "bg-[#160f0a]/80";
  const paddingClass = noPadding ? "" : "p-1";

  if (spriteUrl) {
    return (
      <img
        id={`hero-portrait-${hero.id}`}
        src={spriteUrl}
        alt={hero.name}
        className={`object-contain shrink-0 select-none ${borderClass} ${bgClass} ${paddingClass} ${sizeClasses[size]} ${className}`}
        draggable={false}
      />
    );
  }

  // Graceful fallback display (Beautiful retro background card with fallback icon/emoji)
  const fallbackBorderClass = noBorder ? "" : "border-2 border-[#5c402b]/40";
  const fallbackBgClass = noBg ? "" : "bg-gradient-to-br from-[#2c1d12] to-[#160f0a]";

  return (
    <div
      id={`hero-portrait-${hero.id}-fallback`}
      className={`flex items-center justify-center shrink-0 select-none text-2xl font-bold ${fallbackBorderClass} ${fallbackBgClass} ${sizeClasses[size]} ${className}`}
    >
      <span className="drop-shadow-md">{fallbackEmoji}</span>
    </div>
  );
}
