import type { HeroPortraitGender } from "./heroSpriteSheets";

export function createNormalizedHeroPortraitResolver(
  portraitUrls: Record<string, string>,
  filenamePattern: RegExp,
  variantCount: number,
  provenance: string,
): (gender: HeroPortraitGender, variant: number) => string {
  const portraitsByKey = new Map<string, string>();
  for (const [path, url] of Object.entries(portraitUrls)) {
    const match = filenamePattern.exec(path);
    if (match) portraitsByKey.set(`${match[1]}:${match[2]}`, url);
  }

  return (gender, variant) => {
    const normalizedVariant = ((variant % variantCount) + variantCount) % variantCount;
    const key = `${gender.toLowerCase()}:${String(normalizedVariant + 1).padStart(2, "0")}`;
    const url = portraitsByKey.get(key);
    if (!url) throw new Error(`Missing ${provenance} portrait: ${key}`);
    return url;
  };
}
