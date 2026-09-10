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
  RAT_KING_MARK_ID,
  RAT_KING_SIGNATURE_IDS,
  RAT_KING_SIGNATURE_PARAMETERS,
  createRatKingSignatureInstance,
} from "./items/items_rat_king.ts";
import { rollBlueprintReward } from "./items/blueprint-rewards.ts";
import { nameItem } from "./items/naming.ts";
import { resolveItemInstance } from "./items/scaling.ts";
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
  type XpProgressionCurve,
} from "./game-calculations.ts";
import {
  applyLootModifiers,
  getRandomDungeonEncounterType,
  rollEncounterForgeMaterial,
} from "./dungeon-helpers.ts";
import {
  DUNGEON_CHALLENGE_DEFINITIONS,
  DUNGEON_CHALLENGE_FAILURE_PARAMETERS,
  getCanonicalDungeonChallengeDifficulty,
  rollDungeonChallenge,
  selectBestDungeonChallengeCandidate,
  type DungeonChallengeKind,
  type DungeonChallengeDifficultyResolver,
} from "./dungeon-challenges.ts";
import { CANONICAL_HERO_STAT_PRESENTATION } from "./hero-stats.ts";
import { createDungeonItemRewardRng, shouldAwardDungeonItem } from "./dungeon-loot-policy.ts";
import type { Rng } from "./random.ts";
import {
  applyHeroProgression,
  type HeroProgressionResult,
} from "./hero-progression.ts";
import { describeTier1EquipmentReward } from "./tier1-class-equipment-reward.ts";
import { validateAuthoritativeHero } from "./authoritative-hero-validation.ts";
import {
  getFirstClearGold,
  getDungeonGoldReward,
  getDungeonRoomCount,
  getMajorBossIndex,
  getRegularEnemyBudget,
  isDungeonFinalRoom,
  isMajorBossFloor,
} from "./dungeon-progression.ts";
import {
  CANONICAL_DUNGEON_XP_REWARD_POLICY,
  calculateSharedCombatXp,
  getPolicyXpPool,
  type DungeonXpRewardPolicy,
  type DungeonXpRewardSource,
} from "./dungeon-xp-rewards.ts";
import {
  resolveMonsterAttackProfile,
  resolveMonsterCombatRank,
  rollMonsterStrikeCount,
} from "./monster-combat.ts";
import { chooseHeroAction } from "./combat-tactics.ts";
import {
  UNDERCITY_PERSONAL_REWARD_PARAMETERS,
  settleUndercityVictory,
} from "./undercity-progression.ts";
import {
  UNDERCITY_DUNGEON_ID,
  UNDERCITY_MAX_FLOOR,
  getUndercityEncounterBlueprint,
  getUndercityZone,
  resolveUndercityThemeModifier,
} from "./undercity.ts";
import {
  chooseUndercityEnemyTarget,
  createUndercityCombatGroup,
  damageUndercityEnemy,
  livingUndercityEnemies,
  performUndercitySupport,
  prepareUndercityEnemyRound,
  primaryUndercityEnemy,
  summarizeUndercityGroup,
} from "./undercity-combat.ts";
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
  enemies?: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    isBoss?: boolean;
    role?: "ordinary" | "protector" | "support" | "ranged" | "guard" | "king";
    intent?: string;
    effects?: string[];
  }>;
  transcript: AuthoritativeDungeonTranscriptEvent[];
  rewards: { gold: number; loot: CanonicalDungeonLoot[] };
};

export type AuthoritativeDungeonState = CanonicalGameState;

export type AuthoritativeDungeonResolution = {
  state: AuthoritativeDungeonState;
  encounter: AuthoritativeDungeonEncounter;
};

export type AuthoritativeDungeonResolutionOptions = {
  xpCurve?: XpProgressionCurve;
  /** Simulation seam. Undefined uses the canonical runtime reward economy. */
  xpRewardPolicy?: DungeonXpRewardPolicy;
  /** Simulation seam. Undefined uses the canonical runtime challenge difficulty. */
  challengeDifficultyResolver?: DungeonChallengeDifficultyResolver;
};

function rollGeneratedItemLevel(
  item: { levelRange: { min: number; max: number } },
  levelMin: number,
  levelMax: number,
  rng: Pick<Rng, 'nextInt'>,
): number {
  const minimum = Math.max(item.levelRange.min, Math.ceil(levelMin), 1);
  const maximum = Math.min(item.levelRange.max, Math.floor(levelMax), 40);
  if (maximum < minimum) throw new Error(`EMPTY_ITEM_LEVEL_RANGE:${minimum}:${maximum}`);
  return minimum === maximum ? minimum : minimum + rng.nextInt(maximum - minimum + 1);
}

