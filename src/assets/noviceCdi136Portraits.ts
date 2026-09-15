import type { HeroPortraitGender } from "./heroSpriteSheets";
import { NOVICE_PORTRAIT_VARIANT_COUNT } from "../../shared/domain/hero-portrait-identity";

export { NOVICE_PORTRAIT_VARIANT_COUNT as CDI136_NOVICE_VARIANT_COUNT };

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-136/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

const portraitsByKey = new Map<string, string>();
for (const [path, url] of Object.entries(portraitUrls)) {
  const match = /novice-(male|female)-(\d{2})-v1\.png$/.exec(path);
  if (match) portraitsByKey.set(`${match[1]}:${match[2]}`, url);
}

export function getCdi136NovicePortraitUrl(gender: HeroPortraitGender, variant: number): string {
  const normalizedVariant = ((variant % NOVICE_PORTRAIT_VARIANT_COUNT) + NOVICE_PORTRAIT_VARIANT_COUNT)
    % NOVICE_PORTRAIT_VARIANT_COUNT;
  const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
  const url = portraitsByKey.get(key);
  if (!url) throw new Error(`Missing CDI-136 Novice portrait: ${key}`);
  return url;
}
