import type { CanonicalHeroProgressionModelId } from "../contracts/authoritative.ts";

export type GlobalXpProgressionCurve = {
  kind: "global";
  growthFactor: number;
  tierMultipliers: Readonly<Record<number, number>>;
};

export type TierXpProgressionBand = {
  firstDestinationLevel: number;
  firstLevelXp: number;
  growthFactor: number;
};

export type TieredXpProgressionCurve = {
  kind: "tiered";
  tierBands: Readonly<Record<number, TierXpProgressionBand>>;
};

export type XpProgressionCurve = GlobalXpProgressionCurve | TieredXpProgressionCurve;
export type HeroProgressionModelId = CanonicalHeroProgressionModelId;

export type HeroProgressionModel = {
  id: HeroProgressionModelId;
  maxLevel: number;
  xpCurve: XpProgressionCurve;
};

export const HERO_MAX_LEVEL = 99;

export const LEGACY_HERO_PROGRESSION_MODEL: HeroProgressionModel = {
  id: "legacy-global-v1",
  maxLevel: HERO_MAX_LEVEL,
  xpCurve: {
    kind: "global",
    growthFactor: 1.5,
    tierMultipliers: { 0: 1, 1: 1.25, 2: 1.6, 3: 2 },
  },
};

export const HARMONIZED_T0_T1_HERO_PROGRESSION_MODEL: HeroProgressionModel = {
  id: "harmonized-t0-t1-v1",
  maxLevel: HERO_MAX_LEVEL,
  xpCurve: {
    kind: "tiered",
    tierBands: {
      0: { firstDestinationLevel: 2, firstLevelXp: 100, growthFactor: 1.3 },
      1: { firstDestinationLevel: 11, firstLevelXp: 1_061, growthFactor: 1.2 },
    },
  },
};

export const HERO_PROGRESSION_MODELS: Readonly<Record<HeroProgressionModelId, HeroProgressionModel>> = {
  "legacy-global-v1": LEGACY_HERO_PROGRESSION_MODEL,
  "harmonized-t0-t1-v1": HARMONIZED_T0_T1_HERO_PROGRESSION_MODEL,
};

export const CURRENT_HERO_PROGRESSION_MODEL = HARMONIZED_T0_T1_HERO_PROGRESSION_MODEL;
export const CURRENT_HERO_PROGRESSION_MODEL_ID = CURRENT_HERO_PROGRESSION_MODEL.id;

export function getHeroProgressionModel(id: HeroProgressionModelId): HeroProgressionModel {
  return HERO_PROGRESSION_MODELS[id];
}
