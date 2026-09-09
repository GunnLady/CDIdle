import type { Hero } from "../types";
import {
  getStableHeroPortraitVariant,
  normalizeHeroPortraitVariant,
} from "../../shared/domain/hero-portrait-identity";
import type { HeroPortraitGender } from "../assets/heroSpriteSheets";

export type HeroPortraitView = Pick<Hero, "id" | "name" | "classType" | "gender" | "spriteIndex">;

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
