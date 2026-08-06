import type {
  CalculatedStats,
  DamageType,
  DungeonEncounterType,
  Hero,
  Monster,
  PendingClassTransition,
  Rarity,
  Resources,
  StoredForgeMaterialStack,
  StoredItemInstance,
} from "../contracts/game.ts";
import type { CanonicalDungeonLoot, CanonicalGameState } from "../contracts/authoritative.ts";
import { BOSSES_LIBRARY, ITEM_LIBRARY, MONSTERS_LIBRARY, getSkillById } from "../data/game-data.ts";
import { BOSS_LOOT_TABLES_REGISTRY } from "./items/boss-loot-tables.ts";
import {
  getChestLootBand,
  resolveEligibleCatalogDrop,
  rollWeightedRarity,
} from "./items/items.ts";
import {
  addItemToStorage,
  applyMonsterDefenseOrResistance,
  applySplitDamageDefenseOrResistance,
  getHeroDefenseAgainstDamageType,
  getHeroMainHandWeapon,
  getWeaponDamageTypes,
  rollWeaponDamage,
} from "./game-calculations.ts";
import {
  applyLootModifiers,
  getRandomDungeonEncounterType,
  rollEncounterForgeMaterial,
} from "./dungeon-helpers.ts";
import {
  DUNGEON_CHALLENGE_DEFINITIONS,
  getDungeonChallengeDifficulty,
  rollDungeonChallenge,
  selectBestDungeonChallengeCandidate,
  type DungeonChallengeKind,
} from "./dungeon-challenges.ts";
import { CANONICAL_HERO_STAT_PRESENTATION } from "./hero-stats.ts";
import type { Rng } from "./random.ts";
import {
  applyHeroProgression,
  type HeroProgressionResult,
} from "./hero-progression.ts";
import { describeTier1EquipmentReward } from "./tier1-class-equipment-reward.ts";
import { validateAuthoritativeHero } from "./authoritative-hero-validation.ts";
import {
  getFirstClearRewards,
  getDungeonGoldReward,
  getDungeonRoomCount,
  getMajorBossIndex,
  getPartyXpShare,
  getRegularEnemyBudget,
  isDungeonFinalRoom,
  isMajorBossFloor,
} from "./dungeon-progression.ts";
import {
  resolveMonsterAttackProfile,
  resolveMonsterCombatRank,
  rollMonsterStrikeCount,
} from "./monster-combat.ts";
import { chooseHeroAction } from "./combat-tactics.ts";
import {
  UNARMED_WEAPON_CONTEXT,
  calculateWeaponStrikePower,
  rollWeaponStrikeCount,
  selectWeaponAttackPower,
} from "./weapon-combat.ts";
import {
  advanceTemporaryCombatEffects,
  applyTemporaryCombatEffect,
  getEffectiveHeroStats,
  getEffectiveHealingMultiplier,
  getEffectiveMonster,
  getForcedTargetHeroIds,
  type TemporaryCombatEffect,
} from "./combat-effects.ts";

export type AuthoritativeDungeonTranscriptEvent = {
  sequence: number;
  type: string;
  message?: string;
  category?: "info" | "victory" | "defeat" | "loot" | "combat-hero" | "combat-enemy";
  round?: number;
  heroId?: string;
  heroName?: string;
  monsterId?: string;
  monsterName?: string;
  damage?: number;
  healing?: number;
  enemyHp?: number;
  enemyMaxHp?: number;
  heroHp?: number;
  heroMaxHp?: number;
  [key: string]: unknown;
};

export type AuthoritativeDungeonEncounter = {
  encounterId: string;
  kind: DungeonEncounterType;
  floor: number;
  room: number;
  outcome: "victory" | "defeat";
  roundCount: number;
  enemy: { id?: string; name?: string; hp: number; maxHp: number; isBoss?: boolean } | null;
  transcript: AuthoritativeDungeonTranscriptEvent[];
  rewards: { gold: number; loot: CanonicalDungeonLoot[] };
};

export type AuthoritativeDungeonState = CanonicalGameState;

export type AuthoritativeDungeonResolution = {
  state: AuthoritativeDungeonState;
  encounter: AuthoritativeDungeonEncounter;
};

const clone = <T>(value: T): T => structuredClone(value);

function requiredCalculatedStat(stats: CalculatedStats, field: string): number {
  const value = (stats as unknown as Record<string, unknown>)[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`INVALID_DUNGEON_SKILL_STAT:${field}`);
  }
  return value;
}

function awardExperience(
  hero: Hero,
  xp: number,
  rng: Rng,
  buildings: Record<string, number>,
  storedItems: StoredItemInstance[],
): HeroProgressionResult {
  return applyHeroProgression({ hero, xpEarned: xp, rng, buildings, storedItems });
}

