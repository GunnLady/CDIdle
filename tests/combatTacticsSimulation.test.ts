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

function simulatedHero(classInfo: ClassInfo, index: number): Hero {
  const maxHp = 420 + index * 17;
  const maxMana = 180 + index * 11;
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
      ...makeHero().calculatedStats,
      maxHp,
      hp: maxHp,
      maxMana,
      mana: maxMana,
      physicalDamage: 65 + index * 5,
      magicDamage: 65 + (combatClasses.length - index) * 5,
      physicalDefense: 18 + index,
      magicDefense: 18 + index,
      speed: 20 + index,
      criticalChance: 8 + index,
      dodgeChance: 3 + index / 2,
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

    combatClasses.forEach((classInfo, classIndex) => {
      [0, 35, 100].forEach((manaPercent) => {
        [15, 55, 100].forEach((hpPercent) => {
          [1, 5, 10].forEach((room) => {
            [0, 1].forEach((monsterVariant) => {
              const actor = simulatedHero(classInfo, classIndex);
              actor.currentMana = Math.floor(actor.calculatedStats.maxMana * manaPercent / 100);
              actor.currentHp = Math.max(1, Math.floor(actor.calculatedStats.maxHp * hpPercent / 100));
              const ally = simulatedHero(
                combatClasses[(classIndex + 1) % combatClasses.length],
                classIndex + 20,
              );
              ally.currentHp = Math.max(1, Math.floor(ally.calculatedStats.maxHp * hpPercent / 200));
              const monster = simulatedMonster(classIndex + monsterVariant);
              const context: HeroActionContext = {
                hero: actor,
                heroes: [actor, ally],
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
