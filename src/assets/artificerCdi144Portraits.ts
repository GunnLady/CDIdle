import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI144_ARTIFICER_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-144/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi144ArtificerPortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /artificer-(male|female)-(\d{2})-v1\.png$/,
  CDI144_ARTIFICER_VARIANT_COUNT,
  "CDI-144 Artificer",
);