function logExperienceAward(
  log: (
    type: string,
    message: string,
    category: AuthoritativeDungeonTranscriptEvent["category"],
    data?: Record<string, unknown>,
  ) => void,
  original: Hero,
  xp: number,
  award: HeroProgressionResult,
  context?: { source: "floor_first_clear"; floor: number },
) {
  const isFloorClearBonus = context?.source === "floor_first_clear";
  log(
    isFloorClearBonus ? "reward.floor_first_clear_xp" : "reward.xp",
    isFloorClearBonus
      ? `Prime de première sécurisation : ${original.name} gagne +${xp} XP.`
      : `${original.name} gagne +${xp} XP.`,
    "info",
    {
    heroId: original.id,
    heroName: original.name,
    xp,
    ...(context ?? {}),
    },
  );
  if (award.levels.length > 0) {
    const statGains = (Object.keys(CANONICAL_HERO_STAT_PRESENTATION) as (keyof Hero["baseStats"])[])
      .map((stat) => ({ stat, amount: award.hero.baseStats[stat] - original.baseStats[stat] }))
      .filter(({ amount }) => amount > 0);
    const statSummary = statGains
      .map(({ stat, amount }) => `${CANONICAL_HERO_STAT_PRESENTATION[stat].short} +${amount}`)
      .join(", ");
    const levelSummary = award.levels.length === 1
      ? `passe niveau ${award.hero.level}`
      : `gagne ${award.levels.length} niveaux (${original.level} → ${award.hero.level})`;
    log(
      "hero.level_up",
      `${original.name} ${levelSummary} ! `
        + `PV ${original.currentHp}/${original.calculatedStats.maxHp} → `
        + `${award.hero.currentHp}/${award.hero.calculatedStats.maxHp} ; `
        + `Mana ${original.currentMana}/${original.calculatedStats.maxMana} → `
        + `${award.hero.currentMana}/${award.hero.calculatedStats.maxMana} ; `
        + `caractéristiques : ${statSummary}.`,
      "victory",
      {
        heroId: original.id,
        heroName: original.name,
        level: award.hero.level,
        levels: award.levels,
        levelBefore: original.level,
        levelAfter: award.hero.level,
        hpBefore: original.currentHp,
        hpMaxBefore: original.calculatedStats.maxHp,
        hpAfter: award.hero.currentHp,
        hpMaxAfter: award.hero.calculatedStats.maxHp,
        manaBefore: original.currentMana,
        manaMaxBefore: original.calculatedStats.maxMana,
        manaAfter: award.hero.currentMana,
        manaMaxAfter: award.hero.calculatedStats.maxMana,
        statGains: Object.fromEntries(statGains.map(({ stat, amount }) => [stat, amount])),
      },
    );
  }
  if (award.classChange) {
    const equipmentReward = award.classChange.equipmentReward;
    const equipmentNames = equipmentReward
      ? describeTier1EquipmentReward(equipmentReward)
      : null;
    log(
      "hero.class_changed",
      `${original.name} révèle sa vocation et devient ${award.classChange.toClass}.`
        + (equipmentNames
          ? ` Équipement reçu : ${equipmentNames.weaponName} et ${equipmentNames.accessoryName}.`
          : ""),
      "victory",
      {
        heroId: original.id,
        heroName: original.name,
        previousClass: award.classChange.fromClass,
        classType: award.classChange.toClass,
        previousTier: award.classChange.fromTier,
        classTier: award.classChange.toTier,
        reason: award.classChange.reason,
        activeSkills: award.hero.activeSkills,
        passiveSkills: award.hero.passiveSkills,
        equipmentReward,
      },
    );
  } else if (award.pendingTransition) {
    log(
      "hero.vocation_prayer",
      `${original.name} adresse une prière aux dieux pour révéler sa vocation.`,
      "victory",
      {
        heroId: original.id,
        heroName: original.name,
        fromClass: award.pendingTransition.fromClass,
        fromTier: award.pendingTransition.fromTier,
        toTier: award.pendingTransition.toTier,
        candidates: award.pendingTransition.candidates,
      },
    );
  } else if (award.classStayed) {
    log(
      "hero.class_unchanged",
      `${original.name} reste ${award.classStayed.classType} : ${award.classStayed.reason}`,
      "info",
      {
        heroId: original.id,
        heroName: original.name,
        classType: award.classStayed.classType,
        reason: award.classStayed.reason,
      },
    );
  }
}

function appendPendingTransition(
  pending: PendingClassTransition[],
  award: HeroProgressionResult,
): void {
  if (!award.pendingTransition) return;
  const index = pending.findIndex((entry) => entry.heroId === award.pendingTransition?.heroId);
  if (index >= 0) pending[index] = award.pendingTransition;
  else pending.push(award.pendingTransition);
}

function appendMaterial(
  materials: StoredForgeMaterialStack[],
  reward: { materialId: string; rarity: Rarity; count: number },
): StoredForgeMaterialStack[] {
  const next = clone(materials);
  const existing = next.find((entry) =>
    entry.materialId === reward.materialId && entry.rarity === reward.rarity
  );
  if (existing) existing.count += reward.count;
  else next.push({ materialId: reward.materialId, rarity: reward.rarity, count: reward.count });
  return next;
}

function summarizeHeroChanges(before: Hero[], after: Hero[]) {
  return after.flatMap((hero) => {
    const previous = before.find((candidate) => candidate.id === hero.id);
    if (!previous) return [];
    const change = {
      heroId: hero.id,
      heroName: hero.name,
      hpBefore: previous.currentHp,
      hpAfter: hero.currentHp,
      manaBefore: previous.currentMana,
      manaAfter: hero.currentMana,
      levelBefore: previous.level,
      levelAfter: hero.level,
      classBefore: previous.classType,
      classAfter: hero.classType,
    };
    return (
      change.hpBefore !== change.hpAfter
      || change.manaBefore !== change.manaAfter
      || change.levelBefore !== change.levelAfter
      || change.classBefore !== change.classAfter
    ) ? [change] : [];
  });
}

function nextProgress(floor: number, room: number, highestFloorReached: number) {
  if (!isDungeonFinalRoom(floor, room)) {
    return {
      activeDungeonFloor: floor,
      activeDungeonRoom: room + 1,
      highestFloorReached,
    };
  }
  return {
    activeDungeonFloor: floor + 1,
    activeDungeonRoom: 1,
    highestFloorReached: Math.max(highestFloorReached, floor + 1),
  };
}

function scaleMonster(floor: number, room: number, rng: Rng): Monster {
  const bossRoom = isDungeonFinalRoom(floor, room);
  const majorBossIndex = bossRoom ? getMajorBossIndex(floor) : null;
  const majorBoss = majorBossIndex !== null;
  let selected: Omit<Monster, "id" | "hp" | "maxHp">;
  const pool = floor <= 5
    ? MONSTERS_LIBRARY.slice(0, 4)
    : floor <= 15
    ? MONSTERS_LIBRARY.slice(2, 8)
    : floor <= 29
    ? MONSTERS_LIBRARY.slice(6, 12)
    : MONSTERS_LIBRARY.slice(10);
  if (majorBoss) {
    selected = BOSSES_LIBRARY[majorBossIndex];
  } else {
    selected = pool[rng.nextInt(pool.length)];
  }

  const budget = getRegularEnemyBudget(floor);
  const average = (field: "atk" | "xpYield" | "goldYield") =>
    pool.reduce((sum, monster) => sum + monster[field], 0) / pool.length;
  const archetypeFactor = (field: "atk" | "xpYield" | "goldYield") =>
    Math.max(0.75, Math.min(1.3, selected[field] / average(field)));
  const miniBossFactor = bossRoom && !majorBoss ? 1.2 : 1;
  const attack = majorBoss
    ? selected.atk
    : Math.max(1, Math.floor(budget.attack * archetypeFactor("atk") * miniBossFactor));
  const maxHp = majorBoss
    ? selected.atk * 24
    : Math.max(1, Math.floor(attack * 16 * (bossRoom ? 2 : 1)));
  const defenseRatio = selected.def / Math.max(1, selected.atk);
  const magicDefenseRatio = selected.magicDef / Math.max(1, selected.atk);
  const xpYield = majorBoss
    ? selected.xpYield
    : Math.max(1, Math.round(budget.xp * archetypeFactor("xpYield") * (bossRoom ? 2.5 : 1)));
  const goldYield = majorBoss
    ? selected.goldYield
    : Math.max(1, Math.round(budget.gold * archetypeFactor("goldYield") * (bossRoom ? 2.5 : 1)));

  // The characterized 640f89f behavior consumed a gameplay RNG draw for this visual ID.
  const id = rng.next().toString();
  return {
    ...selected,
    ...(bossRoom && !majorBoss ? { name: `${selected.name} d'élite`, isBoss: true } : {}),
    id,
    hp: maxHp,
    maxHp,
    atk: attack,
    def: majorBoss ? selected.def : Math.max(0, Math.floor(attack * defenseRatio)),
    magicDef: majorBoss ? selected.magicDef : Math.max(0, Math.floor(attack * magicDefenseRatio)),
    resistances: selected.resistances,
    xpYield,
    goldYield,
  };
}

