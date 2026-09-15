export const HERO_PORTRAIT_VARIANT_COUNT = 20;
export const NOVICE_PORTRAIT_VARIANT_COUNT = 10;

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

export function getStableNovicePortraitVariant(heroId: string): number {
  let hash = 0x811c9dc5;
  const seed = `cdi-136:${heroId}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % NOVICE_PORTRAIT_VARIANT_COUNT;
}
