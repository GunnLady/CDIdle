import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI137_WARRIOR_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-137/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi137WarriorPortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /warrior-(male|female)-(\d{2})-v1\.png$/,
  CDI137_WARRIOR_VARIANT_COUNT,
  "CDI-137 Warrior",
);
