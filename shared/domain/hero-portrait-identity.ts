export const HERO_PORTRAIT_VARIANT_COUNT = 20;

export function getStableHeroPortraitVariant(heroId: string): number {
  let hash = 0;
  for (let index = 0; index < heroId.length; index += 1) {
    hash = (hash * 31 + heroId.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % HERO_PORTRAIT_VARIANT_COUNT;
}

export function normalizeHeroPortraitVariant(spriteIndex: number): number {
  return spriteIndex % HERO_PORTRAIT_VARIANT_COUNT;
}
