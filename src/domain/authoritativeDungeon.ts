import type {
  DamageType,
  DungeonEncounterType,
  Hero,
  Monster,
  Rarity,
  Resources,
  StoredForgeMaterialStack,
  StoredItemStack,
} from "../types";
import { BOSSES_LIBRARY, ITEM_LIBRARY, MONSTERS_LIBRARY, getSkillById } from "../data/gameData";
import {
  addItemToStorage,
  applyMonsterDefenseOrResistance,
  applySplitDamageDefenseOrResistance,
  getHeroAttributes,
  getHeroMainHandWeapon,
  getWeaponDamageTypes,
  rollWeaponDamage,
} from "../utils/gameCalculations";
import {
  applyLootModifiers,
  getEncounterDetails,
  getRandomDungeonEncounterType,
  rollEncounterForgeMaterial,
  selectBestHeroForEncounter,
} from "../utils/dungeonHelpers";
import type { Rng } from "./random";
import {
  addHeroExperienceDetailed,
  type HeroExperienceResult,
} from "./hero";

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
  rewards: { gold: number; loot: Array<Record<string, unknown>> };
};

export type AuthoritativeDungeonState = Record<string, unknown> & {
  activeDungeonFloor?: number;
  activeDungeonRoom?: number;
  highestFloorReached?: number;
  heroes?: Hero[];
  resources?: Resources;
  buildings?: Record<string, number>;
  storedItems?: StoredItemStack[];
  forgeMaterials?: StoredForgeMaterialStack[];
  autoExplore?: boolean;
};

export type AuthoritativeDungeonResolution = {
  state: AuthoritativeDungeonState;
  encounter: AuthoritativeDungeonEncounter;
};

const clone = <T>(value: T): T => structuredClone(value);

function persistedCombatStats(hero: Hero) {
  const record = hero as unknown as Record<string, unknown>;
  const persisted = (record.calculatedStats ?? {}) as Record<string, unknown>;
  return {
    maxHp: Number(persisted.maxHp ?? record.currentHp ?? 1),
    maxMana: Number(persisted.maxMana ?? record.currentMana ?? 0),
    physicalDamage: Number(persisted.physicalDamage ?? persisted.attack ?? 1),
    magicDamage: Number(persisted.magicDamage ?? 1),
    speed: Number(persisted.speed ?? 0),
    physicalDefense: Number(persisted.physicalDefense ?? 0),
    magicDefense: Number(persisted.magicDefense ?? 0),
    criticalChance: Number(persisted.criticalChance ?? 0),
    dodgeChance: Number(persisted.dodgeChance ?? 0),
    resistances: (persisted.resistances ?? {}) as Record<string, number>,
  };
}

