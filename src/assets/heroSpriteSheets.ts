import type { CanonicalHeroClass } from "../../shared/domain/hero-classes";
import acolyteFemale from "./images/hero-sprites/tier1/human-tier1-acolyte-female-v1.png";
import acolyteMale from "./images/hero-sprites/tier1/human-tier1-acolyte-male-v1.png";
import aedeFemale from "./images/hero-sprites/tier1/human-tier1-aede-female-v1.png";
import aedeMale from "./images/hero-sprites/tier1/human-tier1-aede-male-v1.png";
import archerFemale from "./images/hero-sprites/tier1/human-tier1-archer-female-v1.png";
import archerMale from "./images/hero-sprites/tier1/human-tier1-archer-male-v1.png";
import artificerFemale from "./images/hero-sprites/tier1/human-tier1-artificer-female-v1.png";
import artificerMale from "./images/hero-sprites/tier1/human-tier1-artificer-male-v1.png";
import druidFemale from "./images/hero-sprites/tier1/human-tier1-druid-female-v1.png";
import druidMale from "./images/hero-sprites/tier1/human-tier1-druid-male-v1.png";
import mageFemale from "./images/hero-sprites/tier1/human-tier1-mage-female-v1.png";
import mageMale from "./images/hero-sprites/tier1/human-tier1-mage-male-v1.png";
import pugilistFemale from "./images/hero-sprites/tier1/human-tier1-pugilist-female-v1.png";
import pugilistMale from "./images/hero-sprites/tier1/human-tier1-pugilist-male-v1.png";
import rogueFemale from "./images/hero-sprites/tier1/human-tier1-rogue-female-v1.png";
import rogueMale from "./images/hero-sprites/tier1/human-tier1-rogue-male-v1.png";
import warriorFemale from "./images/hero-sprites/tier1/human-tier1-warrior-female-v1.png";
import warriorMale from "./images/hero-sprites/tier1/human-tier1-warrior-male-v1.png";

export type HeroPortraitGender = "Male" | "Female";
export type HeroSpriteSheetPair = Record<HeroPortraitGender, string>;
export type HeroSpriteSheetClass = Exclude<CanonicalHeroClass, "Novice">;

export const HERO_SPRITE_SHEETS = {
  Guerrier: { Male: warriorMale, Female: warriorFemale },
  Voleur: { Male: rogueMale, Female: rogueFemale },
  Archer: { Male: archerMale, Female: archerFemale },
  Mage: { Male: mageMale, Female: mageFemale },
  Acolyte: { Male: acolyteMale, Female: acolyteFemale },
  "A\u00e8de": { Male: aedeMale, Female: aedeFemale },
  Druide: { Male: druidMale, Female: druidFemale },
  Artificier: { Male: artificerMale, Female: artificerFemale },
  Pugiliste: { Male: pugilistMale, Female: pugilistFemale },
} satisfies Record<HeroSpriteSheetClass, HeroSpriteSheetPair>;
