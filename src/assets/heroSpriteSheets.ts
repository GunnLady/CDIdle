import type { CanonicalHeroClass } from "../../shared/domain/hero-classes";
import pugilistFemale from "./images/hero-sprites/tier1/human-tier1-pugilist-female-v1.png";
import pugilistMale from "./images/hero-sprites/tier1/human-tier1-pugilist-male-v1.png";

export type HeroPortraitGender = "Male" | "Female";
export type HeroSpriteSheetPair = Record<HeroPortraitGender, string>;
export type HeroSpriteSheetClass = Exclude<CanonicalHeroClass, "Novice" | "Guerrier" | "Voleur" | "Archer" | "Mage" | "Acolyte" | "A\u00e8de" | "Druide" | "Artificier">;

export const HERO_SPRITE_SHEETS = {
  Pugiliste: { Male: pugilistMale, Female: pugilistFemale },
} satisfies Record<HeroSpriteSheetClass, HeroSpriteSheetPair>;