function awardExperience(
  hero: Hero,
  xp: number,
  rng: Rng,
  buildings: Record<string, number>,
): HeroExperienceResult {
  const record = hero as unknown as Record<string, unknown>;
  if (
    !record.baseStats
    || typeof record.level !== "number"
    || typeof record.xp !== "number"
    || typeof record.xpNeeded !== "number"
    || typeof record.classType !== "string"
  ) {
    return { hero, levels: [] };
  }
  return addHeroExperienceDetailed(hero, xp, rng, buildings);
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
  award: HeroExperienceResult,
) {
  log("reward.xp", `${original.name} gagne +${xp} XP.`, "info", {
    heroId: original.id,
    heroName: original.name,
    xp,
  });
  for (const level of award.levels) {
    log(
      "hero.level_up",
      `${original.name} passe niveau ${level}. Sa santé et ses caractéristiques progressent.`,
      "victory",
      { heroId: original.id, heroName: original.name, level },
    );
  }
  if (award.classChange) {
    log(
      "hero.class_changed",
      `${original.name} révèle sa vocation et devient ${award.classChange.to}.`,
      "victory",
      {
        heroId: original.id,
        heroName: original.name,
        previousClass: award.classChange.from,
        classType: award.classChange.to,
        reason: award.classChange.reason,
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
  if (room < 50) {
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
  const boss = room === 50;
  let selected: Omit<Monster, "id" | "hp" | "maxHp">;
  if (boss) {
    if (floor <= 5) selected = BOSSES_LIBRARY[0];
    else if (floor <= 10) selected = BOSSES_LIBRARY[1];
    else if (floor <= 20) selected = BOSSES_LIBRARY[2];
    else if (floor <= 30) selected = BOSSES_LIBRARY[3];
    else selected = BOSSES_LIBRARY[4];
  } else {
    const pool = floor <= 5
      ? MONSTERS_LIBRARY.slice(0, 4)
      : floor <= 15
      ? MONSTERS_LIBRARY.slice(2, 8)
      : floor <= 29
      ? MONSTERS_LIBRARY.slice(6, 12)
      : MONSTERS_LIBRARY.slice(10);
    selected = pool[rng.nextInt(pool.length)];
  }

  const scale = 1 + (floor - 1) * 0.18;
  const maxHp = Math.floor(selected.atk * (selected.isBoss ? 24 : 13) * scale);
  const resistances = Object.fromEntries(Object.entries(selected.resistances ?? {}).map(([key, value]) => [
    key,
    Number(value) > 0 ? Math.min(90, Math.round(Number(value) * scale)) : Number(value),
  ]));

  // The characterized 640f89f behavior consumed a gameplay RNG draw for this visual ID.
  const id = rng.next().toString();
  return {
    ...selected,
    id,
    hp: maxHp,
    maxHp,
    atk: Math.floor(selected.atk * scale),
    def: Math.floor(selected.def * scale),
    magicDef: Math.floor(selected.magicDef * scale),
    resistances,
    xpYield: Math.floor(selected.xpYield * scale),
    goldYield: Math.floor(selected.goldYield * scale),
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
  const transcript: AuthoritativeDungeonTranscriptEvent[] = [];
  const loot: Array<Record<string, unknown>> = [];
  let sequence = 0;
  let round = 0;
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
      const calculatedStats = persistedCombatStats(hero);
      let skillUsed = false;
      let totalDamage = 0;

      for (const skillId of hero.activeSkills ?? []) {
        const skill = getSkillById(skillId);
        if (!skill || skill.type !== "active") continue;
        const manaCost = skill.manaCost ?? 0;
        if (hero.currentMana < manaCost || Number(hero.cooldowns?.[skillId] ?? 0) > 0) continue;
        const effect = skill.effect;

        if (effect.type === "damage") {
          const statValue = Number(calculatedStats[effect.scalingStat as keyof typeof calculatedStats])
            || calculatedStats.physicalDamage
            || 10;
          const damagePerHit = applyMonsterDefenseOrResistance(
            Math.floor(statValue * effect.power),
            effect.damageType,
            monster,
          );
          const damage = damagePerHit * (effect.hitCount || 1);
          const useful = damage >= monster.hp
            || monster.isBoss
            || monster.atk > 45
            || monster.hp > monster.maxHp * 0.55
            || monster.hp > calculatedStats.physicalDamage * 3;
          if (!useful) continue;
          skillUsed = true;
          totalDamage = damage;
          hero.currentMana = Math.max(0, hero.currentMana - manaCost);
          if (skill.cooldownRounds) {
            hero.cooldowns = { ...(hero.cooldowns ?? {}), [skillId]: skill.cooldownRounds };
          }
          log(
            "hero.skill.damage",
            `${hero.name} declenche ${skill.name} et inflige ${damage} degats ${effect.damageType}.`,
            "combat-hero",
            {
              round,
              heroId: hero.id,
              heroName: hero.name,
              monsterId: monster.id,
              monsterName: monster.name,
              skillId,
              skillName: skill.name,
              hitCount: effect.hitCount || 1,
              damage,
              damageType: effect.damageType,
              enemyHp: Math.max(0, monster.hp - damage),
              enemyMaxHp: monster.maxHp,
            },
          );
          break;
        }

        if (effect.type === "heal") {
          const statValue = Number(calculatedStats[effect.scalingStat as keyof typeof calculatedStats])
            || calculatedStats.magicDamage
            || 10;
          const healAmount = Math.floor(statValue * effect.power);
          const living = heroes.filter((candidate) => candidate.isActive && candidate.currentHp > 0);
          if (skill.target === "all_allies") {
            const critical = living.filter((candidate) =>
              candidate.currentHp / candidate.calculatedStats.maxHp < 0.4
            );
            const injured = living.filter((candidate) =>
              candidate.currentHp / candidate.calculatedStats.maxHp < 0.7
            );
            if (critical.length === 0 && injured.length < 2) continue;
            skillUsed = true;
            hero.currentMana = Math.max(0, hero.currentMana - manaCost);
            if (skill.cooldownRounds) {
              hero.cooldowns = { ...(hero.cooldowns ?? {}), [skillId]: skill.cooldownRounds };
            }
            for (const target of living) {
              const index = heroes.findIndex((candidate) => candidate.id === target.id);
              const actual = Math.min(
                heroes[index].calculatedStats.maxHp - heroes[index].currentHp,
                healAmount,
              );
              heroes[index].currentHp = Math.min(
                heroes[index].calculatedStats.maxHp,
                heroes[index].currentHp + healAmount,
              );
              if (actual > 0) {
                log(
                  "hero.skill.heal",
                  `${hero.name} utilise ${skill.name} et soigne ${target.name} de ${actual} PV.`,
                  "combat-hero",
                  {
                    round,
                    heroId: hero.id,
                    heroName: hero.name,
                    targetHeroId: target.id,
                    targetHeroName: target.name,
                    skillId,
                    skillName: skill.name,
                    healing: actual,
                    heroHp: heroes[index].currentHp,
                    heroMaxHp: heroes[index].calculatedStats.maxHp,
                  },
                );
              }
            }
            break;
          }

          const target = living.reduce((lowest, candidate) =>
            candidate.currentHp / candidate.calculatedStats.maxHp
              < lowest.currentHp / lowest.calculatedStats.maxHp
              ? candidate
              : lowest
          );
          const missing = target.calculatedStats.maxHp - target.currentHp;
          const fraction = target.currentHp / target.calculatedStats.maxHp;
          if (!(fraction < 0.4 || (fraction < 0.7 && missing >= healAmount * 0.4))) continue;
          skillUsed = true;
          hero.currentMana = Math.max(0, hero.currentMana - manaCost);
          if (skill.cooldownRounds) {
            hero.cooldowns = { ...(hero.cooldowns ?? {}), [skillId]: skill.cooldownRounds };
          }
          const targetIndex = heroes.findIndex((candidate) => candidate.id === target.id);
          const actual = Math.min(missing, healAmount);
          heroes[targetIndex].currentHp = Math.min(
            heroes[targetIndex].calculatedStats.maxHp,
            heroes[targetIndex].currentHp + healAmount,
          );
          log(
            "hero.skill.heal",
            `${hero.name} utilise ${skill.name} sur ${target.name} et soigne ${actual} PV.`,
            "combat-hero",
            {
              round,
              heroId: hero.id,
              heroName: hero.name,
              targetHeroId: target.id,
              targetHeroName: target.name,
              skillId,
              skillName: skill.name,
              healing: actual,
              heroHp: heroes[targetIndex].currentHp,
              heroMaxHp: heroes[targetIndex].calculatedStats.maxHp,
            },
          );
          break;
        }

        if (effect.type === "buff" || effect.type === "debuff") {
          const useful = monster.isBoss
            || monster.atk > 45
            || monster.hp > monster.maxHp * 0.6
            || monster.hp > calculatedStats.physicalDamage * 3;
          if (!useful) continue;
          skillUsed = true;
          hero.currentMana = Math.max(0, hero.currentMana - manaCost);
          if (skill.cooldownRounds) {
            hero.cooldowns = { ...(hero.cooldowns ?? {}), [skillId]: skill.cooldownRounds };
          }
          // Characterized behavior only logged these effects; no modifier was applied.
          log(
            `hero.skill.${effect.type}`,
            `${hero.name} utilise ${skill.name} (${effect.type}).`,
            "combat-hero",
            {
              round,
              heroId: hero.id,
              heroName: hero.name,
              monsterId: monster.id,
              monsterName: monster.name,
              skillId,
              skillName: skill.name,
              durationRounds: effect.durationRounds,
              modifiers: effect.modifiers,
            },
          );
          break;
        }
      }

      if (!skillUsed) {
        const weapon = getHeroMainHandWeapon(hero);
        const attackSpeed = weapon?.attackSpeed ?? 1;
        let strikes = 1;
        let remainingChance = Math.max(0, (attackSpeed - 1) * 100 + calculatedStats.speed);
        while (remainingChance > 0 && strikes < 3) {
          if (remainingChance >= 100) {
            strikes += 1;
            remainingChance -= 100;
          } else {
            if (rng.next() < remainingChance / 100) strikes += 1;
            break;
          }
        }

        for (let strike = 1; strike <= strikes; strike += 1) {
          const weaponDamage = rollWeaponDamage(weapon, rng);
          const rawDamage = calculatedStats.physicalDamage + weaponDamage;
          const critical = rng.next() < calculatedStats.criticalChance / 100;
          const criticalDamage = critical ? Math.floor(rawDamage * 1.5) : rawDamage;
          const damageTypes = weapon && getWeaponDamageTypes(weapon).length > 0
            ? getWeaponDamageTypes(weapon)
            : ["physical" as DamageType];
          const damage = applySplitDamageDefenseOrResistance(criticalDamage, damageTypes, monster);
          totalDamage += damage;
          const nextHp = Math.max(0, monster.hp - totalDamage);
          log(
            critical ? "hero.hit.critical" : "hero.hit",
            `${hero.name} inflige ${damage} degats a ${monster.name}.`,
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
            },
          );
        }
      }

      monster = { ...monster, hp: Math.max(0, monster.hp - totalDamage) };
      heroes[heroIndex] = hero;
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

    let strikes = 1;
    if (monster.isBoss) {
      if (floor >= 30) strikes = 3;
      else if (floor >= 10) strikes = rng.next() < 0.4 ? 3 : 2;
      else strikes = 2;
    } else {
      const chance = Math.min(0.5, (floor - 1) * 0.015);
      if (rng.next() < chance) strikes = 2;
    }

    for (let strike = 1; strike <= strikes; strike += 1) {
      const living = heroes.filter((hero) => hero.isActive && hero.currentHp > 0);
      if (living.length === 0) break;
      const target = living[rng.nextInt(living.length)];
      const targetIndex = heroes.findIndex((hero) => hero.id === target.id);
      const targetStats = persistedCombatStats(target);
      const defense = monster.damageType === "physical"
        ? targetStats.physicalDefense
        : targetStats.magicDefense;
      const damage = Math.max(1, monster.atk - defense);
      const dodged = rng.next() < targetStats.dodgeChance / 100;
      if (dodged) {
        log(
          "enemy.dodged",
          `${target.name} esquive l'attaque de ${monster.name}.`,
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
          ? `${target.name} s'ecroule et retourne aux dortoirs.`
          : `${monster.name} inflige ${damage} degats a ${target.name}.`,
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
          heroHp: hp,
          heroMaxHp: targetStats.maxHp,
        },
      );
    }
  }

  const victory = monster.hp === 0;
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
    const baseGold = Math.floor(monster.goldYield * goblinBonus * leaderBonus);
    const gold = Math.floor(applyLootModifiers("goldGain", baseGold, heroes));
    resources.gold = Number(resources.gold ?? 0) + gold;
    log("reward.gold", `+${gold} or.`, "loot", { gold });

    if (rng.next() < 0.35) {
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
      const share = eligibleCount > 0 ? monster.xpYield / eligibleCount : 0;
      const xp = Math.round(share * (hero.race === "Humain" ? 1.15 : 1));
      const award = awardExperience(hero, xp, rng, source.buildings ?? {});
      logExperienceAward(log, hero, xp, award);
      return award.hero;
    });
    if (room === 50) {
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
      forgeMaterials,
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
  const storedItems = clone(source.storedItems ?? []);
  let forgeMaterials = clone(source.forgeMaterials ?? []);
  const transcript: AuthoritativeDungeonTranscriptEvent[] = [];
  const loot: Array<Record<string, unknown>> = [];
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
      goldReward = Math.max(1, Math.round(floor * 5));
      resources.gold = Number(resources.gold ?? 0) + goldReward;
      log("reward.gold", `+${goldReward} or.`, "loot", { gold: goldReward });
    } else if (ITEM_LIBRARY.length > 0) {
      const item = ITEM_LIBRARY[rng.nextInt(ITEM_LIBRARY.length)];
      addItemToStorage(storedItems, item.id, "rare", 1);
      loot.push({ type: "item", itemId: item.id, rarity: "rare", count: 1 });
      log("reward.item", `${item.name} [Rare] obtenu.`, "loot", {
        itemId: item.id,
        itemName: item.name,
        rarity: "rare",
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
      const award = awardExperience(hero, xp, rng, source.buildings ?? {});
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
      const maxMana = hero.calculatedStats.maxMana || 20;
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
      const award = awardExperience(hero, xp, rng, source.buildings ?? {});
      logExperienceAward(log, hero, xp, award);
      return award.hero;
    });
  } else {
    const details = getEncounterDetails(kind);
    if (!details) throw new Error("UNSUPPORTED_DUNGEON_ENCOUNTER");
    const selected = selectBestHeroForEncounter(active(), details.statA, details.statB);
    if (!selected) throw new Error("NO_ACTIVE_HERO");
    const attributes = getHeroAttributes(selected.bestHero);
    const challengeHeroesBefore = clone(heroes);
    const luck = attributes.luk || 1;
    const luckRoll = rng.nextInt(Math.max(1, luck)) + 1;
    const difficulty = 10 + floor * 2;
    victory = luckRoll + selected.bestScore >= difficulty;
    log(
      "encounter.started",
      `La chambre ${room} impose l'épreuve « ${details.name} ». ${details.desc}`,
      "info",
      {
        encounterName: details.name,
        description: details.desc,
      },
    );
    log(
      "challenge.hero_selected",
      `${selected.bestHero.name} est le héros le plus qualifié (score ${selected.bestScore}).`,
      "info",
      {
        heroId: selected.bestHero.id,
        heroName: selected.bestHero.name,
        score: selected.bestScore,
        primaryStat: details.statA,
        secondaryStat: details.statB,
      },
    );
    log(
      "challenge.attempted",
      `${selected.bestHero.name} prend les devants et tente de surmonter l'épreuve.`,
      "info",
      {
        heroId: selected.bestHero.id,
        heroName: selected.bestHero.name,
        score: selected.bestScore,
        luckRoll,
        difficulty,
      },
    );

    if (victory) {
      if (kind === "enigma") {
        goldReward = Math.round(25 * (1 + (floor - 1) * 0.18));
        heroes = heroes.map((hero) => hero.isActive && hero.currentHp > 0
          ? {
              ...hero,
              currentMana: Math.min(
                hero.calculatedStats.maxMana || 20,
                hero.currentMana + 15,
              ),
            }
          : hero);
      } else if (kind === "ambush") {
        goldReward = Math.round(15 * (1 + (floor - 1) * 0.15));
      } else if (kind === "ritual") {
        heroes = heroes.map((hero) => {
          if (!hero.isActive || hero.currentHp <= 0) return hero;
          const maxMana = hero.calculatedStats.maxMana || 20;
          return {
            ...hero,
            currentMana: Math.min(maxMana, hero.currentMana + Math.max(15, Math.round(maxMana * 0.2))),
          };
        });
      } else if (kind === "negotiation") {
        goldReward = Math.round(35 * (1 + (floor - 1) * 0.2));
      }
      resources.gold = Number(resources.gold ?? 0) + goldReward;
      log("challenge.succeeded", `Réussite : ${luckRoll} + ${selected.bestScore} ≥ ${difficulty}.`, "victory", {
        heroId: selected.bestHero.id,
        heroName: selected.bestHero.name,
        luckRoll,
        score: selected.bestScore,
        difficulty,
      });
      const successMessages: Record<Exclude<DungeonEncounterType, "fight" | "treasure" | "rest">, string> = {
        trap: `${selected.bestHero.name} désamorce le piège et sécurise la voie.`,
        enigma: `${selected.bestHero.name} décrypte l'énigme et restaure l'énergie du groupe.`,
        ambush: `${selected.bestHero.name} évente l'embuscade et contourne le danger.`,
        ritual: `${selected.bestHero.name} harmonise le rituel runique.`,
        obstacle: `${selected.bestHero.name} détruit l'obstacle et ouvre la voie.`,
        negotiation: `${selected.bestHero.name} négocie un accord pacifique.`,
      };
      log(
        `challenge.${kind}.resolved`,
        successMessages[kind],
        "victory",
        {
          heroId: selected.bestHero.id,
          heroName: selected.bestHero.name,
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
        if (hero.id !== selected.bestHero.id) return hero;
        const award = awardExperience(hero, xp, rng, source.buildings ?? {});
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
      log("challenge.failed", `Échec : ${luckRoll} + ${selected.bestScore} < ${difficulty}.`, "defeat", {
        heroId: selected.bestHero.id,
        heroName: selected.bestHero.name,
        luckRoll,
        score: selected.bestScore,
        difficulty,
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
  const activeHeroes = (source.heroes ?? []).filter((hero) => hero.isActive && hero.currentHp > 0);
  if (activeHeroes.length === 0) throw new Error("NO_ACTIVE_HERO");
  const kind: DungeonEncounterType = room === 50 ? "fight" : getRandomDungeonEncounterType(rng);
  return kind === "fight"
    ? resolveFight(source, floor, room, encounterId, rng)
    : resolveNonFight(source, kind, floor, room, encounterId, rng);
}
