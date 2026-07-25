import { validateCanonicalHero } from "../../shared/contracts/authoritative.ts";
import { getSkillById } from "../data/gameData.ts";
import type { Hero } from "../types.ts";

export function validateAuthoritativeHero(
  input: unknown,
  path = "hero",
): string[] {
  const errors = validateCanonicalHero(input, path);
  if (errors.length > 0) return errors;
  return validateAuthoritativeHeroSkills(input as Hero, path);
}

export function validateAuthoritativeHeroSkills(
  hero: Hero,
  path = "hero",
): string[] {
  const errors: string[] = [];
  for (const skillId of hero.activeSkills) {
    const skill = getSkillById(skillId);
    if (!skill) errors.push(`${path}.activeSkills contains unknown skill ${skillId}`);
    else if (skill.type !== "active") {
      errors.push(`${path}.activeSkills contains non-active skill ${skillId}`);
    }
  }
  for (const skillId of hero.passiveSkills) {
    const skill = getSkillById(skillId);
    if (!skill) errors.push(`${path}.passiveSkills contains unknown skill ${skillId}`);
    else if (skill.type !== "passive") {
      errors.push(`${path}.passiveSkills contains non-passive skill ${skillId}`);
    }
  }
  return errors;
}

export function validateAuthoritativeHeroes(input: unknown, path = "heroes"): string[] {
  if (!Array.isArray(input)) return [`${path} must be an array`];
  return input.flatMap((hero, index) => validateAuthoritativeHero(hero, `${path}[${index}]`));
}

export function validateAuthoritativeHeroesSkills(
  heroes: Hero[],
  path = "heroes",
): string[] {
  return heroes.flatMap((hero, index) =>
    validateAuthoritativeHeroSkills(hero, `${path}[${index}]`)
  );
}
