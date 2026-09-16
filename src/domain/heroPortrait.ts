import type { Hero } from "../types";
import { CANONICAL_HERO_CLASSES, type CanonicalHeroClass } from "../../shared/domain/hero-classes";
import { HERO_PORTRAIT_VARIANT_COUNT } from "../../shared/domain/hero-portrait-identity";
import {
  getStableHeroPortraitVariant,
  normalizeHeroPortraitVariant,
} from "../../shared/domain/hero-portrait-identity";
import type { HeroPortraitGender } from "../assets/heroSpriteSheets";

export type HeroPortraitView = Pick<Hero, "id" | "name" | "classType" | "gender" | "spriteIndex">;
export type HeroPortraitPose = "neutral" | "combat_idle";

export const HERO_SPRITE_SLICES = [
  { x: 64, y: 38, width: 180, height: 280 },
  { x: 296, y: 38, width: 180, height: 280 },
  { x: 530, y: 38, width: 180, height: 280 },
  { x: 764, y: 38, width: 180, height: 280 },
  { x: 1007, y: 38, width: 180, height: 280 },
  { x: 64, y: 328, width: 180, height: 280 },
  { x: 296, y: 328, width: 180, height: 280 },
  { x: 530, y: 328, width: 180, height: 280 },
  { x: 764, y: 328, width: 180, height: 280 },
  { x: 1007, y: 328, width: 180, height: 280 },
  { x: 64, y: 621, width: 180, height: 280 },
  { x: 296, y: 621, width: 180, height: 280 },
  { x: 530, y: 621, width: 180, height: 280 },
  { x: 764, y: 621, width: 180, height: 280 },
  { x: 1007, y: 621, width: 180, height: 280 },
  { x: 64, y: 916, width: 180, height: 280 },
  { x: 296, y: 916, width: 180, height: 280 },
  { x: 530, y: 916, width: 180, height: 280 },
  { x: 764, y: 916, width: 180, height: 280 },
  { x: 1007, y: 916, width: 180, height: 280 },
] as const;

export function resolveHeroPortraitIdentity(
  hero: Pick<HeroPortraitView, "id" | "gender" | "spriteIndex">,
): { gender: HeroPortraitGender; variant: number } {
  return {
    gender: hero.gender === "Female" ? "Female" : "Male",
    variant: hero.spriteIndex === undefined
      ? getStableHeroPortraitVariant(hero.id)
      : normalizeHeroPortraitVariant(hero.spriteIndex),
  };
}

export function getHeroPortraitCacheKey(
  classType: HeroPortraitView["classType"],
  gender: HeroPortraitGender,
  variant: number,
): string {
  return `${classType}_${gender}_${variant}`;
}

export function getHeroPortraitPoseVisualKey(
  classType: HeroPortraitView["classType"],
  gender: HeroPortraitGender,
  variant: number,
  pose: HeroPortraitPose,
): string {
  const identityKey = getHeroPortraitCacheKey(classType, gender, variant);
  return pose === "neutral" ? identityKey : `${identityKey}@${pose}`;
}

export function parseHeroPortraitCacheKey(value: string): {
  classType: CanonicalHeroClass;
  gender: HeroPortraitGender;
  variant: number;
} | null {
  const match = /^(.+)_(Male|Female)_(\d+)$/.exec(value);
  if (!match) return null;
  const classType = match[1] as CanonicalHeroClass;
  const variant = Number(match[3]);
  if (!CANONICAL_HERO_CLASSES.includes(classType)
    || !Number.isInteger(variant)
    || variant < 0
    || variant >= HERO_PORTRAIT_VARIANT_COUNT) return null;
  return { classType, gender: match[2] as HeroPortraitGender, variant };
}

export function parseHeroPortraitPoseVisualKey(value: string): {
  classType: CanonicalHeroClass;
  gender: HeroPortraitGender;
  variant: number;
  pose: Exclude<HeroPortraitPose, "neutral">;
} | null {
  const match = /^(.+_(?:Male|Female)_\d+)@(combat_idle)$/.exec(value);
  if (!match) return null;
  const identity = parseHeroPortraitCacheKey(match[1]);
  if (!identity) return null;
  return { ...identity, pose: match[2] as Exclude<HeroPortraitPose, "neutral"> };
}