function resolveFight(
  source: AuthoritativeDungeonState,
  floor: number,
  room: number,
  encounterId: string,
  rng: Rng,
): AuthoritativeDungeonResolution {
  let heroes = clone(source.heroes ?? []);
  let monster = scaleMonster(floor, room, rng);
  const resources: Resources = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    ore: 0,
    ...(source.resources ?? {}),
  };
  let forgeMaterials = clone(source.forgeMaterials ?? []);
  let storedItems = clone(source.storedItems ?? []);
  let itemBlueprints = clone(source.itemBlueprints ?? []);
  const pendingClassTransitions = clone(source.pendingClassTransitions ?? []);
  const transcript: AuthoritativeDungeonTranscriptEvent[] = [];
  const loot: CanonicalDungeonLoot[] = [];
  let sequence = 0;
  let round = 0;
  let activeEffects: TemporaryCombatEffect[] = [];
  const majorBossEncounter = isDungeonFinalRoom(floor, room) && isMajorBossFloor(floor);
  const monsterRank = resolveMonsterCombatRank(monster.isBoss, majorBossEncounter);
  const monsterAttackProfile = resolveMonsterAttackProfile(monsterRank, floor);
  const log = (
    type: string,
    message: string,
    category: AuthoritativeDungeonTranscriptEvent["category"],
    data: Record<string, unknown> = {},
  ) => transcript.push({ sequence: sequence++, type, message, category, ...data });

  log(
    "encounter.started",
    `Vos heros entrent dans la chambre ${room} et font face a ${monster.name}.`,
    "info",
    {
      monsterId: monster.id,
      monsterName: monster.name,
      enemyHp: monster.hp,
      enemyMaxHp: monster.maxHp,
      isBoss: monster.isBoss,
    },
  );

  while (monster.hp > 0 && heroes.some((hero) => hero.isActive && hero.currentHp > 0)) {
    round += 1;
    if (round > 100) throw new Error("COMBAT_LIMIT_REACHED");

    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const cooldowns = Object.fromEntries(Object.entries(hero.cooldowns ?? {})
        .map(([id, turns]) => [id, turns - 1] as const)
        .filter(([, turns]) => turns > 0));
      return { ...hero, cooldowns };
    });

    for (let heroIndex = 0; heroIndex < heroes.length && monster.hp > 0; heroIndex += 1) {
      const hero = heroes[heroIndex];
      if (!hero.isActive || hero.currentHp <= 0) continue;
      const calculatedStats = getEffectiveHeroStats(hero, activeEffects);
      let skillUsed = false;
      let totalDamage = 0;
      const chosenAction = chooseHeroAction({
        hero,
        heroes,
        monster,
        activeEffects,
        floor,
        room,
        finalRoom: getDungeonRoomCount(floor),
        round,
      });
      if (chosenAction.kind === "skill" && chosenAction.skillId) {
        const skillId = chosenAction.skillId;
        const skill = getSkillById(skillId);
        if (!skill || skill.type !== "active") throw new Error(`INVALID_DUNGEON_SKILL:${skillId}`);
        const effect = skill.effect;
        skillUsed = true;
        hero.currentMana = Math.max(0, hero.currentMana - (skill.manaCost ?? 0));
        if (skill.cooldownRounds) {
          hero.cooldowns = { ...(hero.cooldowns ?? {}), [skillId]: skill.cooldownRounds };
        }

        if (effect.type === "damage") {
          const hitCount = effect.hitCount ?? 1;
          const rawDamagePerHit = Math.floor(
            requiredCalculatedStat(calculatedStats, effect.scalingStat) * effect.power,
          );
          const hitResults = Array.from({ length: hitCount }, (_, hitIndex) => {
            const critical = rng.next() < calculatedStats.criticalChance / 100;
            const rawDamage = critical ? Math.floor(rawDamagePerHit * 1.5) : rawDamagePerHit;
            const damage = applyMonsterDefenseOrResistance(
              rawDamage,
              effect.damageType,
              getEffectiveMonster(monster, activeEffects),
            );
            return { hit: hitIndex + 1, damage, critical };
          });
          const damage = hitResults.reduce((sum, hit) => sum + hit.damage, 0);
          const criticalHitCount = hitResults.filter((hit) => hit.critical).length;
          const impactSummary = hitResults
            .map((hit) => `${hit.damage}${hit.critical ? " [critique]" : ""}`)
            .join(", ");
          totalDamage = damage;
          log(
            "hero.skill.damage",
            hitCount > 1
              ? `${hero.name} declenche ${skill.name} et frappe ${hitCount} fois : ${impactSummary} degats ${effect.damageType} (${damage} au total).`
              : `${criticalHitCount > 0 ? "[Coup critique] " : ""}${hero.name} declenche ${skill.name} et inflige ${damage} degats ${effect.damageType}.`,
            "combat-hero",
            {
              round, heroId: hero.id, heroName: hero.name, monsterId: monster.id,
              monsterName: monster.name, skillId, skillName: skill.name, hitCount,
              hitResults, criticalHitCount, damage, damageType: effect.damageType,
              enemyHp: Math.max(0, monster.hp - damage), enemyMaxHp: monster.maxHp,
              decisionReason: chosenAction.reason,
            },
          );
        } else if (effect.type === "heal") {
          const healAmount = Math.floor(
            requiredCalculatedStat(calculatedStats, effect.scalingStat)
              * effect.power
              * getEffectiveHealingMultiplier(hero, activeEffects),
          );
          const targets = skill.target === "all_allies"
            ? heroes.filter((candidate) => candidate.isActive && candidate.currentHp > 0)
            : heroes.filter((candidate) => candidate.id === chosenAction.targetHeroId);
          for (const target of targets) {
            const targetIndex = heroes.findIndex((candidate) => candidate.id === target.id);
            const actual = Math.min(target.calculatedStats.maxHp - target.currentHp, healAmount);
            heroes[targetIndex] = {
              ...target,
              currentHp: Math.min(target.calculatedStats.maxHp, target.currentHp + healAmount),
            };
            if (actual <= 0) continue;
            log(
              "hero.skill.heal",
              `${hero.name} utilise ${skill.name} sur ${target.name} et soigne ${actual} PV.`,
              "combat-hero",
              {
                round, heroId: hero.id, heroName: hero.name, targetHeroId: target.id,
                targetHeroName: target.name, skillId, skillName: skill.name, healing: actual,
                heroHp: heroes[targetIndex].currentHp, heroMaxHp: target.calculatedStats.maxHp,
                decisionReason: chosenAction.reason,
              },
            );
          }
        } else if (effect.type === "buff" || effect.type === "debuff") {
          const targets = effect.type === "debuff"
            ? [{ id: monster.id, side: "monster" as const }]
            : skill.target === "all_allies"
              ? heroes.filter((candidate) => candidate.isActive && candidate.currentHp > 0)
                .map((candidate) => ({ id: candidate.id, side: "hero" as const }))
              : [{ id: chosenAction.targetHeroId ?? hero.id, side: "hero" as const }];
          for (const target of targets) {
            activeEffects = applyTemporaryCombatEffect(activeEffects, {
              sourceSkillId: skillId,
              sourceHeroId: hero.id,
              targetId: target.id,
              targetSide: target.side,
              remainingRounds: effect.durationRounds,
              modifiers: effect.modifiers,
            });
          }
          log(
            `hero.skill.${effect.type}`,
            `${hero.name} utilise ${skill.name} (${effect.type}).`,
            "combat-hero",
            {
              round, heroId: hero.id, heroName: hero.name, monsterId: monster.id,
              monsterName: monster.name, skillId, skillName: skill.name,
              durationRounds: effect.durationRounds, modifiers: effect.modifiers,
              ...(effect.type === "buff" ? { targetHeroIds: targets.map((target) => target.id) } : {}),
              decisionReason: chosenAction.reason,
            },
          );
        }
      }

      if (!skillUsed) {
        const weapon = getHeroMainHandWeapon(hero);
        const attackSpeed = weapon?.attackSpeed ?? 1;
        const attackProfile = weapon?.attackProfile ?? UNARMED_WEAPON_CONTEXT.attackProfile;
        const strikes = rollWeaponStrikeCount(
          attackSpeed,
          calculatedStats.speed,
          attackProfile,
          () => rng.next(),
        );

        for (let strike = 1; strike <= strikes; strike += 1) {
          const weaponDamage = rollWeaponDamage(weapon, rng);
          const scaling = weapon?.scaling ?? UNARMED_WEAPON_CONTEXT.scaling;
          const attackPower = selectWeaponAttackPower(calculatedStats, scaling);
          const rawDamage = calculateWeaponStrikePower(attackPower, attackProfile) + weaponDamage;
          const critical = rng.next() < calculatedStats.criticalChance / 100;
          const criticalDamage = critical ? Math.floor(rawDamage * 1.5) : rawDamage;
          const damageTypes = weapon && getWeaponDamageTypes(weapon).length > 0
            ? getWeaponDamageTypes(weapon)
            : ["physical" as DamageType];
          const damage = applySplitDamageDefenseOrResistance(
            criticalDamage,
            damageTypes,
            getEffectiveMonster(monster, activeEffects),
          );
          totalDamage += damage;
          const nextHp = Math.max(0, monster.hp - totalDamage);
          const hitLabels = [
            strike > attackProfile.baseStrikes
              ? "[Frappe bonus]"
              : attackProfile.baseStrikes > 1 && strike > 1
                ? "[Seconde arme]"
                : null,
            critical ? "[Coup critique]" : null,
          ].filter((label): label is string => label !== null);
          const hitPrefix = hitLabels.length > 0 ? `${hitLabels.join(" ")} ` : "";
          log(
            critical ? "hero.hit.critical" : "hero.hit",
            `${hitPrefix}${hero.name} inflige ${damage} dégâts à ${monster.name}.`,
            "combat-hero",
            {
              round,
              heroId: hero.id,
              heroName: hero.name,
              monsterId: monster.id,
              monsterName: monster.name,
              strike,
              strikeCount: strikes,
              weaponDamage,
              rawDamage,
              damageTypes,
              critical,
              damage,
              enemyHp: nextHp,
              enemyMaxHp: monster.maxHp,
              decisionReason: chosenAction.reason,
            },
          );
        }
      }

      monster = { ...monster, hp: Math.max(0, monster.hp - totalDamage) };
      heroes[heroIndex] = {
        ...heroes[heroIndex],
        currentMana: hero.currentMana,
        cooldowns: hero.cooldowns,
      };
      if (monster.hp === 0) {
        log(
          "encounter.victory",
          `Victoire : ${monster.name} est terrasse.`,
          "victory",
          { round, monsterId: monster.id, monsterName: monster.name },
        );
      }
    }

    if (monster.hp === 0) break;

    const strikes = rollMonsterStrikeCount(monsterAttackProfile, () => rng.next());

    for (let strike = 1; strike <= strikes; strike += 1) {
      const living = heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
      if (living.length === 0) break;
      const strikePrefix = strike > 1 ? "[Frappe bonus] " : "";
      const forcedTargetIds = new Set(getForcedTargetHeroIds(activeEffects));
      const forcedTargets = living.filter((candidate) => forcedTargetIds.has(candidate.id));
      const targetPool = forcedTargets.length > 0 ? forcedTargets : living;
      const target = targetPool[Math.min(
        targetPool.length - 1,
        Math.floor(rng.next() * targetPool.length),
      )];
      const targetIndex = heroes.findIndex((hero) => hero.id === target.id);
      const targetStats = getEffectiveHeroStats(target, activeEffects);
      const effectiveMonster = getEffectiveMonster(monster, activeEffects);
      const defense = getHeroDefenseAgainstDamageType(
        target.calculatedStats,
        targetStats,
        effectiveMonster.damageType,
      );
      const damage = Math.max(1, effectiveMonster.atk - defense);
      const dodged = rng.next() < targetStats.dodgeChance / 100;
      if (dodged) {
        log(
          "enemy.dodged",
          `${strikePrefix}${target.name} esquive l'attaque de ${monster.name}.`,
          "combat-enemy",
          {
            round,
            heroId: target.id,
            heroName: target.name,
            monsterId: monster.id,
            monsterName: monster.name,
            strike,
            strikeCount: strikes,
            dodgeChance: targetStats.dodgeChance,
          },
        );
        continue;
      }

      const hp = Math.max(0, target.currentHp - damage);
      heroes[targetIndex] = hp === 0
        ? { ...target, currentHp: 0, isActive: false, status: "resting" }
        : { ...target, currentHp: hp };
      log(
        hp === 0 ? "hero.defeated" : "enemy.hit",
        hp === 0
          ? `${strikePrefix}${monster.name} inflige ${damage} dégâts à ${target.name} `
            + `(${target.currentHp} → 0/${targetStats.maxHp} PV). `
            + `${target.name} s'écroule et retourne aux dortoirs.`
          : `${strikePrefix}${monster.name} inflige ${damage} dégâts à ${target.name}.`,
        hp === 0 ? "defeat" : "combat-enemy",
        {
          round,
          heroId: target.id,
          heroName: target.name,
          monsterId: monster.id,
          monsterName: monster.name,
          strike,
          strikeCount: strikes,
          damage,
          damageType: monster.damageType,
          defense,
          heroHpBefore: target.currentHp,
          heroHp: hp,
          heroMaxHp: targetStats.maxHp,
        },
      );
    }
    activeEffects = advanceTemporaryCombatEffects(activeEffects);
  }

  const victory = monster.hp === 0;
  const finalRoom = isDungeonFinalRoom(floor, room);
  const firstClear = finalRoom && floor === Number(source.highestFloorReached ?? floor);
  const majorBoss = finalRoom && isMajorBossFloor(floor);
  if (!victory) {
    log(
      "encounter.defeat",
      "Tous les aventuriers ont ete decimes. L'escouade se replie.",
      "defeat",
      { round },
    );
  }

  if (victory) {
    const goblinBonus = heroes.some((hero) => hero.race === "Gobelin") ? 1.25 : 1;
    const leaderBonus = 1 + Number(source.buildings?.maison_chef ?? 0) * 0.03;
    const bossTable = majorBoss ? BOSS_LOOT_TABLES_REGISTRY[monster.name] : undefined;
    if (majorBoss && !bossTable) throw new Error(`BOSS_LOOT_TABLE_NOT_FOUND:${monster.name}`);
    const bossGold = bossTable?.goldRange
      ? bossTable.goldRange[0] + rng.nextInt(bossTable.goldRange[1] - bossTable.goldRange[0] + 1)
      : monster.goldYield;
    const baseGold = Math.floor(bossGold * goblinBonus * leaderBonus);
    const gold = applyLootModifiers("goldGain", baseGold, heroes);
    resources.gold = Number(resources.gold ?? 0) + gold;
    log("reward.gold", `+${gold} or.`, "loot", { gold });
    if (firstClear) {
      const reward = getFirstClearRewards(floor);
      resources.gold = Number(resources.gold ?? 0) + reward.gold;
      log(
        "reward.floor_first_clear",
        `Prime de première sécurisation : +${reward.gold} or.`,
        "loot",
        { gold: reward.gold, floor },
      );
    }

    if (bossTable) {
      for (const reward of bossTable.materials) {
        if (rng.next() >= reward.chance) continue;
        const count = reward.minCount + rng.nextInt(reward.maxCount - reward.minCount + 1);
        const material = {
          materialId: reward.materialId,
          rarity: reward.rarity,
          count,
          name: reward.displayName,
        };
        forgeMaterials = appendMaterial(forgeMaterials, material);
        loot.push({ type: "material", ...material });
        log("reward.material", `Materiau : +${count} ${reward.displayName} (${reward.rarity}).`, "loot", material);
      }
      for (const reward of bossTable.items) {
        if (rng.next() >= reward.chance) continue;
        const drop = resolveEligibleCatalogDrop({
          rarity: reward.rarity,
          levelMin: reward.levelMin ?? 1,
          levelMax: reward.levelMax ?? Number.MAX_SAFE_INTEGER,
          provenance: "boss",
        });
        if (!drop) continue;
        const item = drop.candidates[rng.nextInt(drop.candidates.length)];
        const instanceId = `item:dungeon:${encounterId}:loot:${loot.length}`;
        addItemToStorage(storedItems, { instanceId, itemId: item.id, rarity: drop.rarity });
        loot.push({ type: "item", instanceId, itemId: item.id, rarity: drop.rarity, count: 1 });
        log("reward.item", `${item.name} [${drop.rarity}] obtenu.`, "loot", {
          instanceId, itemId: item.id, itemName: item.name, rarity: drop.rarity, count: 1,
        });
      }
      for (const reward of bossTable.blueprints) {
        if (rng.next() >= reward.chance) continue;
        const unlocked = new Set(itemBlueprints.filter((entry) => entry.unlocked).map((entry) => entry.itemId));
        const candidates = ITEM_LIBRARY.filter((item) => (
          item.blueprintAvailable
          && item.provenances.includes("forge")
          && item.requiredLevel >= (reward.levelMin ?? 1)
          && item.requiredLevel <= (reward.levelMax ?? Number.MAX_SAFE_INTEGER)
          && !unlocked.has(item.id)
        ));
        if (candidates.length === 0) continue;
        const item = candidates[rng.nextInt(candidates.length)];
        itemBlueprints = [...itemBlueprints.filter((entry) => entry.itemId !== item.id), { itemId: item.id, unlocked: true }];
        loot.push({ type: "blueprint", itemId: item.id, count: 1 });
        log("reward.blueprint", `Plan de forge obtenu : ${item.name}.`, "loot", { itemId: item.id, itemName: item.name });
      }
    } else if (rng.next() < 0.35) {
      const material = rollEncounterForgeMaterial(floor, rng);
      forgeMaterials = appendMaterial(forgeMaterials, material);
      loot.push({ type: "material", ...material });
      log(
        "reward.material",
        `Materiau : +${material.count} ${material.name} (${material.rarity}).`,
        "loot",
        material,
      );
    } else {
      log("reward.material.none", "Aucun materiau exploitable.", "info");
    }

    const eligibleCount = heroes.filter((hero) => hero.isActive && hero.currentHp > 0).length;
    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const share = monster.xpYield * getPartyXpShare(eligibleCount);
      const xp = Math.round(share * (hero.race === "Humain" ? 1.15 : 1));
      const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems);
      storedItems = award.storedItems;
      appendPendingTransition(pendingClassTransitions, award);
      logExperienceAward(log, hero, xp, award);
      return award.hero;
    });
    if (firstClear) {
      const reward = getFirstClearRewards(floor);
      const bonusEligibleCount = heroes.filter((hero) => hero.isActive && hero.currentHp > 0).length;
      heroes = heroes.map((hero) => {
        if (!hero.isActive || hero.currentHp <= 0) return hero;
        const share = reward.xpPool * getPartyXpShare(bonusEligibleCount);
        const xp = Math.round(share * (hero.race === "Humain" ? 1.15 : 1));
        const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems);
        storedItems = award.storedItems;
        appendPendingTransition(pendingClassTransitions, award);
        logExperienceAward(log, hero, xp, award, { source: "floor_first_clear", floor });
        return award.hero;
      });
    }
    if (firstClear) {
      log(
        "dungeon.floor_completed",
        `Étage ${floor} sécurisé : l'étage ${floor + 1} est désormais accessible.`,
        "victory",
        { completedFloor: floor, unlockedFloor: floor + 1 },
      );
    }
  }

  const progress = victory
    ? nextProgress(floor, room, Number(source.highestFloorReached ?? floor))
    : {
        activeDungeonFloor: floor,
        activeDungeonRoom: room,
        highestFloorReached: Number(source.highestFloorReached ?? floor),
      };
  const goldReward = victory
    ? Number(resources.gold ?? 0) - Number(source.resources?.gold ?? 0)
    : 0;

  return {
    state: {
      ...source,
      ...progress,
      heroes,
      resources,
      storedItems,
      forgeMaterials,
      itemBlueprints,
      pendingClassTransitions,
      autoExplore: victory ? source.autoExplore ?? false : false,
    },
    encounter: {
      encounterId,
      kind: "fight",
      floor,
      room,
      outcome: victory ? "victory" : "defeat",
      roundCount: round,
      enemy: {
        id: monster.id,
        name: monster.name,
        hp: monster.hp,
        maxHp: monster.maxHp,
        isBoss: monster.isBoss,
      },
      transcript,
      rewards: { gold: goldReward, loot },
    },
  };
}

