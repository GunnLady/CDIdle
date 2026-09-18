import type { CanonicalHeroClass } from "../../shared/domain/hero-classes";

export type HeroPortraitGender = "Male" | "Female";
export type HeroSpriteSheetPair = Record<HeroPortraitGender, string>;
export type HeroSpriteSheetClass = Exclude<CanonicalHeroClass, "Novice" | "Guerrier" | "Voleur" | "Archer" | "Mage" | "Acolyte" | "A\u00e8de" | "Druide" | "Artificier" | "Pugiliste">;

export const HERO_SPRITE_SHEETS = {} satisfies Record<HeroSpriteSheetClass, HeroSpriteSheetPair>;
