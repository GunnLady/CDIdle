import type { HeroPortraitGender } from "./heroSpriteSheets";

export const CDI137_WARRIOR_VARIANT_COUNT = 10;

const portraitUrls = import.meta.glob<string>(
  "../../assets/design/hero-sprites/cdi-137/normalized-alpha-v1/{male,female}/*.png",
  { eager: true, import: "default" },
);

const portraitsByKey = new Map<string, string>();
for (const [path, url] of Object.entries(portraitUrls)) {
  const match = /warrior-(male|female)-(\d{2})-v1\.png$/.exec(path);
  if (match) portraitsByKey.set(`${match[1]}:${match[2]}`, url);
}

export function getCdi137WarriorPortraitUrl(gender: HeroPortraitGender, variant: number): string {
  const normalizedVariant = ((variant % CDI137_WARRIOR_VARIANT_COUNT) + CDI137_WARRIOR_VARIANT_COUNT)
    % CDI137_WARRIOR_VARIANT_COUNT;
  const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
  const url = portraitsByKey.get(key);
  if (!url) throw new Error(`Missing CDI-137 Warrior portrait: ${key}`);
  return url;
}
