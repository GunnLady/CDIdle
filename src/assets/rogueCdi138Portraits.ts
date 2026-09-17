import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI138_ROGUE_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-138/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi138RoguePortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /rogue-(male|female)-(\d{2})-v1\.png$/,
  CDI138_ROGUE_VARIANT_COUNT,
  "CDI-138 Rogue",
);