function applyUndercityThemeToItem(
  item: (typeof ITEM_LIBRARY)[number],
  baseInstance: StoredItemInstance,
  floor: number,
): StoredItemInstance {
  const resolved = resolveItemInstance(item, baseInstance);
  const zone = getUndercityZone(floor);
  return {
    ...baseInstance,
    modifiers: [...(resolved.modifiers ?? []).map((modifier) => ({ ...modifier })), resolveUndercityThemeModifier(floor, baseInstance.instanceId, item)],
    sourceDungeonId: UNDERCITY_DUNGEON_ID,
    sourceZoneId: zone.id,
  };
}
function rollCatalogItemReward(
  floor: number,
  encounterId: string,
  lootIndex: number,
  provenance: "boss" | "chest",
  rng: Rng,
  themed = false,
) {
  const band = getChestLootBand(floor);
  const rarity = rollWeightedRarity(band.weights, rng.next());
  const drop = resolveEligibleCatalogDrop({
    rarity,
    levelMin: band.levelMin,
    levelMax: band.levelMax,
    provenance,
  });
  if (!drop) throw new Error(`EMPTY_DUNGEON_ITEM_POOL:${floor}:${rarity}:${provenance}`);
  const item = drop.candidates[rng.nextInt(drop.candidates.length)];
  const itemLevel = rollGeneratedItemLevel(item, band.levelMin, band.levelMax, rng);
  const baseInstance = {
    instanceId: `item:dungeon:${encounterId}:loot:${lootIndex}`,
    itemId: item.id,
    itemLevel,
    powerModelId: item.powerModelId,
    rarity: drop.rarity,
  };
  if (!themed) return { item, instance: baseInstance, itemName: nameItem(item, baseInstance).name };
  const instance = applyUndercityThemeToItem(item, baseInstance, floor);
  return { item, instance, itemName: nameItem(item, instance).name };
}

