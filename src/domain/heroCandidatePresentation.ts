import type { Hero } from "../types";
import type { HeroPortraitView } from "./heroPortrait";
import {
  CANONICAL_HERO_STAT_PRESENTATION,
  isCanonicalHeroStat,
  type CanonicalHeroStat,
} from "../../shared/domain/hero-stats";

export interface HeroCandidateSummaryView {
  id: string;
  name: string;
  race: string;
  genderLabel: string;
  genderSymbol: string;
  genderTone: "blue" | "pink";
  isElite: boolean;
  portrait: HeroPortraitView;
  bestStat: { label: string; value: number };
  weakestStat: { label: string; value: number };
  maxHp: number;
  maxMana: number;
}

function rankedStats(hero: Hero): Array<[CanonicalHeroStat, number]> {
  return Object.entries(hero.baseStats ?? {})
    .filter((entry): entry is [CanonicalHeroStat, number] => (
      isCanonicalHeroStat(entry[0]) && typeof entry[1] === "number"
    ));
}

export function createHeroCandidateSummary(hero: Hero, editedName = hero.name): HeroCandidateSummaryView {
  const stats = rankedStats(hero);
  const fallback: [CanonicalHeroStat, number] = ["str", 0];
  const best = stats.reduce((current, candidate) => candidate[1] > current[1] ? candidate : current, stats[0] ?? fallback);
  const weakest = stats.reduce((current, candidate) => candidate[1] < current[1] ? candidate : current, stats[0] ?? fallback);
  const gender = hero.gender ?? "Male";
  const male = gender === "Male";
  return {
    id: hero.id,
    name: editedName,
    race: hero.race,
    genderLabel: male ? "Homme" : "Femme",
    genderSymbol: male ? "♂" : "♀",
    genderTone: male ? "blue" : "pink",
    isElite: Boolean(hero.isElite),
    portrait: {
      id: hero.id,
      name: editedName,
      classType: hero.classType,
      gender,
      spriteIndex: hero.spriteIndex,
    },
    bestStat: { label: CANONICAL_HERO_STAT_PRESENTATION[best[0]].short, value: best[1] },
    weakestStat: { label: CANONICAL_HERO_STAT_PRESENTATION[weakest[0]].short, value: weakest[1] },
    maxHp: hero.calculatedStats.maxHp,
    maxMana: hero.calculatedStats.maxMana,
  };
}
