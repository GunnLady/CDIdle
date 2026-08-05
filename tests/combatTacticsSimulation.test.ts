import { describe, expect, it } from "vitest";
import { CLASS_INFO_LIST } from "../src/data/heroes";
import { getSkillById } from "../src/data/skills";
import {
  chooseHeroAction,
  listLegalHeroActions,
  type HeroActionContext,
} from "../src/domain/combatTactics";
import {
  resolveAuthoritativeDungeonEncounter,
  type AuthoritativeDungeonState,
} from "../src/domain/authoritativeDungeon";
import { seededRng } from "../src/domain/random";
import type { ClassInfo, Hero, Monster } from "../src/types";
import { getDungeonRoomCount } from "../shared/domain/dungeon-progression";
import { calculateXpNeeded } from "../src/utils/gameCalculations";
import { makeHero, makeResources } from "./fixtures/game";
import { initialTownState } from "../supabase/functions/game-api/town-authority";

const combatClasses = CLASS_INFO_LIST.filter((entry) => entry.tier === 1);

function pairs(values: string[]): string[][] {
  return values.flatMap((value, index) => (
    values.slice(index + 1).map((other) => [value, other])
  ));
}

function actualActiveSkillLoadouts(classInfo: ClassInfo): string[][] {
  if (classInfo.type === "Mage") return pairs(classInfo.activeSkills);
  if (classInfo.type === "Acolyte") {
    return classInfo.activeSkills.map((skillId) => ["minor_heal", skillId]);
  }
  return classInfo.activeSkills.map((skillId) => [skillId]);
}

function simulatedHero(classInfo: ClassInfo, index: number): Hero {
  const maxHp = 420 + index * 17;
  const maxMana = 180 + index * 11;
  const magicDefense = 18 + index;
  const baseCalculatedStats = makeHero().calculatedStats;
  return makeHero({
    id: `simulation-${classInfo.type}-${index}`,
    name: `${classInfo.name} simulation`,
    classType: classInfo.type,
    level: 50,
    xpNeeded: calculateXpNeeded(51, classInfo.type),
    activeSkills: [...classInfo.activeSkills],
    passiveSkills: [...classInfo.passiveSkills],
    currentHp: maxHp,
    currentMana: maxMana,
    calculatedStats: {
      ...baseCalculatedStats,
      maxHp,
      hp: maxHp,
      maxMana,
      mana: maxMana,
      physicalDamage: 65 + index * 5,
      magicDamage: 65 + (combatClasses.length - index) * 5,
      physicalDefense: 18 + index,
      magicDefense,
      speed: 20 + index,
      criticalChance: 8 + index,
      dodgeChance: 3 + index / 2,
      resistances: Object.fromEntries(
        Object.keys(baseCalculatedStats.resistances).map((type) => [type, magicDefense]),
      ) as Hero["calculatedStats"]["resistances"],
    },
  });
}

function simulatedMonster(index: number): Monster {
  return {
    id: `simulation-monster-${index}`,
    name: `Menace simulation ${index}`,
    hp: 120 + index * 35,
    maxHp: 120 + index * 35,
    atk: 20 + index * 4,
    damageType: index % 2 === 0 ? "physical" : "arcane",
    def: index * 3,
    magicDef: (8 - index) * 3,
    resistances: index % 3 === 0 ? { fire: 70, earth: 0 } : undefined,
    xpYield: 0,
    goldYield: 0,
    image: "",
    isBoss: index % 4 === 0,
  };
}

function authoritativeState(
  party: Hero[],
  floor: number,
): AuthoritativeDungeonState {
  return {
    ...initialTownState(42),
    activeDungeonFloor: floor,
    activeDungeonRoom: getDungeonRoomCount(floor),
    highestFloorReached: floor + 1,
    resources: makeResources({ gold: 0 }),
    buildings: {},
    heroes: party,
    storedItems: [],
    forgeMaterials: [],
    autoExplore: false,
  };
}

