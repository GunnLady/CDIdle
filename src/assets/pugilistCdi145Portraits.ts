import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export const CDI145_PUGILIST_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-145/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi145PugilistPortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /pugilist-(male|female)-(\d{2})-v1\.png$/,
  CDI145_PUGILIST_VARIANT_COUNT,
  "CDI-145 Pugilist",
);
