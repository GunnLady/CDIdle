import { getSkillById } from "../data/skills";
import type { Hero, Modifier, SkillEffect, SkillTarget } from "../types";

export interface HeroSkillView {
  id: string;
  name: string;
  description: string;
  resourceLabel: string;
  targetLabel?: string;
  effectSummary: string;
}

export interface HeroSkillsView {
  heroName: string;
  active: HeroSkillView[];
  passive: HeroSkillView[];
}

const statLabel = (name: string) => ({
  physicalDamage: "dégâts physiques",
  magicDamage: "dégâts magiques",
  physicalDefense: "défense physique",
  magicDefense: "défense magique",
  maxHp: "PV max",
  maxMana: "PM max",
  speed: "vitesse",
  dodgeChance: "esquive",
  criticalChance: "critique",
  forcedTarget: "cible forcée",
  goldGain: "gain d'or",
  healingPower: "soins",
} as Record<string, string>)[name] ?? name;

const targetLabel = (target?: SkillTarget) => ({
  single_enemy: "Ennemi unique",
  all_enemies: "Tous les ennemis",
  self: "Soi-même",
  single_ally: "Allié unique",
  all_allies: "Tous les alliés",
} as Partial<Record<SkillTarget, string>>)[target ?? "self"];

const modifiersSummary = (modifiers: Modifier[]) => modifiers
  .map((modifier) => `${modifier.value >= 0 ? "+" : ""}${modifier.value}${modifier.type === "percent" ? "%" : ""} ${statLabel(modifier.stat)}`)
  .join(", ");

export function formatSkillEffect(effect: SkillEffect): string {
  if (effect.type === "damage") {
    return `Inflige ${Math.round(effect.power * 100)}% de ${statLabel(effect.scalingStat)}${effect.hitCount > 1 ? ` ×${effect.hitCount}` : ""}`;
  }
  if (effect.type === "heal") return `Soigne à hauteur de ${Math.round(effect.power * 100)}% de ${statLabel(effect.scalingStat)}`;
  const summary = modifiersSummary(effect.modifiers);
  if (effect.type === "buff" || effect.type === "debuff") return `${summary} pendant ${effect.durationRounds} tours`;
  return summary;
}

export function createHeroSkillsView(hero: Hero | null): HeroSkillsView | null {
  if (!hero) return null;
  const project = (skillId: string): HeroSkillView | null => {
    const skill = getSkillById(skillId);
    if (!skill) return null;
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      resourceLabel: skill.type === "passive"
        ? "Passif"
        : `${skill.manaCost ?? 0} PM${skill.cooldownRounds ? ` · ${skill.cooldownRounds} t.` : ""}`,
      targetLabel: skill.target ? targetLabel(skill.target) : undefined,
      effectSummary: formatSkillEffect(skill.effect),
    };
  };
  return {
    heroName: hero.name,
    active: (hero.activeSkills ?? []).map(project).filter((skill): skill is HeroSkillView => skill !== null),
    passive: (hero.passiveSkills ?? []).map(project).filter((skill): skill is HeroSkillView => skill !== null),
  };
}