describe("deterministic combat simulation campaign", () => {
  it("keeps every T1 tactical decision legal and deterministic across a broad matrix", () => {
    let simulatedDecisions = 0;
    const supportUsage = new Map<string, number>();
    const supportMetrics = new Map<string, {
      decisions: number;
      castable: number;
      legal: number;
      selected: number;
      healingSelected: number;
      selectedSkills: Record<string, number>;
      selectedReasons: Record<string, number>;
      alternativesWhenLegal: Record<string, number>;
    }>();

    combatClasses.forEach((classInfo, classIndex) => {
      [0, 35, 100].forEach((manaPercent) => {
        [15, 55, 100].forEach((hpPercent) => {
          [1, 5, 10].forEach((room) => {
            [0, 1].forEach((monsterVariant) => {
              const actor = simulatedHero(classInfo, classIndex);
              actor.currentMana = Math.floor(actor.calculatedStats.maxMana * manaPercent / 100);
              actor.currentHp = Math.max(1, Math.floor(actor.calculatedStats.maxHp * hpPercent / 100));
              const allies = [1, 2, 3].map((offset) => simulatedHero(
                combatClasses[(classIndex + offset) % combatClasses.length],
                classIndex + 20 + offset,
              ));
              allies.forEach((ally) => {
                ally.currentHp = Math.max(1, Math.floor(ally.calculatedStats.maxHp * hpPercent / 100));
              });
              const baseMonster = simulatedMonster(classIndex + monsterVariant);
              const monster = monsterVariant === 0
                ? baseMonster
                : {
                    ...baseMonster,
                    hp: baseMonster.hp * 8,
                    maxHp: baseMonster.maxHp * 8,
                    atk: baseMonster.atk * 4,
                    isBoss: false,
                  };
              const context: HeroActionContext = {
                hero: actor,
                heroes: [actor, ...allies],
                monster,
                floor: 10,
                room,
                finalRoom: 10,
                round: 1,
              };
              const before = structuredClone(context);
              const legalActions = listLegalHeroActions(context);
              const first = chooseHeroAction(context);
              const second = chooseHeroAction(structuredClone(context));
              const supportSkills = actor.activeSkills
                .map(getSkillById)
                .filter((skill) => skill?.type === "active"
                  && (skill.effect.type === "buff" || skill.effect.type === "debuff"));
              if (supportSkills.length > 0) {
                const metrics = supportMetrics.get(actor.classType) ?? {
                  decisions: 0,
                  castable: 0,
                  legal: 0,
                  selected: 0,
                  healingSelected: 0,
                  selectedSkills: {},
                  selectedReasons: {},
                  alternativesWhenLegal: {},
                };
                const legalSupport = legalActions.some((candidate) => {
                  const skill = getSkillById(candidate.skillId ?? "");
                  return skill?.effect.type === "buff" || skill?.effect.type === "debuff";
                });
                const selectedSkill = getSkillById(first.skillId ?? "");
                const selectedSupport = selectedSkill?.effect.type === "buff"
                  || selectedSkill?.effect.type === "debuff";
                metrics.decisions += 1;
                if (supportSkills.some((skill) => actor.currentMana >= (skill?.manaCost ?? 0))) {
                  metrics.castable += 1;
                }
                if (legalSupport) metrics.legal += 1;
                if (selectedSupport) {
                  metrics.selected += 1;
                  metrics.selectedSkills[first.skillId ?? "unknown"] = (
                    metrics.selectedSkills[first.skillId ?? "unknown"] ?? 0
                  ) + 1;
                  metrics.selectedReasons[first.reason] = (metrics.selectedReasons[first.reason] ?? 0) + 1;
                }
                if (legalSupport && !selectedSupport) {
                  const alternative = [
                    selectedSkill?.effect.type ?? first.kind,
                    first.skillId ?? "normal_attack",
                    first.reason,
                  ].join(":");
                  metrics.alternativesWhenLegal[alternative] = (
                    metrics.alternativesWhenLegal[alternative] ?? 0
                  ) + 1;
                }
                if (selectedSkill?.effect.type === "heal") metrics.healingSelected += 1;
                supportMetrics.set(actor.classType, metrics);
              }

              expect(first, `${classInfo.type}:${manaPercent}:${hpPercent}:${room}`).toEqual(second);
              expect(context).toEqual(before);
              expect(legalActions).toContainEqual(first);
              expect(Number.isFinite(first.value)).toBe(true);
              expect(Number.isFinite(first.efficiency)).toBe(true);
              if (first.kind === "skill") {
                expect(actor.activeSkills).toContain(first.skillId);
                const skill = getSkillById(first.skillId ?? "");
                expect(skill?.type).toBe("active");
                expect(actor.currentMana).toBeGreaterThanOrEqual(skill?.manaCost ?? 0);
                expect(Number(actor.cooldowns?.[first.skillId ?? ""] ?? 0)).toBe(0);
                if (skill?.effect.type === "buff" || skill?.effect.type === "debuff") {
                  supportUsage.set(actor.classType, (supportUsage.get(actor.classType) ?? 0) + 1);
                }
              }
              if (first.targetHeroId) {
                expect(context.heroes).toContainEqual(expect.objectContaining({
                  id: first.targetHeroId,
                  isActive: true,
                }));
                expect(context.heroes.find((hero) => hero.id === first.targetHeroId)?.currentHp)
                  .toBeGreaterThan(0);
              }
              simulatedDecisions += 1;
            });
          });
        });
      });
    });

    expect(simulatedDecisions).toBe(combatClasses.length * 54);
    expect(Object.fromEntries([...supportUsage.entries()].sort())).toEqual({
      Acolyte: 18,
      Artificier: 18,
      "Aède": 4,
      Druide: 6,
    });
    expect({
      "Aède": supportMetrics.get("Aède"),
      Druide: supportMetrics.get("Druide"),
    }).toEqual({
      "Aède": {
        alternativesWhenLegal: { "heal:soothing_song:group_stabilization": 8 },
        castable: 36,
        decisions: 54,
        healingSelected: 16,
        legal: 12,
        selected: 4,
        selectedReasons: { useful_combat_buff: 4 },
        selectedSkills: { inspiring_song: 4 },
      },
      Druide: {
        alternativesWhenLegal: { "heal:wild_regrowth:ally_stabilization": 12 },
        castable: 36,
        decisions: 54,
        healingSelected: 24,
        legal: 18,
        selected: 6,
        selectedReasons: { useful_combat_debuff: 6 },
        selectedSkills: { thorn_grasp: 6 },
      },
    });
    ["Aède", "Druide"].forEach((classType) => {
      const metrics = supportMetrics.get(classType);
      if (!metrics) throw new Error(`Missing support metrics for ${classType}`);
      const deferredToHealing = Object.entries(metrics.alternativesWhenLegal)
        .filter(([alternative]) => alternative.startsWith("heal:"))
        .reduce((total, [, count]) => total + count, 0);
      const opportunitiesWithoutHigherPriority = metrics.legal - deferredToHealing;
      expect(opportunitiesWithoutHigherPriority, classType).toBeGreaterThan(0);
      expect(metrics.selected / opportunitiesWithoutHigherPriority, classType)
        .toBeGreaterThanOrEqual(0.6);
    });
  });

  it("measures every active skill through every authoritative class loadout", () => {
    const elementalTypes = ["fire", "ice", "water", "earth", "wind", "lightning"] as const;
    const elementalProfiles = elementalTypes.map((openType) => ({
      id: `element-${openType}`,
      party: "magic" as const,
      actorHpPercent: 100,
      allyHpPercent: 100,
      actorPhysicalDefense: 60,
      actorMagicDefense: 60,
      allyPhysicalDefense: 60,
      allyMagicDefense: 60,
      monster: {
        ...simulatedMonster(2),
        id: `element-${openType}`,
        hp: 3_000,
        maxHp: 3_000,
        atk: 80,
        damageType: "arcane" as const,
        def: 20,
        isBoss: false,
        resistances: Object.fromEntries(elementalTypes.map((type) => [
          type,
          type === openType ? 0 : 90,
        ])),
      },
    }));
    const profiles = [
      {
        id: "short",
        party: "balanced" as const,
        actorHpPercent: 100,
        allyHpPercent: 100,
        actorPhysicalDefense: 60,
        actorMagicDefense: 60,
        allyPhysicalDefense: 60,
        allyMagicDefense: 60,
        monster: { ...simulatedMonster(0), hp: 30, maxHp: 30, atk: 20, def: 0, isBoss: false },
      },
      {
        id: "physical-offense",
        party: "physical" as const,
        actorHpPercent: 100,
        allyHpPercent: 100,
        actorPhysicalDefense: 60,
        actorMagicDefense: 60,
        allyPhysicalDefense: 60,
        allyMagicDefense: 60,
        monster: { ...simulatedMonster(0), hp: 3_000, maxHp: 3_000, atk: 80, def: 0, isBoss: false },
      },
      {
        id: "physical-armored",
        party: "physical" as const,
        actorHpPercent: 100,
        allyHpPercent: 100,
        actorPhysicalDefense: 100,
        actorMagicDefense: 60,
        allyPhysicalDefense: 100,
        allyMagicDefense: 60,
        monster: { ...simulatedMonster(0), hp: 3_000, maxHp: 3_000, atk: 280, def: 140, isBoss: false },
      },
      {
        id: "magical-threat",
        party: "magic" as const,
        actorHpPercent: 100,
        allyHpPercent: 100,
        actorPhysicalDefense: 60,
        actorMagicDefense: 100,
        allyPhysicalDefense: 60,
        allyMagicDefense: 100,
        monster: {
          ...simulatedMonster(1), hp: 3_000, maxHp: 3_000, atk: 280,
          damageType: "arcane" as const, def: 20, isBoss: false,
        },
      },
      {
        id: "wounded-party",
        party: "balanced" as const,
        actorHpPercent: 55,
        allyHpPercent: 30,
        actorPhysicalDefense: 60,
        actorMagicDefense: 60,
        allyPhysicalDefense: 60,
        allyMagicDefense: 60,
        monster: { ...simulatedMonster(0), hp: 3_000, maxHp: 3_000, atk: 80, def: 20, isBoss: false },
      },
      {
        id: "fragile-ally",
        party: "balanced" as const,
        actorHpPercent: 100,
        allyHpPercent: 5,
        actorPhysicalDefense: 120,
        actorMagicDefense: 120,
        allyPhysicalDefense: 0,
        allyMagicDefense: 0,
        monster: { ...simulatedMonster(0), hp: 3_000, maxHp: 3_000, atk: 280, def: 100, isBoss: false },
      },
      ...elementalProfiles,
    ];
    const report = new Map<string, {
      classType: string;
      equipped: number;
      castable: number;
      legal: number;
      selected: number;
      replacements: Record<string, number>;
    }>();
    const loadouts = CLASS_INFO_LIST.flatMap((classInfo) => (
      actualActiveSkillLoadouts(classInfo).map((activeSkills) => ({ classInfo, activeSkills }))
    ));

    loadouts.forEach(({ classInfo, activeSkills }, loadoutIndex) => {
      profiles.forEach((profile) => {
        [35, 100].forEach((manaPercent) => {
          [2, 10].forEach((room) => {
            const classIndex = CLASS_INFO_LIST.findIndex((entry) => entry.type === classInfo.type);
            const actor = simulatedHero(classInfo, classIndex);
            actor.id = `catalog-${classInfo.type}-${loadoutIndex}`;
            actor.activeSkills = [...activeSkills];
            actor.currentMana = Math.floor(actor.calculatedStats.maxMana * manaPercent / 100);
            actor.currentHp = Math.max(1, Math.floor(
              actor.calculatedStats.maxHp * profile.actorHpPercent / 100,
            ));
            actor.calculatedStats = {
              ...actor.calculatedStats,
              physicalDefense: profile.actorPhysicalDefense,
              magicDefense: profile.actorMagicDefense,
              resistances: Object.fromEntries(
                Object.keys(actor.calculatedStats.resistances)
                  .map((type) => [type, profile.actorMagicDefense]),
              ) as Hero["calculatedStats"]["resistances"],
            };
            const allies = [1, 2, 3].map((offset) => {
              const ally = simulatedHero(
                combatClasses[(loadoutIndex + offset) % combatClasses.length],
                (loadoutIndex + offset) % combatClasses.length,
              );
              ally.id = `catalog-ally-${loadoutIndex}-${offset}`;
              const physicalDamage = profile.party === "physical" ? 200 : profile.party === "magic" ? 40 : 120;
              const magicDamage = profile.party === "magic" ? 200 : profile.party === "physical" ? 40 : 120;
              return {
                ...ally,
                currentHp: Math.max(1, Math.floor(
                  ally.calculatedStats.maxHp * profile.allyHpPercent / 100,
                )),
                calculatedStats: {
                  ...ally.calculatedStats,
                  physicalDamage,
                  magicDamage,
                  physicalDefense: profile.allyPhysicalDefense,
                  magicDefense: profile.allyMagicDefense,
                  resistances: Object.fromEntries(
                    Object.keys(ally.calculatedStats.resistances)
                      .map((type) => [type, profile.allyMagicDefense]),
                  ) as Hero["calculatedStats"]["resistances"],
                },
              };
            });
            const actionContext: HeroActionContext = {
              hero: actor,
              heroes: [actor, ...allies],
              monster: profile.monster,
              floor: 10,
              room,
              finalRoom: 10,
              round: 1,
            };
            const legalActions = listLegalHeroActions(actionContext);
            const chosen = chooseHeroAction(actionContext);

            activeSkills.forEach((skillId) => {
              const skill = getSkillById(skillId);
              if (!skill || skill.type !== "active") throw new Error(`Invalid loadout skill ${skillId}`);
              const metrics = report.get(skillId) ?? {
                classType: classInfo.type,
                equipped: 0,
                castable: 0,
                legal: 0,
                selected: 0,
                replacements: {},
              };
              const castable = actor.currentMana >= (skill.manaCost ?? 0);
              const legal = legalActions.some((action) => action.skillId === skillId);
              metrics.equipped += 1;
              if (castable) metrics.castable += 1;
              if (legal) metrics.legal += 1;
              if (chosen.skillId === skillId) {
                metrics.selected += 1;
              } else if (legal) {
                const replacement = chosen.skillId ?? chosen.kind;
                metrics.replacements[replacement] = (metrics.replacements[replacement] ?? 0) + 1;
              }
              report.set(skillId, metrics);
            });
          });
        });
      });
    });

    const catalogActiveSkills = [...new Set(CLASS_INFO_LIST.flatMap((classInfo) => classInfo.activeSkills))]
      .concat("minor_heal")
      .filter((skillId, index, values) => values.indexOf(skillId) === index)
      .sort();
    expect(loadouts).toHaveLength(44);
    expect([...report.keys()].sort()).toEqual(catalogActiveSkills);
    expect({
      neverLegal: [...report.entries()].filter(([, metrics]) => metrics.legal === 0).map(([skillId]) => skillId),
      neverSelected: [...report.entries()].filter(([, metrics]) => metrics.selected === 0).map(([skillId]) => skillId),
    }).toEqual({
      neverLegal: ["cleaving_strike"],
      neverSelected: ["cleaving_strike", "wind_blade", "holy_mark"],
    });
    expect(Object.fromEntries(["cleaving_strike", "holy_mark", "static_trap"].map((skillId) => [
      skillId,
      report.get(skillId),
    ]))).toEqual({
      cleaving_strike: {
        castable: 48, classType: "Guerrier", equipped: 48, legal: 0, replacements: {}, selected: 0,
      },
      holy_mark: {
        castable: 48, classType: "Acolyte", equipped: 48, legal: 36,
        replacements: { minor_heal: 8, normal_attack: 28 }, selected: 0,
      },
      static_trap: {
        castable: 48, classType: "Artificier", equipped: 48, legal: 36,
        replacements: { normal_attack: 34 }, selected: 2,
      },
    });
    expect(Object.fromEntries([...report.entries()].sort().map(([skillId, metrics]) => [
      skillId,
      { legal: metrics.legal, selected: metrics.selected },
    ]))).toEqual({
      barkskin: { legal: 44, selected: 8 },
      battle_focus: { legal: 44, selected: 8 },
      benediction: { legal: 44, selected: 32 },
      blinding_dust: { legal: 44, selected: 12 },
      cleaving_strike: { legal: 0, selected: 0 },
      crippling_shot: { legal: 44, selected: 8 },
      discordant_chord: { legal: 44, selected: 12 },
      double_cut: { legal: 36, selected: 36 },
      earthen_fist: { legal: 40, selected: 40 },
      fire_bolt: { legal: 220, selected: 136 },
      flame_thrower: { legal: 8, selected: 8 },
      guard_stance: { legal: 16, selected: 8 },
      heavy_blow: { legal: 40, selected: 40 },
      holy_mark: { legal: 36, selected: 0 },
      holy_smite: { legal: 8, selected: 4 },
      ice_shard: { legal: 220, selected: 144 },
      inspiring_song: { legal: 44, selected: 44 },
      lightning_arc: { legal: 40, selected: 40 },
      lightning_bolt: { legal: 220, selected: 220 },
      minor_heal: { legal: 32, selected: 32 },
      overcharged_core: { legal: 44, selected: 36 },
      piercing_arrow: { legal: 44, selected: 44 },
      precise_shot: { legal: 36, selected: 36 },
      provocation: { legal: 4, selected: 4 },
      quick_shiv: { legal: 4, selected: 4 },
      rapid_combo: { legal: 40, selected: 40 },
      sacred_barrier: { legal: 44, selected: 4 },
      soothing_song: { legal: 7, selected: 7 },
      static_trap: { legal: 36, selected: 2 },
      stone_spike: { legal: 220, selected: 108 },
      thorn_grasp: { legal: 44, selected: 12 },
      water_lance: { legal: 220, selected: 52 },
      weakening_shout: { legal: 16, selected: 8 },
      wild_regrowth: { legal: 8, selected: 8 },
      wind_blade: { legal: 200, selected: 0 },
      zephyr_strike: { legal: 44, selected: 44 },
    });
  });

  it("rechecks apparent first-turn dominance across complete authoritative rotations", () => {
    const classByType = new Map(combatClasses.map((classInfo) => [classInfo.type, classInfo]));
    const loadouts = CLASS_INFO_LIST.flatMap((classInfo) => (
      actualActiveSkillLoadouts(classInfo).map((activeSkills) => ({ classInfo, activeSkills }))
    ));
    const report = new Map<string, {
      equippedEncounters: number;
      selectedEncounters: number;
      uses: number;
      latestRound: number;
    }>();

    const rotationHero = (
      classInfo: ClassInfo,
      id: string,
      activeSkills: string[],
      profile: "physical" | "magic",
    ) => {
      const classIndex = CLASS_INFO_LIST.findIndex((entry) => entry.type === classInfo.type);
      const result = simulatedHero(classInfo, classIndex);
      const physicalDamage = profile === "physical" ? 80 : 45;
      const magicDamage = profile === "magic" ? 80 : 45;
      return {
        ...result,
        id,
        activeSkills,
        currentHp: 5_000,
        currentMana: 500,
        calculatedStats: {
          ...result.calculatedStats,
          maxHp: 5_000,
          hp: 5_000,
          maxMana: 500,
          mana: 500,
          physicalDamage,
          magicDamage,
          physicalDefense: 500,
          magicDefense: 500,
          resistances: Object.fromEntries(
            Object.keys(result.calculatedStats.resistances).map((type) => [type, 500]),
          ) as Hero["calculatedStats"]["resistances"],
        },
      };
    };

    loadouts.forEach(({ classInfo, activeSkills }, loadoutIndex) => {
      (["physical", "magic"] as const).forEach((profile, profileIndex) => {
        [0, 1].forEach((seedIndex) => {
          const focalId = `rotation-focal-${loadoutIndex}-${profile}-${seedIndex}`;
          const focal = rotationHero(classInfo, focalId, [...activeSkills], profile);
          const allyClasses: ClassInfo["type"][] = profile === "magic"
            ? ["Mage", "Mage", "Mage"]
            : ["Voleur", "Archer", "Pugiliste"];
          const allySkills = profile === "magic"
            ? [["fire_bolt"], ["ice_shard"], ["lightning_bolt"]]
            : [["double_cut"], ["piercing_arrow"], ["rapid_combo"]];
          const allies = allyClasses.map((allyClassType, allyIndex) => {
            const allyClass = classByType.get(allyClassType);
            if (!allyClass) throw new Error(`Missing rotation class ${allyClassType}`);
            return rotationHero(
              allyClass,
              `rotation-ally-${loadoutIndex}-${profileIndex}-${seedIndex}-${allyIndex}`,
              allySkills[allyIndex],
              profile,
            );
          });
          const encounter = resolveAuthoritativeDungeonEncounter(
            authoritativeState([focal, ...allies], 30),
            `rotation-${loadoutIndex}-${profileIndex}-${seedIndex}`,
            seededRng(0x740000 + loadoutIndex * 100 + profileIndex * 10 + seedIndex),
          ).encounter;
          const focalSkillEvents = encounter.transcript.filter((event) => (
            event.heroId === focalId
            && event.type.startsWith("hero.skill.")
            && typeof event.skillId === "string"
          ));

          activeSkills.forEach((skillId) => {
            const metrics = report.get(skillId) ?? {
              equippedEncounters: 0,
              selectedEncounters: 0,
              uses: 0,
              latestRound: 0,
            };
            const uses = focalSkillEvents.filter((event) => event.skillId === skillId);
            metrics.equippedEncounters += 1;
            if (uses.length > 0) metrics.selectedEncounters += 1;
            metrics.uses += uses.length;
            metrics.latestRound = Math.max(
              metrics.latestRound,
              ...uses.map((event) => typeof event.round === "number" ? event.round : 0),
            );
            report.set(skillId, metrics);
          });
        });
      });
    });

    expect(Object.fromEntries(["wind_blade", "holy_mark", "static_trap"].map((skillId) => [
      skillId,
      report.get(skillId),
    ]))).toEqual({
      holy_mark: {
        equippedEncounters: 4, latestRound: 4, selectedEncounters: 2, uses: 4,
      },
      static_trap: {
        equippedEncounters: 4, latestRound: 1, selectedEncounters: 2, uses: 2,
      },
      wind_blade: {
        equippedEncounters: 20, latestRound: 4, selectedEncounters: 10, uses: 20,
      },
    });
  });

  it("gives every representative support class non-zero ordinary buff or debuff usage", () => {
    const classByType = new Map(combatClasses.map((classInfo) => [classInfo.type, classInfo]));
    const scenarios = [
      {
        classType: "Aède",
        skillId: "inspiring_song",
        monster: simulatedMonster(3),
        allies: [180, 190, 200],
      },
      {
        classType: "Aède",
        skillId: "discordant_chord",
        monster: { ...simulatedMonster(3), atk: 180, def: 120 },
        allies: [] as number[],
      },
      {
        classType: "Druide",
        skillId: "thorn_grasp",
        monster: { ...simulatedMonster(3), atk: 180, def: 120 },
        allies: [] as number[],
      },
      {
        classType: "Druide",
        skillId: "barkskin",
        monster: { ...simulatedMonster(3), atk: 280, def: 120 },
        allies: [100],
      },
      {
        classType: "Acolyte",
        skillId: "sacred_barrier",
        monster: { ...simulatedMonster(3), atk: 280, def: 120 },
        allies: [100],
      },
      {
        classType: "Artificier",
        skillId: "overcharged_core",
        monster: { ...simulatedMonster(3), def: 0 },
        allies: [300],
      },
    ] as const;
    const usage = new Map<string, number>();

    scenarios.forEach((scenario, scenarioIndex) => {
      const classInfo = classByType.get(scenario.classType);
      if (!classInfo) throw new Error(`Missing simulated class ${scenario.classType}`);
      const actor = simulatedHero(classInfo, scenarioIndex);
      actor.activeSkills = [scenario.skillId];
      const allies = scenario.allies.map((physicalDamage, allyIndex) => {
        const ally = simulatedHero(
          combatClasses[(scenarioIndex + allyIndex + 1) % combatClasses.length],
          30 + scenarioIndex * 4 + allyIndex,
        );
        return {
          ...ally,
          calculatedStats: {
            ...ally.calculatedStats,
            physicalDamage,
            physicalDefense: scenario.classType === "Acolyte" || scenario.skillId === "barkskin"
              ? 100
              : ally.calculatedStats.physicalDefense,
          },
        };
      });
      const enemy = {
        ...scenario.monster,
        hp: 3_000,
        maxHp: 3_000,
        isBoss: false,
      };
      const actionContext: HeroActionContext = {
        hero: actor,
        heroes: [actor, ...allies],
        monster: enemy,
        floor: 10,
        room: 2,
        finalRoom: 10,
        round: 1,
      };
      const chosen = chooseHeroAction(actionContext);
      const replayed = chooseHeroAction(structuredClone(actionContext));
      const skill = getSkillById(chosen.skillId ?? "");

      expect(chosen, scenario.classType).toEqual(replayed);
      expect(chosen, scenario.classType).toMatchObject({
        kind: "skill",
        skillId: scenario.skillId,
      });
      expect(["buff", "debuff"], scenario.classType).toContain(skill?.effect.type);
      expect(chosen.reason, scenario.classType).toMatch(/^useful_combat_(buff|debuff)$/);
      usage.set(scenario.classType, (usage.get(scenario.classType) ?? 0) + 1);
    });

    expect(Object.fromEntries(usage)).toEqual({
      "Aède": 2,
      Druide: 2,
      Acolyte: 1,
      Artificier: 1,
    });
  });

  it("replays varied authoritative parties, floors and seeds without corrupting state", () => {
    const parties = [
      [0, 3, 4, 1],
      [8, 6, 2, 5],
      [7, 0, 4, 3],
    ].map((indices, partyIndex) => indices.map((classIndex, heroIndex) => (
      simulatedHero(combatClasses[classIndex], partyIndex * 10 + heroIndex)
    )));
    let simulatedResolutions = 0;

    parties.forEach((party, partyIndex) => {
      [1, 10, 30].forEach((floor) => {
        Array.from({ length: 12 }, (_, seedIndex) => seedIndex).forEach((seedIndex) => {
          const source = authoritativeState(structuredClone(party), floor);
          const before = structuredClone(source);
          const seed = 0x850000 + partyIndex * 10_000 + floor * 100 + seedIndex;
          const encounterId = `simulation-${partyIndex}-${floor}-${seedIndex}`;
          const first = resolveAuthoritativeDungeonEncounter(source, encounterId, seededRng(seed));
          const replay = resolveAuthoritativeDungeonEncounter(before, encounterId, seededRng(seed));

          expect(first).toEqual(replay);
          expect(source).toEqual(before);
          expect(first.encounter.transcript.map((event) => event.sequence))
            .toEqual(first.encounter.transcript.map((_, index) => index));
          expect(["victory", "defeat"]).toContain(first.encounter.outcome);
          expect(first.state.heroes).toHaveLength(party.length);
          first.state.heroes?.forEach((hero) => {
            expect(Number.isFinite(hero.currentHp)).toBe(true);
            expect(Number.isFinite(hero.currentMana)).toBe(true);
            expect(hero.currentHp).toBeGreaterThanOrEqual(0);
            expect(hero.currentHp).toBeLessThanOrEqual(hero.calculatedStats.maxHp);
            expect(hero.currentMana).toBeGreaterThanOrEqual(0);
            expect(hero.currentMana).toBeLessThanOrEqual(hero.calculatedStats.maxMana);
          });
          simulatedResolutions += 2;
        });
      });
    });

    expect(simulatedResolutions).toBe(216);
  });
});
