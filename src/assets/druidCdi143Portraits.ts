import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI143_DRUID_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-143/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi143DruidPortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /druid-(male|female)-(\d{2})-v1\.png$/,
  CDI143_DRUID_VARIANT_COUNT,
  "CDI-143 Druid",
);
