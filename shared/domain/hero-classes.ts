export const CANONICAL_HERO_CLASS_TIERS = {
  Novice: 0,
  Guerrier: 1,
  Voleur: 1,
  Archer: 1,
  Mage: 1,
  Acolyte: 1,
  "Aède": 1,
  Druide: 1,
  Artificier: 1,
  Pugiliste: 1,
} as const;

export type CanonicalHeroClass = keyof typeof CANONICAL_HERO_CLASS_TIERS;

export const CANONICAL_HERO_CLASSES = Object.keys(
  CANONICAL_HERO_CLASS_TIERS,
) as CanonicalHeroClass[];