function resolveNonFight(
  source: AuthoritativeDungeonState,
  kind: Exclude<DungeonEncounterType, "fight">,
  floor: number,
  room: number,
  encounterId: string,
  rng: Rng,
): AuthoritativeDungeonResolution {
  let heroes = clone(source.heroes ?? []);
  const resources: Resources = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    ore: 0,
    ...(source.resources ?? {}),
  };
  let storedItems = clone(source.storedItems ?? []);
  let forgeMaterials = clone(source.forgeMaterials ?? []);
  const itemBlueprints = clone(source.itemBlueprints ?? []);
  const pendingClassTransitions = clone(source.pendingClassTransitions ?? []);
  const transcript: AuthoritativeDungeonTranscriptEvent[] = [];
  const loot: CanonicalDungeonLoot[] = [];
  let sequence = 0;
  let victory = true;
  let goldReward = 0;
  const log = (
    type: string,
    message: string,
    category: AuthoritativeDungeonTranscriptEvent["category"],
    data: Record<string, unknown> = {},
  ) => transcript.push({ sequence: sequence++, type, message, category, ...data });
  const active = () => heroes.filter((hero) => hero.isActive && hero.currentHp > 0);

  if (kind === "treasure") {
    log("encounter.started", `La chambre ${room} contient un coffre au tresor.`, "info");
    log(
      "treasure.inspected",
      "L'escouade s'approche et examine le coffre orné de runes anciennes.",
      "info",
    );
    log(
      "treasure.opened",
      "Coffre déverrouillé : l'escouade examine son contenu.",
      "victory",
    );
    if (rng.next() < 0.5) {
      goldReward = applyLootModifiers(
        "goldGain",
        getDungeonGoldReward(floor, "treasure"),
        heroes,
      );
      resources.gold = Number(resources.gold ?? 0) + goldReward;
      log("reward.gold", `+${goldReward} or.`, "loot", { gold: goldReward });
    } else if (ITEM_LIBRARY.length > 0) {
      const band = getChestLootBand(floor);
      const rarity = rollWeightedRarity(band.weights, rng.next());
      const drop = resolveEligibleCatalogDrop({
        rarity,
        levelMin: band.levelMin,
        levelMax: band.levelMax,
        provenance: "chest",
      });
      if (!drop) throw new Error(`EMPTY_CHEST_ITEM_POOL:${floor}:${rarity}`);
      const item = drop.candidates[rng.nextInt(drop.candidates.length)];
      const effectiveRarity = drop.rarity;
      const instanceId = `item:dungeon:${encounterId}:loot:${loot.length}`;
      addItemToStorage(storedItems, { instanceId, itemId: item.id, rarity: effectiveRarity });
      loot.push({ type: "item", instanceId, itemId: item.id, rarity: effectiveRarity, count: 1 });
      log("reward.item", `${item.name} [${effectiveRarity}] obtenu.`, "loot", {
        instanceId,
        itemId: item.id,
        itemName: item.name,
        rarity: effectiveRarity,
        count: 1,
      });
    } else {
      log("reward.item.none", "Le coffre est vide.", "info");
    }
    const material = rollEncounterForgeMaterial(floor, rng);
    forgeMaterials = appendMaterial(forgeMaterials, material);
    loot.push({ type: "material", ...material });
    log(
      "reward.material",
      `Materiau : +${material.count} ${material.name} (${material.rarity}).`,
      "loot",
      material,
    );
    const totalXp = Math.round(15 * (1 + (floor - 1) * 0.15));
    const eligible = active().length;
    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const xp = Math.max(1, Math.round((totalXp / eligible) * (hero.race === "Humain" ? 1.15 : 1)));
      const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems);
      storedItems = award.storedItems;
      appendPendingTransition(pendingClassTransitions, award);
      logExperienceAward(log, hero, xp, award);
      return award.hero;
    });
  } else if (kind === "rest") {
    log("encounter.started", `La chambre ${room} offre une zone de repos.`, "info");
    log(
      "rest.started",
      "Les héros s'installent autour du feu pour panser leurs plaies.",
      "info",
    );
    const recovery: Array<Record<string, unknown>> = [];
    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const maxHp = hero.calculatedStats.maxHp;
      const maxMana = hero.calculatedStats.maxMana;
      const next = {
        ...hero,
        currentHp: Math.min(maxHp, hero.currentHp + Math.max(1, Math.round(maxHp * 0.2))),
        currentMana: Math.min(maxMana, hero.currentMana + Math.max(1, Math.round(maxMana * 0.2))),
      };
      recovery.push({
        heroId: hero.id,
        heroName: hero.name,
        hpBefore: hero.currentHp,
        hpAfter: next.currentHp,
        manaBefore: hero.currentMana,
        manaAfter: next.currentMana,
      });
      return next;
    });
    log(
      "party.restored",
      "Halte de répit : l'escouade récupère jusqu'à 20 % de ses PV et PM.",
      "victory",
      { heroes: recovery },
    );
    const totalXp = Math.round(10 * (1 + (floor - 1) * 0.15));
    const eligible = active().length;
    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const xp = Math.max(1, Math.round((totalXp / eligible) * (hero.race === "Humain" ? 1.15 : 1)));
      const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems);
      storedItems = award.storedItems;
      appendPendingTransition(pendingClassTransitions, award);
      logExperienceAward(log, hero, xp, award);
      return award.hero;
    });
  } else {
    if (!(kind in DUNGEON_CHALLENGE_DEFINITIONS)) throw new Error("UNSUPPORTED_DUNGEON_ENCOUNTER");
    const details = DUNGEON_CHALLENGE_DEFINITIONS[kind as DungeonChallengeKind];
    const difficulty = getDungeonChallengeDifficulty(floor, details.difficultyProfile);
    const selected = selectBestDungeonChallengeCandidate(active(), details.statA, details.statB, difficulty);
    if (!selected) throw new Error("NO_ACTIVE_HERO");
    const challengeHeroesBefore = clone(heroes);
    const challenge = rollDungeonChallenge(selected, difficulty, rng);
    const luckRoll = challenge.luckRoll;
    victory = challenge.success;
    const statAValue = selected.hero.baseStats[details.statA];
    const statBValue = selected.hero.baseStats[details.statB];
    const probabilityPercent = Number((selected.successProbability * 100).toFixed(1));
    log(
      "encounter.started",
      `La chambre ${room} impose l'épreuve « ${details.name} ». ${details.description}`,
      "info",
      {
        encounterName: details.name,
        description: details.description,
      },
    );
    log(
      "challenge.hero_selected",
      `${selected.hero.name} est le héros le plus qualifié (`
        + `${CANONICAL_HERO_STAT_PRESENTATION[details.statA].short} ${statAValue} + `
        + `${CANONICAL_HERO_STAT_PRESENTATION[details.statB].short} ${statBValue} = ${selected.score}, `
        + `${probabilityPercent} % de réussite).`,
      "info",
      {
        heroId: selected.hero.id,
        heroName: selected.hero.name,
        score: selected.score,
        primaryStat: details.statA,
        secondaryStat: details.statB,
        primaryLabel: CANONICAL_HERO_STAT_PRESENTATION[details.statA].short,
        secondaryLabel: CANONICAL_HERO_STAT_PRESENTATION[details.statB].short,
        primaryValue: statAValue,
        secondaryValue: statBValue,
        luck: selected.luck,
        successProbability: selected.successProbability,
        probabilityPercent,
      },
    );
    log(
      "challenge.attempted",
      `${selected.hero.name} tente l'épreuve avec un jet de LUK compris entre 1 et ${selected.luck}.`,
      "info",
      {
        heroId: selected.hero.id,
        heroName: selected.hero.name,
        score: selected.score,
        luck: selected.luck,
        luckRoll,
        difficulty,
        successProbability: selected.successProbability,
        probabilityPercent,
      },
    );

    if (victory) {
      if (kind === "enigma") {
        goldReward = getDungeonGoldReward(floor, "enigma");
        heroes = heroes.map((hero) => hero.isActive && hero.currentHp > 0
          ? {
              ...hero,
              currentMana: Math.min(
                hero.calculatedStats.maxMana,
                hero.currentMana + 15,
              ),
            }
          : hero);
      } else if (kind === "ambush") {
        goldReward = getDungeonGoldReward(floor, "ambush");
      } else if (kind === "ritual") {
        heroes = heroes.map((hero) => {
          if (!hero.isActive || hero.currentHp <= 0) return hero;
          const maxMana = hero.calculatedStats.maxMana;
          return {
            ...hero,
            currentMana: Math.min(maxMana, hero.currentMana + Math.max(15, Math.round(maxMana * 0.2))),
          };
        });
      } else if (kind === "negotiation") {
        goldReward = getDungeonGoldReward(floor, "negotiation");
      }
      goldReward = applyLootModifiers("goldGain", goldReward, heroes);
      resources.gold = Number(resources.gold ?? 0) + goldReward;
      log("challenge.succeeded", `Réussite : ${luckRoll} + ${selected.score} ≥ ${difficulty}.`, "victory", {
        heroId: selected.hero.id,
        heroName: selected.hero.name,
        luckRoll,
        score: selected.score,
        difficulty,
        probabilityPercent,
      });
      const successMessages: Record<Exclude<DungeonEncounterType, "fight" | "treasure" | "rest">, string> = {
        trap: `${selected.hero.name} désamorce le piège et sécurise la voie.`,
        enigma: `${selected.hero.name} décrypte l'énigme et restaure l'énergie du groupe.`,
        ambush: `${selected.hero.name} évente l'embuscade et contourne le danger.`,
        ritual: `${selected.hero.name} harmonise le rituel runique.`,
        obstacle: `${selected.hero.name} détruit l'obstacle et ouvre la voie.`,
        negotiation: `${selected.hero.name} négocie un accord pacifique.`,
      };
      log(
        `challenge.${kind}.resolved`,
        successMessages[kind],
        "victory",
        {
          heroId: selected.hero.id,
          heroName: selected.hero.name,
          goldGained: goldReward,
          manaRestored: kind === "enigma" ? 15 : kind === "ritual" ? "20%-minimum-15" : 0,
          heroChanges: summarizeHeroChanges(challengeHeroesBefore, heroes),
        },
      );
      if (goldReward > 0) {
        log("reward.gold", `+${goldReward} or.`, "loot", { gold: goldReward });
      }
      if (rng.next() < 0.5) {
        const material = rollEncounterForgeMaterial(floor, rng);
        forgeMaterials = appendMaterial(forgeMaterials, material);
        loot.push({ type: "material", ...material });
        log(
          "reward.material",
          `Materiau : +${material.count} ${material.name} (${material.rarity}).`,
          "loot",
          material,
        );
      } else {
        log("reward.material.none", "Aucun composant de forge recuperable.", "info");
      }
      const xp = Math.round(20 * (1 + (floor - 1) * 0.15));
      heroes = heroes.map((hero) => {
        if (hero.id !== selected.hero.id) return hero;
        const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems);
        storedItems = award.storedItems;
        appendPendingTransition(pendingClassTransitions, award);
        logExperienceAward(log, hero, xp, award);
        return award.hero;
      });
    } else {
      let goldLost = 0;
      if (kind === "trap") {
        heroes = heroes.map((hero) => hero.isActive && hero.currentHp > 0
          ? {
              ...hero,
              currentHp: Math.max(1, hero.currentHp - Math.max(1, Math.round(hero.calculatedStats.maxHp * 0.45))),
            }
          : hero);
      } else if (kind === "enigma") {
        heroes = heroes.map((hero) => hero.isActive && hero.currentHp > 0
          ? { ...hero, currentMana: Math.max(0, hero.currentMana - 10) }
          : hero);
      } else if (kind === "ritual") {
        heroes = heroes.map((hero) => hero.isActive && hero.currentHp > 0
          ? {
              ...hero,
              currentMana: Math.max(0, hero.currentMana - 15),
              currentHp: Math.max(1, hero.currentHp - Math.max(1, Math.round(hero.calculatedStats.maxHp * 0.1))),
            }
          : hero);
      } else if (kind === "negotiation") {
        goldLost = Math.min(Number(resources.gold ?? 0), 20);
        resources.gold = Number(resources.gold ?? 0) - goldLost;
      } else {
        const fraction = kind === "ambush" || kind === "obstacle" ? 0.2 : 0;
        heroes = heroes.map((hero) => hero.isActive && hero.currentHp > 0
          ? {
              ...hero,
              currentHp: Math.max(1, hero.currentHp - Math.max(1, Math.round(hero.calculatedStats.maxHp * fraction))),
            }
          : hero);
      }
      log("challenge.failed", `Échec : ${luckRoll} + ${selected.score} < ${difficulty}.`, "defeat", {
        heroId: selected.hero.id,
        heroName: selected.hero.name,
        luckRoll,
        score: selected.score,
        difficulty,
        probabilityPercent,
      });
      const failureMessages: Record<Exclude<DungeonEncounterType, "fight" | "treasure" | "rest">, string> = {
        trap: "Le piège s'active : l'escouade perd jusqu'à 45 % de ses PV.",
        enigma: "Un contrecoup psychique retire 10 PM à chaque héros actif.",
        ambush: "L'assaut surprise retire jusqu'à 20 % des PV de l'escouade.",
        ritual: "Le rituel instable retire 15 PM et jusqu'à 10 % des PV.",
        obstacle: "Le passage forcé retire jusqu'à 20 % des PV de l'escouade.",
        negotiation: `La négociation échoue et l'escouade perd ${goldLost} or.`,
      };
      log(
        `challenge.${kind}.consequence`,
        failureMessages[kind],
        "defeat",
        {
          goldLost,
          hpLossPercent:
            kind === "trap" ? 45 : kind === "ambush" || kind === "obstacle" ? 20 : kind === "ritual" ? 10 : 0,
          manaLost: kind === "enigma" ? 10 : kind === "ritual" ? 15 : 0,
          heroChanges: summarizeHeroChanges(challengeHeroesBefore, heroes),
        },
      );
    }
  }

  return {
    state: {
      ...source,
      ...nextProgress(floor, room, Number(source.highestFloorReached ?? floor)),
      heroes,
      resources,
      storedItems,
      forgeMaterials,
      itemBlueprints,
      pendingClassTransitions,
      autoExplore: source.autoExplore ?? false,
    },
    encounter: {
      encounterId,
      kind,
      floor,
      room,
      outcome: victory ? "victory" : "defeat",
      roundCount: 0,
      enemy: null,
      transcript,
      rewards: { gold: goldReward, loot },
    },
  };
}

export function resolveAuthoritativeDungeonEncounter(
  source: AuthoritativeDungeonState,
  encounterId: string,
  rng: Rng,
): AuthoritativeDungeonResolution {
  const floor = Number(source.activeDungeonFloor ?? 1);
  const room = Number(source.activeDungeonRoom ?? 1);
  if (!Array.isArray(source.heroes)) throw new Error("INVALID_GAME_STATE");
  for (const [index, hero] of source.heroes.entries()) {
    if (validateAuthoritativeHero(hero, `heroes[${index}]`).length > 0) {
      throw new Error("INVALID_GAME_STATE");
    }
  }
  const activeHeroes = source.heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
  if (activeHeroes.length === 0) throw new Error("NO_ACTIVE_HERO");
  const previousKind = source.encounterHistory?.at(-1)?.kind;
  const excludedType = previousKind && previousKind !== "fight"
    ? previousKind
    : undefined;
  const kind: DungeonEncounterType = isDungeonFinalRoom(floor, room)
    ? "fight"
    : getRandomDungeonEncounterType(rng, excludedType);
  return kind === "fight"
    ? resolveFight(source, floor, room, encounterId, rng)
    : resolveNonFight(source, kind, floor, room, encounterId, rng);
}

