import type { Hero, Modifier, Monster, SkillInfo } from "../types.ts";
import { getSkillById } from "../data/gameData.ts";
import {
  applyMonsterDefenseOrResistance,
  applySplitDamageDefenseOrResistance,
  getHeroMainHandWeapon,
  getWeaponDamageTypes,
} from "../utils/gameCalculations.ts";
import {
  applyTemporaryCombatEffect,
  getEffectiveHeroStats,
  getEffectiveHealingMultiplier,
  getEffectiveMonster,
  getForcedTargetHeroIds,
  isHeroCombatModifierApplicable,
  isMonsterCombatModifierApplicable,
  type TemporaryCombatEffect,
} from "./combatEffects.ts";

export type TacticalAction = {
  kind: "normal_attack" | "skill";
  skillId?: string;
  targetHeroId?: string;
  priority: number;
  value: number;
  manaCost: number;
  efficiency: number;
  cooldownRounds: number;
  reason: string;
};

export type HeroActionContext = {
  hero: Hero;
  heroes: Hero[];
  monster: Monster;
  activeEffects?: TemporaryCombatEffect[];
  floor: number;
  room: number;
  finalRoom: number;
  round: number;
};

function requiredStat(hero: Hero, field: string, effects: TemporaryCombatEffect[] = []): number {
  const value = (getEffectiveHeroStats(hero, effects) as unknown as Record<string, unknown>)[field];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function estimateSkillDamage(
  hero: Hero,
  monster: Monster,
  skill: SkillInfo,
  effects: TemporaryCombatEffect[] = [],
): number {
  if (skill.effect.type !== "damage") return 0;
  const rawPerHit = Math.floor(requiredStat(hero, skill.effect.scalingStat, effects) * skill.effect.power);
  const normalPerHit = applyMonsterDefenseOrResistance(
    rawPerHit,
    skill.effect.damageType,
    getEffectiveMonster(monster, effects),
  );
  const criticalPerHit = applyMonsterDefenseOrResistance(
    Math.floor(rawPerHit * 1.5),
    skill.effect.damageType,
    getEffectiveMonster(monster, effects),
  );
  const criticalChance = Math.max(0, Math.min(100, getEffectiveHeroStats(hero, effects).criticalChance)) / 100;
  const expectedPerHit = normalPerHit * (1 - criticalChance) + criticalPerHit * criticalChance;
  return expectedPerHit * Math.max(1, skill.effect.hitCount ?? 1);
}

export function estimateNormalAttackDamage(
  hero: Hero,
  monster: Monster,
  effects: TemporaryCombatEffect[] = [],
): number {
  const stats = getEffectiveHeroStats(hero, effects);
  const weapon = getHeroMainHandWeapon(hero);
  const averageWeaponDamage = weapon?.damageRange
    ? (weapon.damageRange.min + weapon.damageRange.max) / 2
    : 1;
  const criticalMultiplier = 1 + Math.max(0, stats.criticalChance) / 100 * 0.5;
  const rawPerStrike = Math.max(1, Math.floor(
    (stats.physicalDamage + averageWeaponDamage) * criticalMultiplier,
  ));
  const damageTypes = weapon && getWeaponDamageTypes(weapon).length > 0
    ? getWeaponDamageTypes(weapon)
    : ["physical" as const];
  const damagePerStrike = applySplitDamageDefenseOrResistance(
    rawPerStrike,
    [...damageTypes],
    getEffectiveMonster(monster, effects),
  );
  const attackSpeed = weapon?.attackSpeed ?? 1;
  const expectedBonusStrikes = Math.min(2, Math.max(0, attackSpeed - 1 + stats.speed / 100));
  return Math.max(1, Math.floor(damagePerStrike * (1 + expectedBonusStrikes)));
}

export function estimateNextEnemyDamage(
  monster: Monster,
  hero: Hero,
  effects: TemporaryCombatEffect[] = [],
  strikeCount = 1,
): number {
  const effectiveMonster = getEffectiveMonster(monster, effects);
  const stats = getEffectiveHeroStats(hero, effects);
  const defense = effectiveMonster.damageType === "physical"
    ? stats.physicalDefense
    : stats.magicDefense;
  const hitChance = Math.max(0, 1 - stats.dodgeChance / 100);
  return Math.max(1, effectiveMonster.atk - defense) * Math.max(0, strikeCount) * hitChance;
}

function expectedEnemyStrikeCount(context: HeroActionContext): number {
  if (!context.monster.isBoss) return 1 + Math.min(0.5, Math.max(0, context.floor - 1) * 0.015);
  if (context.floor >= 30) return 3;
  if (context.floor >= 10) return 2.4;
  return 2;
}

function expectedEnemyDamageForTarget(
  context: HeroActionContext,
  target: Hero,
  effects: TemporaryCombatEffect[],
): number {
  const living = context.heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
  const forcedIds = new Set(getForcedTargetHeroIds(effects));
  const forcedLiving = living.filter((hero) => forcedIds.has(hero.id));
  const pool = forcedLiving.length > 0 ? forcedLiving : living;
  if (!pool.some((hero) => hero.id === target.id)) return 0;
  const expectedHits = expectedEnemyStrikeCount(context) / Math.max(1, pool.length);
  return estimateNextEnemyDamage(context.monster, target, effects, expectedHits);
}

export function deriveManaReserve(context: HeroActionContext): number {
  if (context.room >= context.finalRoom || context.hero.calculatedStats.maxMana <= 0) return 0;
  const skills = context.hero.activeSkills
    .map(getSkillById)
    .filter((skill): skill is SkillInfo => Boolean(skill && skill.type === "active"));
  const healingCosts = skills
    .filter((skill) => skill.effect.type === "heal")
    .map((skill) => skill.manaCost ?? 0);
  const supportCosts = skills
    .filter((skill) => skill.effect.type === "buff" || skill.effect.type === "debuff")
    .map((skill) => skill.manaCost ?? 0);
  const damageCosts = skills
    .filter((skill) => skill.effect.type === "damage")
    .map((skill) => skill.manaCost ?? 0);
  const baseReserve = healingCosts.length > 0
    ? Math.max(...healingCosts)
    : supportCosts.length > 0
      ? Math.max(...supportCosts)
      : damageCosts.length > 0
        ? Math.max(...damageCosts)
        : 0;
  const approach = Math.min(1, Math.max(
    0,
    (context.room - 1) / Math.max(1, context.finalRoom - 2),
  ));
  return Math.min(
    context.hero.calculatedStats.maxMana,
    Math.ceil(baseReserve * (0.5 + approach * 0.5)),
  );
}

function action(
  input: Omit<TacticalAction, "efficiency" | "cooldownRounds"> & { cooldownRounds?: number },
): TacticalAction {
  return {
    ...input,
    efficiency: input.manaCost > 0 ? input.value / input.manaCost : input.value,
    cooldownRounds: input.cooldownRounds ?? 0,
  };
}

function bestSingleHealTarget(
  context: HeroActionContext,
  healAmount: number,
  effects: TemporaryCombatEffect[],
) {
  const living = context.heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
  return living
    .map((target) => {
      const missing = Math.max(0, target.calculatedStats.maxHp - target.currentHp);
      const effectiveHealing = Math.min(missing, healAmount);
      const expectedDamage = expectedEnemyDamageForTarget(context, target, effects);
      const threatened = target.currentHp <= expectedDamage;
      const preventsDeath = threatened && target.currentHp + effectiveHealing > expectedDamage;
      const healthFraction = target.currentHp / Math.max(1, target.calculatedStats.maxHp);
      return { target, effectiveHealing, threatened, preventsDeath, healthFraction };
    })
    .sort((left, right) => {
      if (left.preventsDeath !== right.preventsDeath) return left.preventsDeath ? -1 : 1;
      if (left.healthFraction !== right.healthFraction) return left.healthFraction - right.healthFraction;
      if (left.effectiveHealing !== right.effectiveHealing) return right.effectiveHealing - left.effectiveHealing;
      return left.target.id.localeCompare(right.target.id);
    })[0];
}

function estimateBestHeroDamage(
  hero: Hero,
  monster: Monster,
  effects: TemporaryCombatEffect[],
): number {
  let best = estimateNormalAttackDamage(hero, monster, effects);
  for (const skillId of hero.activeSkills) {
    const skill = getSkillById(skillId);
    if (!skill || skill.type !== "active" || skill.effect.type !== "damage") continue;
    if (hero.currentMana < (skill.manaCost ?? 0) || Number(hero.cooldowns?.[skillId] ?? 0) > 0) continue;
    best = Math.max(best, estimateSkillDamage(hero, monster, skill, effects));
  }
  return best;
}

function estimatePartyDamage(context: HeroActionContext, effects: TemporaryCombatEffect[]): number {
  return context.heroes
    .filter((hero) => hero.isActive && hero.currentHp > 0)
    .reduce((total, hero) => total + estimateBestHeroDamage(hero, context.monster, effects), 0);
}

function temporaryEffect(
  context: HeroActionContext,
  skillId: string,
  targetId: string,
  targetSide: "hero" | "monster",
  durationRounds: number,
  modifiers: Modifier[],
): TemporaryCombatEffect {
  return {
    sourceSkillId: skillId,
    sourceHeroId: context.hero.id,
    targetId,
    targetSide,
    remainingRounds: durationRounds,
    modifiers,
  };
}

function scoreEffectChange(
  context: HeroActionContext,
  before: TemporaryCombatEffect[],
  after: TemporaryCombatEffect[],
  usefulRounds: number,
) {
  const living = context.heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
  const offenseGain = Math.max(0, estimatePartyDamage(context, after) - estimatePartyDamage(context, before));
  const beforeIncoming = living.reduce(
    (total, hero) => total + expectedEnemyDamageForTarget(context, hero, before),
    0,
  );
  const afterIncoming = living.reduce(
    (total, hero) => total + expectedEnemyDamageForTarget(context, hero, after),
    0,
  );
  const defenseGain = Math.max(0, beforeIncoming - afterIncoming);
  const preventsDeath = living.some((hero) => (
    hero.currentHp <= expectedEnemyDamageForTarget(context, hero, before)
    && hero.currentHp > expectedEnemyDamageForTarget(context, hero, after)
  ));
  return {
    value: (offenseGain + defenseGain) * usefulRounds,
    preventsDeath,
  };
}

function scoreTaunt(
  context: HeroActionContext,
  effects: TemporaryCombatEffect[],
  candidateEffects: TemporaryCombatEffect[],
  usefulRounds: number,
) {
  const caster = context.hero;
  const others = context.heroes.filter((hero) => (
    hero.id !== caster.id && hero.isActive && hero.currentHp > 0
  ));
  const threatenedAllies = others.filter((hero) => (
    hero.currentHp <= expectedEnemyDamageForTarget(context, hero, effects)
  ));
  const casterDamageAfter = expectedEnemyDamageForTarget(context, caster, candidateEffects);
  if (threatenedAllies.length === 0 || caster.currentHp <= casterDamageAfter) {
    return { value: 0, preventsDeath: false };
  }
  const protectedDamage = threatenedAllies.reduce(
    (total, hero) => total + expectedEnemyDamageForTarget(context, hero, effects),
    0,
  );
  const casterDamageBefore = expectedEnemyDamageForTarget(context, caster, effects);
  const transferredDanger = Math.max(0, casterDamageAfter - casterDamageBefore);
  return {
    value: Math.max(1, (protectedDamage - transferredDanger * 0.5) * usefulRounds),
    preventsDeath: true,
  };
}

function isEffectAlreadyActive(context: HeroActionContext, skillId: string, targetId: string): boolean {
  return (context.activeEffects ?? []).some((effect) =>
    effect.sourceSkillId === skillId && effect.targetId === targetId && effect.remainingRounds > 1
  );
}

export function listLegalHeroActions(context: HeroActionContext): TacticalAction[] {
  const effects = context.activeEffects ?? [];
  const normalDamage = estimateNormalAttackDamage(context.hero, context.monster, effects);
  const actions: TacticalAction[] = [action({
    kind: "normal_attack",
    priority: normalDamage >= context.monster.hp ? 4 : 1,
    value: Math.min(normalDamage, context.monster.hp),
    manaCost: 0,
    reason: normalDamage >= context.monster.hp ? "normal_attack_lethal" : "mana_preserved",
  })];
  const living = context.heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
  const reserve = deriveManaReserve(context);

  for (const skillId of [...context.hero.activeSkills].sort()) {
    const skill = getSkillById(skillId);
    if (!skill || skill.type !== "active") continue;
    const manaCost = skill.manaCost ?? 0;
    if (context.hero.currentMana < manaCost || Number(context.hero.cooldowns?.[skillId] ?? 0) > 0) continue;
    const manaAfter = context.hero.currentMana - manaCost;

    if (skill.effect.type === "damage") {
      const damage = estimateSkillDamage(context.hero, context.monster, skill, effects);
      const lethal = damage >= context.monster.hp;
      const uniquelyLethal = lethal && normalDamage < context.monster.hp;
      const usefulDamage = Math.min(damage, context.monster.hp);
      const gainOverNormal = usefulDamage - Math.min(normalDamage, context.monster.hp);
      const decisive = uniquelyLethal;
      if (!decisive && manaAfter < reserve) continue;
      const requiredGain = context.monster.isBoss ? 0 : Math.max(2, normalDamage * 0.1);
      if (!decisive && gainOverNormal <= requiredGain) continue;
      actions.push(action({
        kind: "skill",
        skillId,
        priority: uniquelyLethal ? 4 : context.monster.isBoss ? 2 : 1,
        value: usefulDamage + Math.max(0, gainOverNormal),
        manaCost,
        cooldownRounds: skill.cooldownRounds,
        reason: uniquelyLethal ? "skill_prevents_enemy_turn" : context.monster.isBoss ? "boss_damage" : "efficient_damage",
      }));
      continue;
    }

    if (skill.effect.type === "heal") {
      const healAmount = Math.max(0, Math.floor(
        requiredStat(context.hero, skill.effect.scalingStat, effects)
          * skill.effect.power
          * getEffectiveHealingMultiplier(context.hero, effects),
      ));
      if (skill.target === "all_allies") {
        const effectiveHealing = living.reduce((total, target) => total + Math.min(
          Math.max(0, target.calculatedStats.maxHp - target.currentHp),
          healAmount,
        ), 0);
        const savedCount = living.filter((target) => {
          const expectedDamage = expectedEnemyDamageForTarget(context, target, effects);
          const actualHealing = Math.min(
            Math.max(0, target.calculatedStats.maxHp - target.currentHp),
            healAmount,
          );
          return target.currentHp <= expectedDamage && target.currentHp + actualHealing > expectedDamage;
        }).length;
        if (effectiveHealing <= 0 || (savedCount === 0 && effectiveHealing < healAmount * 1.5)) continue;
        if (savedCount === 0 && manaAfter < reserve) continue;
        actions.push(action({
          kind: "skill",
          skillId,
          priority: savedCount > 0 ? 5 : 3,
          value: effectiveHealing + savedCount * healAmount,
          manaCost,
          cooldownRounds: skill.cooldownRounds,
          reason: savedCount > 0 ? "group_heal_prevents_death" : "group_stabilization",
        }));
        continue;
      }
      const candidate = bestSingleHealTarget(context, healAmount, effects);
      if (!candidate || candidate.effectiveHealing <= 0) continue;
      const missingFraction = 1 - candidate.target.currentHp / candidate.target.calculatedStats.maxHp;
      if (!candidate.preventsDeath && missingFraction < 0.3) continue;
      if (!candidate.preventsDeath && manaAfter < reserve) continue;
      actions.push(action({
        kind: "skill",
        skillId,
        targetHeroId: candidate.target.id,
        priority: candidate.preventsDeath ? 5 : 3,
        value: candidate.effectiveHealing + (candidate.preventsDeath ? healAmount : 0),
        manaCost,
        cooldownRounds: skill.cooldownRounds,
        reason: candidate.preventsDeath ? "heal_prevents_death" : "ally_stabilization",
      }));
      continue;
    }

    if (skill.effect.type === "buff" || skill.effect.type === "debuff") {
      const modifiers = skill.effect.modifiers.filter(
        skill.effect.type === "buff"
          ? isHeroCombatModifierApplicable
          : isMonsterCombatModifierApplicable,
      );
      if (modifiers.length === 0) continue;
      const duration = Math.max(1, skill.effect.durationRounds);
      const estimatedRounds = Math.max(1, Math.ceil(
        context.monster.hp / Math.max(1, estimatePartyDamage(context, effects)),
      ));
      const usefulRounds = Math.min(duration, estimatedRounds);
      if (estimatedRounds <= 1) continue;
      if (skill.effect.type === "debuff") {
        if (isEffectAlreadyActive(context, skillId, context.monster.id)) continue;
        const candidateEffects = applyTemporaryCombatEffect(effects, temporaryEffect(
          context, skillId, context.monster.id, "monster", duration, modifiers,
        ));
        const score = scoreEffectChange(context, effects, candidateEffects, usefulRounds);
        if (!score.preventsDeath && manaAfter < reserve) continue;
        if (!score.preventsDeath && score.value <= manaCost) continue;
        if (score.value <= 0) continue;
        actions.push(action({
          kind: "skill", skillId,
          priority: score.preventsDeath ? 5 : context.monster.isBoss ? 2 : 1,
          value: score.value, manaCost, cooldownRounds: skill.cooldownRounds,
          reason: "useful_combat_debuff",
        }));
        continue;
      }

      const candidates = skill.target === "all_allies"
        ? [undefined]
        : skill.target === "self"
          ? [context.hero]
          : living;
      for (const target of candidates) {
        const targetId = target?.id;
        if (targetId && isEffectAlreadyActive(context, skillId, targetId)) continue;
        if (!target && living.every((ally) => isEffectAlreadyActive(context, skillId, ally.id))) continue;
        const targets = target ? [target] : living;
        const candidateEffects = targets.reduce((nextEffects, candidate) => (
          applyTemporaryCombatEffect(nextEffects, temporaryEffect(
            context, skillId, candidate.id, "hero", duration, modifiers,
          ))
        ), effects);
        const forcedTarget = modifiers.some((modifier) => (
          modifier.stat === "forcedTarget" && modifier.value > 0
        ));
        const score = forcedTarget
          ? scoreTaunt(context, effects, candidateEffects, usefulRounds)
          : scoreEffectChange(context, effects, candidateEffects, usefulRounds);
        if (!score.preventsDeath && manaAfter < reserve) continue;
        if (!score.preventsDeath && score.value <= manaCost) continue;
        if (score.value <= 0) continue;
        actions.push(action({
          kind: "skill", skillId, targetHeroId: targetId,
          priority: score.preventsDeath ? 5 : context.monster.isBoss ? 2 : 1,
          value: score.value, manaCost,
          cooldownRounds: skill.cooldownRounds,
          reason: forcedTarget ? "taunt_protects_ally" : "useful_combat_buff",
        }));
      }
    }
  }

  return actions;
}

export function chooseHeroAction(context: HeroActionContext): TacticalAction {
  return listLegalHeroActions(context).sort((left, right) =>
    right.priority - left.priority
    || right.value - left.value
    || right.efficiency - left.efficiency
    || left.cooldownRounds - right.cooldownRounds
    || (left.skillId ?? "").localeCompare(right.skillId ?? "")
    || (left.targetHeroId ?? "").localeCompare(right.targetHeroId ?? "")
  )[0];
}
