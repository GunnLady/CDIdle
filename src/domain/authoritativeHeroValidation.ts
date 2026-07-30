import { validateCanonicalHero } from "../../shared/contracts/authoritative.ts";
import { CLASS_INFO_LIST, getSkillById } from "../data/gameData.ts";
import type { ClassType, Hero } from "../types.ts";
import { calculateXpNeeded } from "../utils/gameCalculations.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function expectedXpNeeded(hero: Pick<Hero, "level" | "classType">): number {
  return calculateXpNeeded(hero.level + 1, hero.classType);
}

export function migrateAuthoritativeHeroProgression(input: unknown): unknown {
  if (!isRecord(input) || !Number.isInteger(input.level)) return input;
  const classInfo = CLASS_INFO_LIST.find((entry) => entry.type === input.classType);
  if (!classInfo) return input;
  const xpNeeded = calculateXpNeeded(Number(input.level) + 1, input.classType as ClassType);
  return input.xpNeeded === xpNeeded ? input : { ...input, xpNeeded };
}

export function validateAuthoritativeHero(
  input: unknown,
  path = "hero",
): string[] {
  const errors = validateCanonicalHero(input, path);
  if (errors.length > 0) return errors;
  const hero = input as Hero;
  const expected = expectedXpNeeded(hero);
  if (hero.xpNeeded !== expected) {
    errors.push(`${path}.xpNeeded must equal ${expected} for level ${hero.level} ${hero.classType}`);
  }
  if (hero.xp >= hero.xpNeeded) {
    errors.push(`${path}.xp must be lower than xpNeeded after canonical progression`);
  }
  return [...errors, ...validateAuthoritativeHeroSkills(hero, path)];
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