function calculatePolicyPartyXp(
  eligibleCount: number,
  hero: Pick<Hero, "race">,
  xpPool: number,
): number {
  return calculateSharedCombatXp(xpPool, eligibleCount, hero);
}

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
  xpCurve?: XpProgressionCurve,
): HeroProgressionResult {
  return applyHeroProgression({ hero, xpEarned: xp, rng, buildings, storedItems, xpCurve });
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
  context: { source: DungeonXpRewardSource; floor: number },
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

function scaleMonster(
  floor: number,
  room: number,
  rng: Rng,
  xpRewardPolicy: DungeonXpRewardPolicy,
): { monster: Monster; itemRewardEntropy: number } {
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
  const xpSource: DungeonXpRewardSource = majorBoss
    ? "major_boss"
    : bossRoom
    ? "elite"
    : "regular_combat";
  const xpYield = getPolicyXpPool(
    xpRewardPolicy,
    xpSource,
    floor,
    majorBoss ? 1 : archetypeFactor("xpYield"),
  );
  const goldYield = majorBoss
    ? selected.goldYield
    : Math.max(1, Math.round(budget.gold * archetypeFactor("goldYield") * (bossRoom ? 2.5 : 1)));

  // The characterized 640f89f behavior consumed a gameplay RNG draw for this visual ID.
  const itemRewardEntropy = rng.next();
  const monster = {
    ...selected,
    ...(bossRoom && !majorBoss ? { name: `${selected.name} d'élite`, isBoss: true } : {}),
    id: itemRewardEntropy.toString(),
    hp: maxHp,
    maxHp,
    atk: attack,
    def: majorBoss ? selected.def : Math.max(0, Math.floor(attack * defenseRatio)),
    magicDef: majorBoss ? selected.magicDef : Math.max(0, Math.floor(attack * magicDefenseRatio)),
    resistances: selected.resistances,
    xpYield,
    goldYield,
  };
  return { monster, itemRewardEntropy };
}

function resolveFight(
  source: AuthoritativeDungeonState,
  floor: number,
  room: number,
  encounterId: string,
  rng: Rng,
  xpCurve: XpProgressionCurve | undefined,
  xpRewardPolicy: DungeonXpRewardPolicy,
): AuthoritativeDungeonResolution {
  let heroes = clone(source.heroes ?? []);
  const scaledMonster = scaleMonster(floor, room, rng, xpRewardPolicy);
  const canonicalMonsterName = scaledMonster.monster.name;
  const isUndercity = source.currentEncounter?.dungeonId === UNDERCITY_DUNGEON_ID;
  const encounterBlueprint = isUndercity
    ? getUndercityEncounterBlueprint(floor, room, getDungeonRoomCount(floor), scaledMonster.itemRewardEntropy)
    : { id: "legacy-single", name: canonicalMonsterName, behavior: "swarm" as const, members: [{ name: canonicalMonsterName, role: "ordinary" as const }] };
  let monster = { ...scaledMonster.monster, name: encounterBlueprint.name };
  const enemyGroup = createUndercityCombatGroup(monster, encounterBlueprint);
  monster = primaryUndercityEnemy(enemyGroup);
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
  let dungeonProgress = clone(source.dungeonProgress);
  const participantHeroIds = source.currentEncounter?.participantHeroIds
    ?? heroes.filter((hero) => hero.isActive && hero.currentHp > 0).map((hero) => hero.id);
  const pendingClassTransitions = clone(source.pendingClassTransitions ?? []);
  const transcript: AuthoritativeDungeonTranscriptEvent[] = [];
  const loot: CanonicalDungeonLoot[] = [];
  let sequence = 0;
  let round = 0;
  let activeEffects: TemporaryCombatEffect[] = [];
  const majorBossEncounter = isDungeonFinalRoom(floor, room) && isMajorBossFloor(floor);
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

  while (livingUndercityEnemies(enemyGroup).length > 0 && heroes.some((hero) => hero.isActive && hero.currentHp > 0)) {
    round += 1;
    if (round > 100) throw new Error("COMBAT_LIMIT_REACHED");
    for (const enemy of prepareUndercityEnemyRound(enemyGroup, round)) {
      if (!isUndercity) continue;
      log("enemy.intent", enemy.name + " : " + enemy.intent + ".", "combat-enemy", { round, monsterId: enemy.id, monsterName: enemy.name, intent: enemy.intent });
    }
    monster = primaryUndercityEnemy(enemyGroup);

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
      monster = chooseUndercityEnemyTarget(enemyGroup, hero, activeEffects);
      const calculatedStats = getEffectiveHeroStats(hero, activeEffects);
      let skillUsed = false;
      let totalDamage = 0;
      const chosenAction = chooseHeroAction({
        hero,
        heroes,
        monster,
        enemies: livingUndercityEnemies(enemyGroup),
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
          if (isUndercity && skill.target === "all_enemies") {
            for (const target of [...livingUndercityEnemies(enemyGroup)]) {
              for (let hit = 1; hit <= hitCount && target.hp > 0; hit += 1) {
                const critical = rng.next() < calculatedStats.criticalChance / 100;
                const rawBase = Math.floor(requiredCalculatedStat(calculatedStats, effect.scalingStat) * effect.power);
                const rawDamage = critical ? Math.floor(rawBase * 1.5) : rawBase;
                const damage = applyMonsterDefenseOrResistance(rawDamage, effect.damageType, getEffectiveMonster(target, activeEffects));
                const applied = isUndercity ? damageUndercityEnemy(enemyGroup, target.id, damage) : damage;
          if (!isUndercity) totalDamage += damage;
                log(
                  "hero.skill.damage",
                  (critical ? "[Coup critique] " : "") + hero.name + " utilise " + skill.name + " sur " + target.name + " et inflige " + applied + " dégâts " + effect.damageType + ".",
                  "combat-hero",
                  {
                    round, heroId: hero.id, heroName: hero.name, monsterId: target.id, monsterName: target.name,
                    skillId, skillName: skill.name, hit, hitCount, critical, damage: applied, damageType: effect.damageType,
                    enemyHp: isUndercity ? target.hp : Math.max(0, target.hp - totalDamage), enemyMaxHp: target.maxHp, decisionReason: chosenAction.reason,
                  },
                );
              }
            }
            monster = primaryUndercityEnemy(enemyGroup);
          } else {
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
            const impactedMonster = monster;
            if (isUndercity) {
              damageUndercityEnemy(enemyGroup, impactedMonster.id, damage);
              monster = primaryUndercityEnemy(enemyGroup);
            }
            log(
              "hero.skill.damage",
              hitCount > 1
                ? `${hero.name} declenche ${skill.name} et frappe ${hitCount} fois : ${impactSummary} degats ${effect.damageType} (${damage} au total).`
                : `${criticalHitCount > 0 ? "[Coup critique] " : ""}${hero.name} declenche ${skill.name} et inflige ${damage} degats ${effect.damageType}.`,
              "combat-hero",
              {
                round, heroId: hero.id, heroName: hero.name, monsterId: impactedMonster.id,
                monsterName: impactedMonster.name, skillId, skillName: skill.name, hitCount,
                hitResults, criticalHitCount, damage, damageType: effect.damageType,
                enemyHp: isUndercity ? impactedMonster.hp : Math.max(0, impactedMonster.hp - damage), enemyMaxHp: impactedMonster.maxHp,
                decisionReason: chosenAction.reason,
              },
            );
          }
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
            ? (skill.target === "all_enemies" ? livingUndercityEnemies(enemyGroup) : [monster])
              .map((target) => ({ id: target.id, side: "monster" as const }))
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
        const strikes = rollWeaponStrikeCount(attackSpeed, calculatedStats.speed, attackProfile, () => rng.next());

        for (let strike = 1; strike <= strikes && (isUndercity ? livingUndercityEnemies(enemyGroup).length > 0 : true); strike += 1) {
          const target = primaryUndercityEnemy(enemyGroup);
          const weaponDamage = rollWeaponDamage(weapon, rng);
          const scaling = weapon?.scaling ?? UNARMED_WEAPON_CONTEXT.scaling;
          const attackPower = selectWeaponAttackPower(calculatedStats, scaling);
          const rawDamage = calculateWeaponStrikePower(attackPower, attackProfile) + weaponDamage;
          const critical = rng.next() < calculatedStats.criticalChance / 100;
          const criticalDamage = critical ? Math.floor(rawDamage * 1.5) : rawDamage;
          const damageTypes = weapon && getWeaponDamageTypes(weapon).length > 0 ? getWeaponDamageTypes(weapon) : ["physical" as DamageType];
          const damage = applySplitDamageDefenseOrResistance(criticalDamage, damageTypes, getEffectiveMonster(target, activeEffects));
          const applied = isUndercity ? damageUndercityEnemy(enemyGroup, target.id, damage) : damage;
          if (!isUndercity) totalDamage += damage;
          const hitLabels = [
            strike > attackProfile.baseStrikes ? "[Frappe bonus]" : attackProfile.baseStrikes > 1 && strike > 1 ? "[Seconde arme]" : null,
            critical ? "[Coup critique]" : null,
          ].filter((label): label is string => label !== null);
          const hitPrefix = hitLabels.length > 0 ? hitLabels.join(" ") + " " : "";
          log(
            critical ? "hero.hit.critical" : "hero.hit",
            hitPrefix + hero.name + " inflige " + applied + " dégâts à " + target.name + ".",
            "combat-hero",
            {
              round, heroId: hero.id, heroName: hero.name, monsterId: target.id, monsterName: target.name,
              strike, strikeCount: strikes, weaponDamage, rawDamage, damageTypes, critical, damage: applied,
              enemyHp: isUndercity ? target.hp : Math.max(0, target.hp - totalDamage), enemyMaxHp: target.maxHp, decisionReason: chosenAction.reason,
            },
          );
        }
      }

      if (!isUndercity && totalDamage > 0) damageUndercityEnemy(enemyGroup, monster.id, totalDamage);
      monster = primaryUndercityEnemy(enemyGroup);
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

    if (livingUndercityEnemies(enemyGroup).length === 0) break;

    for (const actingEnemy of [...livingUndercityEnemies(enemyGroup)]) {
      const support = performUndercitySupport(enemyGroup, actingEnemy, round);
      if (support) {
        log(
          "enemy.support",
          `${actingEnemy.name} soigne ${support.target.name} de ${support.healing} PV.`,
          "combat-enemy",
          {
            round,
            monsterId: actingEnemy.id,
            monsterName: actingEnemy.name,
            targetMonsterId: support.target.id,
            targetMonsterName: support.target.name,
            healing: support.healing,
            enemyHp: support.target.hp,
            enemyMaxHp: support.target.maxHp,
          },
        );
        continue;
      }

      const attackRank = resolveMonsterCombatRank(actingEnemy.isBoss, majorBossEncounter && actingEnemy.isBoss);
      const attackProfile = resolveMonsterAttackProfile(attackRank, floor);
      const strikes = rollMonsterStrikeCount(attackProfile, () => rng.next());

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
        const effectiveMonster = getEffectiveMonster(actingEnemy, activeEffects);
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
            `${strikePrefix}${target.name} esquive l'attaque de ${actingEnemy.name}.`,
            "combat-enemy",
            {
              round,
              heroId: target.id,
              heroName: target.name,
              monsterId: actingEnemy.id,
              monsterName: actingEnemy.name,
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
            ? `${strikePrefix}${actingEnemy.name} inflige ${damage} dégâts à ${target.name} (${target.currentHp} → 0/${targetStats.maxHp} PV). ${target.name} s'écroule et reste KO dans l'expédition.`
            : `${strikePrefix}${actingEnemy.name} inflige ${damage} dégâts à ${target.name}.`,
          hp === 0 ? "defeat" : "combat-enemy",
          {
            round,
            heroId: target.id,
            heroName: target.name,
            monsterId: actingEnemy.id,
            monsterName: actingEnemy.name,
            strike,
            strikeCount: strikes,
            damage,
            damageType: actingEnemy.damageType,
            defense,
            heroHpBefore: target.currentHp,
            heroHp: hp,
            heroMaxHp: targetStats.maxHp,
          },
        );
      }
    }
    activeEffects = advanceTemporaryCombatEffects(activeEffects);
  }

  monster = { ...summarizeUndercityGroup(enemyGroup), name: encounterBlueprint.name };
  const victory = monster.hp === 0;
  const finalRoom = isDungeonFinalRoom(floor, room);
  const accountCompletedFloor = isUndercity
    ? Object.values(dungeonProgress.heroes).reduce((maximum, progress) => Math.max(maximum, progress.completedFloor), 0)
    : -1;
  const firstClear = finalRoom
    && floor === Number(source.highestFloorReached ?? floor)
    && (!isUndercity || accountCompletedFloor < floor);
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
    const bossTable = majorBoss ? BOSS_LOOT_TABLES_REGISTRY[canonicalMonsterName] : undefined;
    if (majorBoss && !bossTable) throw new Error(`BOSS_LOOT_TABLE_NOT_FOUND:${monster.name}`);
    const bossGold = bossTable?.goldRange
      ? bossTable.goldRange[0] + rng.nextInt(bossTable.goldRange[1] - bossTable.goldRange[0] + 1)
      : monster.goldYield;
    const baseGold = Math.floor(bossGold * goblinBonus * leaderBonus);
    const gold = applyLootModifiers("goldGain", baseGold, heroes);
    resources.gold = Number(resources.gold ?? 0) + gold;
    log("reward.gold", `+${gold} or.`, "loot", { gold });
    if (firstClear) {
      const firstClearGold = getFirstClearGold(floor);
      resources.gold = Number(resources.gold ?? 0) + firstClearGold;
      log(
        "reward.floor_first_clear",
        `Prime de première sécurisation : +${firstClearGold} or.`,
        "loot",
        { gold: firstClearGold, floor },
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
        const itemLevel = rollGeneratedItemLevel(
          item,
          reward.levelMin ?? 1,
          reward.levelMax ?? 40,
          rng,
        );
        const instanceId = `item:dungeon:${encounterId}:loot:${loot.length}`;
        const baseItemInstance: StoredItemInstance = {
          instanceId,
          itemId: item.id,
          itemLevel,
          powerModelId: item.powerModelId,
          rarity: drop.rarity,
        };
        const itemInstance = isUndercity ? applyUndercityThemeToItem(item, baseItemInstance, floor) : baseItemInstance;
        addItemToStorage(storedItems, itemInstance);
        loot.push({ type: 'item', ...itemInstance, count: 1 });
        const itemName = nameItem(item, itemInstance).name;
        log("reward.item", `${itemName} [${drop.rarity}] obtenu.`, "loot", {
          ...itemInstance, itemName, count: 1,
        });
      }
      for (const reward of bossTable.blueprints) {
        const result = rollBlueprintReward({
          blueprints: itemBlueprints,
          source: "boss",
          floor,
          bossId: canonicalMonsterName,
          chance: reward.chance,
          levelMin: reward.levelMin,
          levelMax: reward.levelMax,
          rng,
        });
        itemBlueprints = result.blueprints;
        if (!result.itemId) continue;
        loot.push({ type: "blueprint", itemId: result.itemId, count: 1 });
        log("reward.blueprint", `Plan de forge obtenu : ${result.itemName}.`, "loot", { itemId: result.itemId, itemName: result.itemName });
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

    const itemRewardSource = finalRoom ? "final-fight" : "ordinary-fight";
    const itemRewardRng = createDungeonItemRewardRng(scaledMonster.itemRewardEntropy, floor, room);
    const existingItemCount = loot.filter((entry) => entry.type === "item").length;
    const itemRoll = itemRewardSource === "ordinary-fight" ? itemRewardRng.next() : undefined;
    if (shouldAwardDungeonItem({
      source: itemRewardSource,
      existingItemCount,
      heroes,
      roll: itemRoll,
    })) {
      const reward = rollCatalogItemReward(
        floor,
        encounterId,
        loot.length,
        finalRoom ? "boss" : "chest",
        itemRewardRng,
        isUndercity,
      );
      addItemToStorage(storedItems, reward.instance);
      loot.push({ type: "item", ...reward.instance, count: 1 });
      log("reward.item", `${reward.itemName} [${reward.instance.rarity}] obtenu.`, "loot", {
        ...reward.instance,
        itemName: reward.itemName,
        count: 1,
      });
    }

    const eligibleCount = heroes.filter((hero) => hero.isActive && hero.currentHp > 0).length;
    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const xp = calculatePolicyPartyXp(
        eligibleCount,
        hero,
        monster.xpYield,
      );
      const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems, xpCurve);
      storedItems = award.storedItems;
      appendPendingTransition(pendingClassTransitions, award);
      logExperienceAward(log, hero, xp, award, {
        source: majorBoss ? "major_boss" : finalRoom ? "elite" : "regular_combat",
        floor,
      });
      return award.hero;
    });
    if (isUndercity) {
      const settlement = settleUndercityVictory(
        dungeonProgress,
        participantHeroIds,
        floor,
        room,
        getDungeonRoomCount(floor),
      );
      dungeonProgress = settlement.progress;
      const personalKind = floor % 10 === 0 ? "boss" : "elite";
      for (const heroId of settlement.firstVictoryHeroIds) {
        const heroIndex = heroes.findIndex((hero) => hero.id === heroId);
        if (heroIndex < 0 || !settlement.fixedVictoryId) continue;
        const original = heroes[heroIndex];
        const personalXp = Math.max(1, Math.floor(monster.xpYield * (
          personalKind === "boss"
            ? UNDERCITY_PERSONAL_REWARD_PARAMETERS.bossXpFactor
            : UNDERCITY_PERSONAL_REWARD_PARAMETERS.eliteXpFactor
        )));
        const award = awardExperience(original, personalXp, rng, source.buildings ?? {}, storedItems, xpCurve);
        storedItems = award.storedItems;
        appendPendingTransition(pendingClassTransitions, award);
        heroes[heroIndex] = award.hero;
        logExperienceAward(log, original, personalXp, award, { source: "floor_first_clear", floor });

        const material = {
          materialId: personalKind === "boss" ? "refined_metal" : "metal_scrap",
          rarity: personalKind === "boss" ? "uncommon" as const : "common" as const,
          count: Math.ceil(floor / 10) * UNDERCITY_PERSONAL_REWARD_PARAMETERS.materialPerBand,
          name: personalKind === "boss" ? "Métal raffiné" : "Débris métalliques",
        };
        forgeMaterials = appendMaterial(forgeMaterials, material);
        loot.push({ type: "material", ...material });
        log("reward.personal_first", "Prime personnelle de première victoire.", "loot", {
          heroId,
          fixedVictoryId: settlement.fixedVictoryId,
          xp: personalXp,
          materialId: material.materialId,
          rarity: material.rarity,
          count: material.count,
        });

        if (personalKind === "boss") {
          const personalItemIds = [
            "progression_ring",
            "progression_amulet",
            "progression_bracelet",
            "progression_belt",
            "progression_cloak",
            "progression_charm",
          ] as const;
          const itemId = personalItemIds[Math.max(0, Math.min(personalItemIds.length - 1, Math.floor(floor / 10) - 1))];
          const item = ITEM_LIBRARY.find((candidate) => candidate.id === itemId);
          if (!item) throw new Error(`PERSONAL_REWARD_ITEM_NOT_FOUND:${itemId}`);
          const itemLevel = Math.max(1, Math.min(original.level, getChestLootBand(floor).levelMax));
          const instance = {
            instanceId: `personal-item:${settlement.fixedVictoryId}:${heroId}`,
            itemId,
            itemLevel,
            powerModelId: item.powerModelId,
            rarity: "rare" as const,
          };
          addItemToStorage(storedItems, instance);
          loot.push({ type: "item", ...instance, count: 1 });
          log("reward.personal_first_item", "Équipement personnel de première victoire.", "loot", {
            heroId,
            fixedVictoryId: settlement.fixedVictoryId,
            ...instance,
          });
        }
      }

      if (majorBoss && floor === 50) {
        const markCount = RAT_KING_SIGNATURE_PARAMETERS.marksPerVictory[0]
          + rng.nextInt(RAT_KING_SIGNATURE_PARAMETERS.marksPerVictory[1] - RAT_KING_SIGNATURE_PARAMETERS.marksPerVictory[0] + 1);
        const mark = { materialId: RAT_KING_MARK_ID, rarity: "epic" as const, count: markCount, name: "Marque du Roi" };
        forgeMaterials = appendMaterial(forgeMaterials, mark);
        loot.push({ type: "material", ...mark });
        log("reward.rat_king_mark", "Marque du Roi obtenue.", "loot", mark);

        const knownBlueprints = new Set(itemBlueprints.filter((entry) => entry.unlocked).map((entry) => entry.itemId));
        const missingSignatures = RAT_KING_SIGNATURE_IDS.filter((itemId) => !knownBlueprints.has(itemId));
        if (missingSignatures.length > 0 && rng.next() < RAT_KING_SIGNATURE_PARAMETERS.blueprintChance) {
          const itemId = missingSignatures[rng.nextInt(missingSignatures.length)];
          itemBlueprints = [...itemBlueprints.filter((entry) => entry.itemId !== itemId), { itemId, unlocked: true }];
          loot.push({ type: "blueprint", itemId, count: 1 });
          log("reward.rat_king_blueprint", "Plan de signature du Roi obtenu.", "loot", { itemId });
        }

        if (rng.next() < RAT_KING_SIGNATURE_PARAMETERS.directDropChance) {
          const itemId = RAT_KING_SIGNATURE_IDS[rng.nextInt(RAT_KING_SIGNATURE_IDS.length)];
          const rarity = rng.next() < RAT_KING_SIGNATURE_PARAMETERS.legendaryDirectChance ? "legendary" : "epic";
          const instance = createRatKingSignatureInstance(itemId, rarity, `rat-king-drop:${encounterId}`);
          addItemToStorage(storedItems, instance);
          loot.push({ type: "item", ...instance, count: 1 });
          log("reward.rat_king_signature", "Signature du Roi obtenue.", "loot", { itemId, rarity, instanceId: instance.instanceId });
        }
      }

      }

    if (firstClear) {
      const xpPool = getPolicyXpPool(xpRewardPolicy, "floor_first_clear", floor);
      const bonusEligibleCount = heroes.filter((hero) => hero.isActive && hero.currentHp > 0).length;
      heroes = heroes.map((hero) => {
        if (!hero.isActive || hero.currentHp <= 0) return hero;
        const xp = calculatePolicyPartyXp(
          bonusEligibleCount,
          hero,
          xpPool,
        );
        const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems, xpCurve);
        storedItems = award.storedItems;
        appendPendingTransition(pendingClassTransitions, award);
        logExperienceAward(log, hero, xp, award, { source: "floor_first_clear", floor });
        return award.hero;
      });
    }
    if (firstClear) {
      log(
        "dungeon.floor_completed",
        floor === UNDERCITY_MAX_FLOOR
          ? 'Les Dessous de la Cité sont sécurisés. Choisissez une zone à farmer.'
          : `Étage ${floor} sécurisé : l'étage ${floor + 1} est désormais accessible.`,
        "victory",
        { completedFloor: floor, unlockedFloor: Math.min(UNDERCITY_MAX_FLOOR, floor + 1) },
      );
    }
  }

  const resolvedProgress = victory
    ? nextProgress(floor, room, Number(source.highestFloorReached ?? floor))
    : {
        activeDungeonFloor: floor,
        activeDungeonRoom: room,
        highestFloorReached: Number(source.highestFloorReached ?? floor),
      };
  const progress = isUndercity
    ? {
        ...resolvedProgress,
        activeDungeonFloor: Math.min(UNDERCITY_MAX_FLOOR, resolvedProgress.activeDungeonFloor),
        highestFloorReached: Math.min(UNDERCITY_MAX_FLOOR, resolvedProgress.highestFloorReached),
      }
    : resolvedProgress;
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
      dungeonProgress,
      pendingClassTransitions,
      autoExplore: victory
        ? (isUndercity && finalRoom && floor === UNDERCITY_MAX_FLOOR && dungeonProgress.expedition.mode === 'progression'
            ? false
            : source.autoExplore ?? false)
        : false,
    },
    encounter: {
      encounterId,
      kind: "fight",
      floor,
      room,
      outcome: victory ? "victory" : "defeat",
      roundCount: round,
      enemies: enemyGroup.members.map((enemy) => ({ id: enemy.id, name: enemy.name, hp: enemy.hp, maxHp: enemy.maxHp, isBoss: enemy.isBoss, role: enemy.role, intent: enemy.intent, effects: [] })),
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
  xpCurve: XpProgressionCurve | undefined,
  xpRewardPolicy: DungeonXpRewardPolicy,
  challengeDifficultyResolver: DungeonChallengeDifficultyResolver,
): AuthoritativeDungeonResolution {
  let heroes = clone(source.heroes ?? []);
  const isUndercity = source.currentEncounter?.dungeonId === UNDERCITY_DUNGEON_ID;
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
  let itemBlueprints = clone(source.itemBlueprints ?? []);
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
    const treasureRewardRoll = rng.next();
    if (treasureRewardRoll < 0.5) {
      goldReward = applyLootModifiers(
        "goldGain",
        getDungeonGoldReward(floor, "treasure"),
        heroes,
      );
      resources.gold = Number(resources.gold ?? 0) + goldReward;
      log("reward.gold", `+${goldReward} or.`, "loot", { gold: goldReward });
    } else if (ITEM_LIBRARY.length > 0) {
      const reward = rollCatalogItemReward(floor, encounterId, loot.length, "chest", rng, isUndercity);
      addItemToStorage(storedItems, reward.instance);
      loot.push({ type: "item", ...reward.instance, count: 1 });
      log("reward.item", `${reward.itemName} [${reward.instance.rarity}] obtenu.`, "loot", {
        ...reward.instance,
        itemName: reward.itemName,
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
    const blueprint = rollBlueprintReward({
      blueprints: itemBlueprints,
      source: "treasure",
      floor,
      chance: 0.05,
      rng,
    });
    itemBlueprints = blueprint.blueprints;
    if (blueprint.itemId) {
      loot.push({ type: "blueprint", itemId: blueprint.itemId, count: 1 });
      log("reward.blueprint", `Plan de forge obtenu : ${blueprint.itemName}.`, "loot", {
        itemId: blueprint.itemId,
        itemName: blueprint.itemName,
      });
    }
    if (shouldAwardDungeonItem({
      source: "treasure",
      existingItemCount: loot.filter((entry) => entry.type === "item").length,
      heroes,
    })) {
      const itemRewardRng = createDungeonItemRewardRng(treasureRewardRoll, floor, room);
      const reward = rollCatalogItemReward(floor, encounterId, loot.length, "chest", itemRewardRng, isUndercity);
      addItemToStorage(storedItems, reward.instance);
      loot.push({ type: "item", ...reward.instance, count: 1 });
      log("reward.item", `${reward.itemName} [${reward.instance.rarity}] obtenu.`, "loot", {
        ...reward.instance,
        itemName: reward.itemName,
        count: 1,
      });
    }
    const totalXp = getPolicyXpPool(xpRewardPolicy, "treasure", floor);
    const eligible = active().length;
    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const xp = calculatePolicyPartyXp(
        eligible,
        hero,
        totalXp,
      );
      const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems, xpCurve);
      storedItems = award.storedItems;
      appendPendingTransition(pendingClassTransitions, award);
      logExperienceAward(log, hero, xp, award, { source: "treasure", floor });
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
    const segmentIds = new Set(source.dungeonProgress?.expedition.segmentHeroIds ?? []);
    const knockedOutIds = new Set(source.dungeonProgress?.expedition.knockedOutHeroIds ?? []);
    heroes = heroes.map((hero) => {
      const revivable = segmentIds.has(hero.id) && knockedOutIds.has(hero.id);
      if ((!hero.isActive || hero.currentHp <= 0) && !revivable) return hero;
      const maxHp = hero.calculatedStats.maxHp;
      const maxMana = hero.calculatedStats.maxMana;
      const next = {
        ...hero,
        currentHp: Math.min(maxHp, hero.currentHp + Math.max(1, Math.round(maxHp * 0.2))),
        currentMana: Math.min(maxMana, hero.currentMana + Math.max(1, Math.round(maxMana * 0.2))),
        ...(revivable ? { isActive: true, status: "idle" as const } : {}),
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
    const totalXp = getPolicyXpPool(xpRewardPolicy, "rest", floor);
    const eligible = active().length;
    heroes = heroes.map((hero) => {
      if (!hero.isActive || hero.currentHp <= 0) return hero;
      const xp = calculatePolicyPartyXp(
        eligible,
        hero,
        totalXp,
      );
      const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems, xpCurve);
      storedItems = award.storedItems;
      appendPendingTransition(pendingClassTransitions, award);
      logExperienceAward(log, hero, xp, award, { source: "rest", floor });
      return award.hero;
    });
  } else {
    if (!(kind in DUNGEON_CHALLENGE_DEFINITIONS)) throw new Error("UNSUPPORTED_DUNGEON_ENCOUNTER");
    const details = DUNGEON_CHALLENGE_DEFINITIONS[kind as DungeonChallengeKind];
    const activeHeroes = active();
    const difficulty = challengeDifficultyResolver(floor, kind as DungeonChallengeKind, {
      farm: source.dungeonProgress.expedition.mode === "farm",
      partyLevel: Math.min(...activeHeroes.map((hero) => hero.level)),
    });
    const selected = selectBestDungeonChallengeCandidate(activeHeroes, details.statA, details.statB, difficulty);
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
      const totalXp = getPolicyXpPool(xpRewardPolicy, "challenge", floor);
      const eligible = active().length;
      heroes = heroes.map((hero) => {
        if (!hero.isActive || hero.currentHp <= 0) return hero;
        const xp = calculatePolicyPartyXp(eligible, hero, totalXp);
        const award = awardExperience(hero, xp, rng, source.buildings ?? {}, storedItems, xpCurve);
        storedItems = award.storedItems;
        appendPendingTransition(pendingClassTransitions, award);
        logExperienceAward(log, hero, xp, award, { source: "challenge", floor });
        return award.hero;
      });
    } else {
      let goldLost = 0;
      if (kind === "trap" || kind === "ambush" || kind === "obstacle") {
        const fraction = kind === "trap"
          ? DUNGEON_CHALLENGE_FAILURE_PARAMETERS.trapCurrentHpFraction
          : kind === "ambush"
            ? DUNGEON_CHALLENGE_FAILURE_PARAMETERS.ambushCurrentHpFraction
            : DUNGEON_CHALLENGE_FAILURE_PARAMETERS.obstacleCurrentHpFraction;
        heroes = heroes.map((hero) => hero.isActive && hero.currentHp > 0
          ? {
              ...hero,
              currentHp: Math.max(1, hero.currentHp - Math.max(1, Math.round(hero.currentHp * fraction))),
            }
          : hero);
      } else if (kind === "enigma" || kind === "ritual") {
        heroes = heroes.map((hero) => {
          if (hero.id !== selected.hero.id) return hero;
          const manaLost = hero.currentMana <= 0
            ? 0
            : Math.max(1, Math.round(
                hero.currentMana
                * DUNGEON_CHALLENGE_FAILURE_PARAMETERS.selectedHeroCurrentManaFraction,
              ));
          return { ...hero, currentMana: Math.max(0, hero.currentMana - manaLost) };
        });
      } else if (kind === "negotiation") {
        const currentGold = Number(resources.gold ?? 0);
        const proportionalLoss = currentGold <= 0
          ? 0
          : Math.max(1, Math.round(
              currentGold
              * DUNGEON_CHALLENGE_FAILURE_PARAMETERS.negotiationCurrentGoldFraction,
            ));
        const cap = getDungeonGoldReward(floor, "ambush")
          * DUNGEON_CHALLENGE_FAILURE_PARAMETERS.negotiationRegularFightCap;
        goldLost = Math.min(currentGold, proportionalLoss, cap);
        resources.gold = currentGold - goldLost;
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
        trap: "Le piège s'active : l'escouade perd 5 % de ses PV actuels.",
        enigma: `Un contrecoup psychique retire 10 % du mana actuel de ${selected.hero.name}.`,
        ambush: "L'assaut surprise retire 5 % des PV actuels de l'escouade.",
        ritual: `Le rituel instable retire 10 % du mana actuel de ${selected.hero.name}.`,
        obstacle: "Le passage forcé retire 3 % des PV actuels de l'escouade.",
        negotiation: `La négociation échoue et l'escouade perd ${goldLost} or.`,
      };
      log(
        `challenge.${kind}.consequence`,
        failureMessages[kind],
        "defeat",
        {
          goldLost,
          hpLossPercent:
            kind === "trap" || kind === "ambush" ? 5 : kind === "obstacle" ? 3 : 0,
          hpLossBasis: kind === "trap" || kind === "ambush" || kind === "obstacle" ? "current" : null,
          manaLossPercent: kind === "enigma" || kind === "ritual" ? 10 : 0,
          manaLossBasis: kind === "enigma" || kind === "ritual" ? "selected-current" : null,
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
  options: AuthoritativeDungeonResolutionOptions = {},
): AuthoritativeDungeonResolution {
  const floor = Number(source.activeDungeonFloor ?? 1);
  const room = Number(source.activeDungeonRoom ?? 1);
  const xpRewardPolicy = options.xpRewardPolicy ?? CANONICAL_DUNGEON_XP_REWARD_POLICY;
  const challengeDifficultyResolver = options.challengeDifficultyResolver
    ?? getCanonicalDungeonChallengeDifficulty;
  if (!Array.isArray(source.heroes)) throw new Error("INVALID_GAME_STATE");
  for (const [index, hero] of source.heroes.entries()) {
    if (validateAuthoritativeHero(hero, `heroes[${index}]`, options.xpCurve).length > 0) {
      throw new Error("INVALID_GAME_STATE");
    }
  }
  const participantHeroIds = source.currentEncounter?.participantHeroIds;
  const participantHeroIdSet = participantHeroIds ? new Set(participantHeroIds) : null;
  const resolutionSource = participantHeroIdSet
    ? {
        ...source,
        heroes: source.heroes.map((hero) => participantHeroIdSet.has(hero.id)
          ? hero
          : { ...hero, isActive: false }),
      }
    : source;
  const activeHeroes = resolutionSource.heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
  if (activeHeroes.length === 0) throw new Error("NO_ACTIVE_HERO");
  const previousKind = source.encounterHistory?.at(-1)?.kind;
  const excludedType = previousKind && previousKind !== "fight"
    ? previousKind
    : undefined;
  const kind: DungeonEncounterType = isDungeonFinalRoom(floor, room)
    ? "fight"
    : getRandomDungeonEncounterType(rng, excludedType);
  const resolution = kind === "fight"
    ? resolveFight(resolutionSource, floor, room, encounterId, rng, options.xpCurve, xpRewardPolicy)
    : resolveNonFight(
        resolutionSource,
        kind,
        floor,
        room,
        encounterId,
        rng,
        options.xpCurve,
        xpRewardPolicy,
        challengeDifficultyResolver,
      );
  if (!participantHeroIdSet) return resolution;
  const resolvedHeroes = new Map(resolution.state.heroes.map((hero) => [hero.id, hero]));
  return {
    ...resolution,
    state: {
      ...resolution.state,
      heroes: source.heroes.map((hero) => participantHeroIdSet.has(hero.id)
        ? (resolvedHeroes.get(hero.id) ?? hero)
        : hero),
    },
  };
}
