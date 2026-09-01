import type { ClassType, Hero } from "../contracts/game.ts";
import { CLASS_INFO_LIST } from "../data/game-data.ts";
import {
  CURRENT_HERO_PROGRESSION_MODEL,
  type HeroProgressionModel,
  type XpProgressionCurve,
} from "../data/hero-progression-models.ts";

export function calculateXpNeeded(
  nextLevel: number,
  classType: ClassType,
  curve: XpProgressionCurve = CURRENT_HERO_PROGRESSION_MODEL.xpCurve,
): number {
  if (nextLevel < 2) return 100;
  const tier = CLASS_INFO_LIST.find((entry) => entry.type === classType)?.tier ?? 0;

  if (curve.kind === "tiered") {
    const band = curve.tierBands[tier];
    if (!band) throw new Error(`XP_TIER_BAND_NOT_CONFIGURED:${tier}`);
    const destinationLevel = Math.max(2, Math.floor(nextLevel));
    if (destinationLevel < band.firstDestinationLevel) {
      const noviceBand = curve.tierBands[0];
      if (!noviceBand) throw new Error("XP_TIER_BAND_NOT_CONFIGURED:0");
      return Math.ceil(
        noviceBand.firstLevelXp
          * Math.pow(noviceBand.growthFactor, destinationLevel - noviceBand.firstDestinationLevel),
      );
    }
    return Math.ceil(
      band.firstLevelXp * Math.pow(band.growthFactor, destinationLevel - band.firstDestinationLevel),
    );
  }

  const tierMultiplier = curve.tierMultipliers[tier] ?? 1;
  return Math.ceil(100 * Math.pow(curve.growthFactor, nextLevel - 2) * tierMultiplier);
}

export function heroXpNeeded(
  hero: Pick<Hero, "level" | "classType">,
  curve: XpProgressionCurve = CURRENT_HERO_PROGRESSION_MODEL.xpCurve,
): number {
  return calculateXpNeeded(hero.level + 1, hero.classType, curve);
}

export function refreshHeroProgressionThreshold(
  hero: Hero,
  curve: XpProgressionCurve = CURRENT_HERO_PROGRESSION_MODEL.xpCurve,
): Hero {
  return { ...hero, xpNeeded: heroXpNeeded(hero, curve) };
}

export function migrateHeroXpProgress(
  hero: Hero,
  targetModel: HeroProgressionModel = CURRENT_HERO_PROGRESSION_MODEL,
): Hero {
  const previousThreshold = Math.max(1, Number(hero.xpNeeded));
  const progress = Math.max(0, Math.min(1, Number(hero.xp) / previousThreshold));
  const xpNeeded = heroXpNeeded(hero, targetModel.xpCurve);
  const xp = hero.level >= targetModel.maxLevel
    ? 0
    : Math.min(xpNeeded - 1, Math.floor(progress * xpNeeded));
  return { ...hero, xp, xpNeeded };
}
