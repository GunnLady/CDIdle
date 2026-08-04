import type { CalculatedStats, Hero, Modifier, Monster } from "../types.ts";
import { getSkillById } from "../data/gameData.ts";

export type CombatEffectTargetSide = "hero" | "monster";

export type TemporaryCombatEffect = {
  sourceSkillId: string;
  sourceHeroId: string;
  targetId: string;
  targetSide: CombatEffectTargetSide;
  remainingRounds: number;
  modifiers: Modifier[];
};

const HERO_STAT_KEYS = new Set<keyof CalculatedStats>([
  "maxHp",
  "criticalChance",
  "dodgeChance",
  "hp",
  "maxMana",
  "mana",
  "physicalDamage",
  "magicDamage",
  "speed",
  "physicalDefense",
  "magicDefense",
]);

const MONSTER_STAT_KEYS = new Set([
  "physicalDamage",
  "magicDamage",
  "physicalDefense",
  "magicDefense",
]);

export function isHeroCombatModifierApplicable(modifier: Modifier): boolean {
  return modifier.stat === "forcedTarget"
    || HERO_STAT_KEYS.has(modifier.stat as keyof CalculatedStats);
}

export function isMonsterCombatModifierApplicable(modifier: Modifier): boolean {
  return MONSTER_STAT_KEYS.has(modifier.stat);
}

function applyModifiers(base: number, modifiers: Modifier[]): number {
  const flat = modifiers
    .filter((modifier) => modifier.type === "flat")
    .reduce((sum, modifier) => sum + modifier.value, 0);
  const percent = modifiers
    .filter((modifier) => modifier.type === "percent")
    .reduce((sum, modifier) => sum + modifier.value, 0);
  return base * (1 + percent / 100) + flat;
}

export function getEffectiveHealingMultiplier(
  hero: Hero,
  effects: TemporaryCombatEffect[],
): number {
  const passiveModifiers = hero.passiveSkills.flatMap((skillId) => {
    const skill = getSkillById(skillId);
    return skill?.type === "passive" && skill.effect.type === "stat_modifier"
      ? skill.effect.modifiers.filter((modifier) => modifier.stat === "healingPower")
      : [];
  });
  const temporaryModifiers = effectsFor(effects, "hero", hero.id)
    .flatMap((effect) => effect.modifiers)
    .filter((modifier) => modifier.stat === "healingPower");
  return Math.max(0, applyModifiers(100, [...passiveModifiers, ...temporaryModifiers]) / 100);
}

function effectsFor(
  effects: TemporaryCombatEffect[],
  targetSide: CombatEffectTargetSide,
  targetId: string,
): TemporaryCombatEffect[] {
  return effects.filter((effect) =>
    effect.targetSide === targetSide && effect.targetId === targetId && effect.remainingRounds > 0
  );
}

export function getEffectiveHeroStats(hero: Hero, effects: TemporaryCombatEffect[]): CalculatedStats {
  const stats = structuredClone(hero.calculatedStats);
  const modifiers = effectsFor(effects, "hero", hero.id)
    .flatMap((effect) => effect.modifiers)
    .filter(isHeroCombatModifierApplicable);
  for (const key of HERO_STAT_KEYS) {
    const matching = modifiers.filter((modifier) => modifier.stat === key);
    const value = stats[key];
    if (matching.length === 0 || typeof value !== "number") continue;
    (stats as unknown as Record<string, unknown>)[key] = applyModifiers(value, matching);
  }
  stats.criticalChance = Math.max(0, stats.criticalChance);
  stats.dodgeChance = Math.max(0, stats.dodgeChance);
  stats.physicalDefense = Math.max(0, stats.physicalDefense);
  stats.magicDefense = Math.max(0, stats.magicDefense);
  stats.speed = Math.max(0, stats.speed);
  return stats;
}

export function getEffectiveMonster(monster: Monster, effects: TemporaryCombatEffect[]): Monster {
  const effective = { ...monster };
  const modifiers = effectsFor(effects, "monster", monster.id)
    .flatMap((effect) => effect.modifiers)
    .filter(isMonsterCombatModifierApplicable);
  const attackStat = monster.damageType === "physical" ? "physicalDamage" : "magicDamage";
  effective.atk = applyModifiers(effective.atk, modifiers.filter((modifier) => modifier.stat === attackStat));
  effective.def = applyModifiers(effective.def, modifiers.filter((modifier) => modifier.stat === "physicalDefense"));
  effective.magicDef = applyModifiers(
    effective.magicDef,
    modifiers.filter((modifier) => modifier.stat === "magicDefense"),
  );
  effective.atk = Math.max(1, Math.floor(effective.atk));
  effective.def = Math.max(0, Math.floor(effective.def));
  effective.magicDef = Math.max(0, Math.floor(effective.magicDef));
  return effective;
}

export function getForcedTargetHeroIds(effects: TemporaryCombatEffect[]): string[] {
  return [...new Set(effects
    .filter((effect) => effect.targetSide === "hero" && effect.remainingRounds > 0)
    .filter((effect) => effect.modifiers.some((modifier) => (
      modifier.stat === "forcedTarget" && modifier.value > 0
    )))
    .map((effect) => effect.targetId))]
    .sort((left, right) => left.localeCompare(right));
}

export function applyTemporaryCombatEffect(
  effects: TemporaryCombatEffect[],
  effect: TemporaryCombatEffect,
): TemporaryCombatEffect[] {
  return [
    ...effects.filter((existing) => !(
      existing.sourceSkillId === effect.sourceSkillId
      && existing.targetSide === effect.targetSide
      && existing.targetId === effect.targetId
    )),
    effect,
  ];
}

export function advanceTemporaryCombatEffects(effects: TemporaryCombatEffect[]): TemporaryCombatEffect[] {
  return effects
    .map((effect) => ({ ...effect, remainingRounds: effect.remainingRounds - 1 }))
    .filter((effect) => effect.remainingRounds > 0);
}
