import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI138_ROGUE_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-138/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

const portraitsByKey = new Map<string, string>();
for (const [path, url] of Object.entries(portraitUrls)) {
  const match = /rogue-(male|female)-(\d{2})-v1\.png$/.exec(path);
  if (match) portraitsByKey.set(`${match[1]}:${match[2]}`, url);
}

export function getCdi138RoguePortraitUrl(gender: HeroPortraitGender, variant: number): string {
  const normalizedVariant = ((variant % CDI138_ROGUE_VARIANT_COUNT) + CDI138_ROGUE_VARIANT_COUNT)
    % CDI138_ROGUE_VARIANT_COUNT;
  const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
  const url = portraitsByKey.get(key);
  if (!url) throw new Error(`Missing CDI-138 Rogue portrait: ${key}`);
  return url;
}
