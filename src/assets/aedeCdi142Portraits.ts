import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI142_AEDE_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-142/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi142AedePortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /aede-(male|female)-(\d{2})-v1\.png$/,
  CDI142_AEDE_VARIANT_COUNT,
  "CDI-142 Aede",
);
