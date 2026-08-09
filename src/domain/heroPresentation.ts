import { ACTIVE_HERO_LIMIT, canActivateHero, recruitmentEligibility } from "../../shared/domain/hero";
import { CANONICAL_HERO_STAT_PRESENTATION, type CanonicalHeroStat } from "../../shared/domain/hero-stats";
import { CLASS_INFO_LIST, RACE_INFO_LIST } from "../data/gameData";
import type { Hero, Resources } from "../types";
import type { HeroPortraitView } from "./heroPortrait";

export interface HeroRosterEntryView {
  id: string;
  name: string;
  level: number;
  race: string;
  className: string;
  isActive: boolean;
  statusLabel: string;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  healthPercent: number;
  canDeploy: boolean;
  deploymentBlockReason?: string;
}

export interface HeroesPageView {
  roster: HeroRosterEntryView[];
  party: Array<HeroRosterEntryView | null>;
  capacity: number;
  recruitCost: number;
  canRecruit: boolean;
  recruitmentBlockReason?: string;
}

export interface SelectedHeroView {
  id: string;
  name: string;
  level: number;
  portrait: HeroPortraitView;
  identityLabel: string;
  statusLabel: string;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  xp: number;
  xpNeeded: number;
  xpPercent: number;
  attributes: Array<{ key: CanonicalHeroStat; short: string; name: string; value: number; isPrimary: boolean }>;
  combatStats: Array<{ label: string; value: string | number }>;
  descriptions: Array<{ label: string; description: string }>;
  resistances: Array<{ name: string; value: number }>;
}

const statusLabel = (hero: Hero) => {
  if (hero.isActive || hero.status === "exploring") return "En expédition";
  if (hero.status === "resting") return "Au repos";
  return "Disponible";
};

const recruitmentReason = (error: "INSUFFICIENT_GOLD" | "GUILD_REQUIRED" | "CAPACITY_REACHED") => {
  if (error === "GUILD_REQUIRED") return "Campement requis";
  if (error === "CAPACITY_REACHED") return "Capacité du Campement atteinte";
  return "Or insuffisant";
};

export function createHeroesPageView(heroes: Hero[], resources: Resources, buildings: Record<string, number>): HeroesPageView {
  const recruitment = recruitmentEligibility(heroes.length, resources.gold, buildings.guilde ?? 0);
  const roster = createHeroRosterView(heroes);
  const active = roster.filter((hero) => hero.isActive).slice(0, ACTIVE_HERO_LIMIT);
  return {
    roster,
    party: Array.from({ length: ACTIVE_HERO_LIMIT }, (_, index) => active[index] ?? null),
    capacity: recruitment.capacity,
    recruitCost: recruitment.cost,
    canRecruit: recruitment.ok,
    recruitmentBlockReason: recruitment.ok === false ? recruitmentReason(recruitment.error) : undefined,
  };
}

export function createHeroRosterView(heroes: Hero[]): HeroRosterEntryView[] {
  const activeCount = heroes.filter((hero) => hero.isActive).length;
  return heroes.map((hero): HeroRosterEntryView => {
    const canDeploy = canActivateHero(hero, activeCount);
    const currentHp = Math.max(0, Math.floor(hero.currentHp));
    const maxHp = Math.max(1, hero.calculatedStats.maxHp);
    return {
      id: hero.id,
      name: hero.name,
      race: hero.race,
      className: hero.classType,
      level: hero.level,
      isActive: hero.isActive,
      statusLabel: statusLabel(hero),
      currentHp,
      maxHp,
      currentMana: Math.max(0, Math.floor(hero.currentMana)),
      maxMana: Math.max(0, hero.calculatedStats.maxMana),
      healthPercent: Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100))),
      canDeploy,
      deploymentBlockReason: hero.isActive
        ? undefined
        : hero.currentHp <= 0
          ? "Héros blessé"
          : activeCount >= ACTIVE_HERO_LIMIT
            ? "Groupe complet"
            : undefined,
    };
  });
}

const statKeys: readonly CanonicalHeroStat[] = ["str", "agi", "end", "int", "wiz", "dex", "luk"];

export function createSelectedHeroView(hero: Hero | null): SelectedHeroView | null {
  if (!hero) return null;
  const stats = hero.calculatedStats;
  const classInfo = CLASS_INFO_LIST.find((entry) => entry.type === hero.classType);
  const raceInfo = RACE_INFO_LIST.find((entry) => entry.name === hero.race);
  const baseStats = hero.baseStats ?? { str: 5, agi: 5, end: 5, int: 5, wiz: 5, dex: 5, luk: 5 };
  const xp = Math.max(0, Math.floor(hero.xp));
  const xpNeeded = Math.max(1, hero.xpNeeded);
  return {
    id: hero.id,
    name: hero.name,
    level: hero.level,
    portrait: {
      id: hero.id,
      name: hero.name,
      classType: hero.classType,
      gender: hero.gender,
      spriteIndex: hero.spriteIndex,
    },
    identityLabel: `${hero.race} · ${hero.classType} · Niveau ${hero.level}`,
    statusLabel: statusLabel(hero),
    currentHp: Math.max(0, Math.floor(hero.currentHp)),
    maxHp: Math.max(1, stats.maxHp),
    currentMana: Math.max(0, Math.floor(hero.currentMana)),
    maxMana: Math.max(0, stats.maxMana),
    xp,
    xpNeeded,
    xpPercent: Math.min(100, (xp / xpNeeded) * 100),
    attributes: statKeys.map((key) => ({
      key,
      short: CANONICAL_HERO_STAT_PRESENTATION[key].short,
      name: CANONICAL_HERO_STAT_PRESENTATION[key].name,
      value: baseStats[key] ?? 0,
      isPrimary: classInfo?.mainStats.includes(key) ?? false,
    })),
    combatStats: [
      { label: "Dégâts physiques", value: stats.physicalDamage },
      { label: "Dégâts magiques", value: stats.magicDamage },
      { label: "DPS estimé", value: stats.estimatedDps.toFixed(2) },
      { label: "Défense physique", value: stats.physicalDefense },
      { label: "Défense magique", value: stats.magicDefense },
      { label: "Critique", value: `${stats.criticalChance}%` },
      { label: "Esquive", value: `${stats.dodgeChance}%` },
      { label: "Vitesse", value: stats.speed },
    ],
    descriptions: [
      ...(raceInfo ? [{ label: raceInfo.name, description: raceInfo.description }] : []),
      ...(classInfo ? [{ label: classInfo.name, description: classInfo.description }] : []),
    ],
    resistances: Object.entries(stats.resistances ?? {})
      .filter(([, value]) => value !== stats.magicDefense)
      .map(([name, value]) => ({ name, value })),
  };
}

export function resolveSelectedHeroId(heroes: Hero[], selectedHeroId: string | null): string | null {
  if (selectedHeroId && heroes.some((hero) => hero.id === selectedHeroId)) return selectedHeroId;
  return heroes.find((hero) => hero.isActive)?.id ?? heroes[0]?.id ?? null;
}
