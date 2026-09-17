import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI139_ARCHER_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-139/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi139ArcherPortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /archer-(male|female)-(\d{2})-v1\.png$/,
  CDI139_ARCHER_VARIANT_COUNT,
  "CDI-139 Archer",
);
