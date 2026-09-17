import { NOVICE_PORTRAIT_VARIANT_COUNT } from "../../shared/domain/hero-portrait-identity";
import { createNormalizedHeroPortraitResolver } from "./normalizedHeroPortraits";

export { NOVICE_PORTRAIT_VARIANT_COUNT as CDI136_NOVICE_VARIANT_COUNT };

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-136/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

export const getCdi136NovicePortraitUrl = createNormalizedHeroPortraitResolver(
  portraitUrls,
  /novice-(male|female)-(\d{2})-v1\.png$/,
  NOVICE_PORTRAIT_VARIANT_COUNT,
  "CDI-136 Novice",
);
