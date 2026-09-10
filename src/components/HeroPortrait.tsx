import React, { useEffect, useState } from "react";
import { loadHeroPortraitAsset } from "../assets/heroPortraitAssets";
import {
  getHeroPortraitCacheKey,
  resolveHeroPortraitIdentity,
  type HeroPortraitView,
} from "../domain/heroPortrait";

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
  const [resolvedSprite, setResolvedSprite] = useState<{ key: string; url: string } | null>(null);
  const spriteUrl = resolvedSprite?.key === cacheKey ? resolvedSprite.url : undefined;

  useEffect(() => {
    let active = true;
    setResolvedSprite(null);
    loadHeroPortraitAsset({ classType: hero.classType, gender, variant })
      .then((asset) => {
        if (asset.fallback) console.warn(`Tier 1 portrait unavailable for ${hero.classType}; using matching Novice portrait.`);
        if (active) setResolvedSprite({ key: cacheKey, url: asset.url });
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
