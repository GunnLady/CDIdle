import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI141_ACOLYTE_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-141/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi141AcolytePortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /acolyte-(male|female)-(\d{2})-v1\.png$/,
  CDI141_ACOLYTE_VARIANT_COUNT,
  "CDI-141 Acolyte",
);
