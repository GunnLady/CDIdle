import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI140_MAGE_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-140/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi140MagePortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /mage-(male|female)-(\d{2})-v1\.png$/,
  CDI140_MAGE_VARIANT_COUNT,
  "CDI-140 Mage",
);
